import "server-only";
import { ALL_CARDS_CATALOG } from "@/core/constants/cards-catalog";
import { AppError } from "@/server/shared/errors/app-error";
import { logServerEvent } from "@/server/shared/logging/server-logger";
import type { BotDifficulty } from "@/client/domain/battle/entity/battle_entity";
import { createBattleSessionUseCase, getBattleSessionUseCase } from "@/server/modules/battle/application/battle.usecase";
import { storyRepository } from "../infrastructure/story.repository.impl";
import { getStoryMission, type StoryCampaign } from "../domain/story-catalog";
import { listStoryCampaignContent } from "../infrastructure/story-content.repository";

function isLegacyGeneratedStoryDeck(
  deck: StoryCampaign["missions"][number]["storyDeck"],
  kingdom: "MAJAPAHIT" | "PAJAJARAN",
): boolean {
  const legacyCharacters = ALL_CARDS_CATALOG
    .filter((card) => card.cardType === "CHARACTER" && card.kingdom === kingdom)
    .slice(0, 10)
    .map((card) => card.slug);
  const legacyInstruments = ALL_CARDS_CATALOG
    .filter((card) => card.cardType === "INSTRUMENT")
    .slice(0, 10)
    .map((card) => card.slug);
  return deck.characterSlugs.join("|") === legacyCharacters.join("|") &&
    deck.instrumentSlugs.join("|") === legacyInstruments.join("|");
}

export async function getStoryModeUseCase(userId: string) {
  const progress = await storyRepository.listProgress(userId);
  const progressByKingdom = new Map(progress.map((item) => [item.kingdom, item]));
  const campaigns = await listStoryCampaignContent();
  return campaigns.map((campaign) => {
    const status = progressByKingdom.get(campaign.kingdom);
    const completed = new Set(status?.completedMissionIds ?? []);
    return {
      ...campaign,
      progress: status,
      missions: campaign.missions.map((mission, index) => ({
        ...mission,
        completed: completed.has(mission.id),
        unlocked: index === 0 || completed.has(campaign.missions[index - 1]?.id ?? ""),
        replayCount: status?.replayCounts[mission.id] ?? 0,
        previousChoice: index > 0 ? status?.choices[campaign.missions[index - 1]?.id ?? ""] ?? null : null,
      })),
    };
  });
}

export async function startStoryMissionUseCase(input: {
  userId: string;
  kingdom: "MAJAPAHIT" | "PAJAJARAN";
  missionId: string;
  choiceId: string | null;
  deckId: string;
  createRequestKey: string;
}): Promise<{ battle: Awaited<ReturnType<typeof createBattleSessionUseCase>>; mission: StoryCampaign["missions"][number] }> {
  const campaign = (await listStoryCampaignContent()).find((item) => item.kingdom === input.kingdom);
  const mission = campaign?.missions.find((item) => item.id === input.missionId);
  if (!campaign || !mission) throw AppError.notFound("Misi cerita tidak ditemukan.");
  if (mission.choices.length > 0 && !input.choiceId) throw AppError.validation("Pilih satu keputusan cerita sebelum melanjutkan.");
  if (input.choiceId && !mission.choices.some((choice) => choice.id === input.choiceId)) throw AppError.validation("Pilihan cerita tidak valid.");

  const progress = (await storyRepository.listProgress(input.userId)).find((item) => item.kingdom === input.kingdom);
  const complete = Boolean(progress?.isComplete);
  if (complete && input.deckId.startsWith("story:")) throw AppError.validation("Kampanye selesai: gunakan personal deck untuk mengulang misi.");
  if (!complete && !input.deckId.startsWith("story:")) throw AppError.validation("Selesaikan kampanye kerajaan untuk menggunakan personal deck.");
  const missionIndex = campaign.missions.findIndex((item) => item.id === mission.id);
  const previous = campaign.missions[missionIndex - 1];
  if (previous && !progress?.completedMissionIds.includes(previous.id)) throw AppError.forbidden("Selesaikan misi sebelumnya terlebih dahulu.");

  const botDifficulty: BotDifficulty = mission.chapter === 1 ? "EASY" : mission.kind === "FINAL_BOSS" ? "HARD" : "MEDIUM";
  const defaultMission = getStoryMission(input.kingdom, mission.id);
  const storyDeck = defaultMission && isLegacyGeneratedStoryDeck(mission.storyDeck, input.kingdom)
    ? defaultMission.storyDeck
    : mission.storyDeck;
  const opponentDeck = mission.opponentDeck ?? defaultMission?.opponentDeck;
  const selectedDeck = complete ? undefined : storyDeck;
  const battle = await createBattleSessionUseCase({
    userId: input.userId,
    createRequestKey: input.createRequestKey,
    deckId: input.deckId,
    botDifficulty,
    story: { kingdom: input.kingdom, missionId: mission.id, choiceId: input.choiceId },
    storyDeck: selectedDeck ? {
      id: `story:${input.kingdom}:${mission.id}`,
      name: `${campaign.title} · ${mission.title}`,
      characterSlugs: [...selectedDeck.characterSlugs],
      instrumentSlugs: [...selectedDeck.instrumentSlugs],
    } : undefined,
    storyOpponentDeck: opponentDeck ? {
      characterSlugs: [...opponentDeck.characterSlugs],
      instrumentSlugs: [...opponentDeck.instrumentSlugs],
    } : undefined,
  });
  logServerEvent("info", "story.mission.started", { userId: input.userId, kingdom: input.kingdom, missionId: mission.id, battleId: battle.id });
  return { battle, mission };
}

export async function completeStoryMissionUseCase(input: { userId: string; battleSessionId: string }) {
  const session = await getBattleSessionUseCase(input.battleSessionId, input.userId);
  if (!session.storyKingdom || !session.storyMissionId) throw AppError.validation("Pertandingan ini bukan bagian dari Story Mode.");
  const result = await storyRepository.claimMission({
    userId: input.userId,
    battleId: session.id,
    kingdom: session.storyKingdom,
    missionId: session.storyMissionId,
    choiceId: session.storyChoiceId ?? null,
  });
  logServerEvent("info", "story.mission.claimed", {
    userId: input.userId,
    kingdom: session.storyKingdom,
    missionId: session.storyMissionId,
    battleId: session.id,
    points: result.nusaPoints,
    cardSlug: result.rewardCard?.slug ?? null,
    alreadyClaimed: result.alreadyClaimed,
  });
  return result;
}
