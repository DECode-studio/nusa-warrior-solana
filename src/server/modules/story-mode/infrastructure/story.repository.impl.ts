import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { HIGH_END_INSTRUMENT_SLUGS, HIGH_END_MAJAPAHIT_SLUGS, HIGH_END_PAJAJARAN_SLUGS } from "@/core/constants/pack-tiers";
import { getEmbeddedStore, persistEmbeddedStore, type StoredStoryProgressRecord } from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import { grantOwnedCards } from "@/server/modules/collection/infrastructure/collection.repository";
import { grantNusaPointsPrisma, NUSA_POINT_POLICY } from "@/server/modules/nusa-points/domain/nusa-point-policy";
import type { StoryCampaign } from "../domain/story-catalog";
import { listStoryCampaignContent } from "./story-content.repository";

function objectStrings(value: unknown): Record<string, string> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : {};
}

function objectNumbers(value: unknown): Record<string, number> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number"))
    : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapProgress(record: StoredStoryProgressRecord, campaign: StoryCampaign | undefined) {
  return {
    kingdom: record.kingdom,
    completedMissionIds: record.completedMissionIds,
    replayCounts: record.replayCounts,
    choices: record.choices,
    endingSeen: record.endingSeen,
    isComplete: record.endingSeen || Boolean(campaign && campaign.missions.every((mission) => record.completedMissionIds.includes(mission.id))),
  };
}

export class StoryRepositoryImpl {
  public async listProgress(userId: string) {
    const campaigns = await listStoryCampaignContent();
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.storyProgress.findMany({ where: { userId } });
      const byKingdom = new Map(rows.map((row) => [row.kingdom, row]));
      return ["MAJAPAHIT", "PAJAJARAN"].map((kingdom) => {
        const row = byKingdom.get(kingdom as "MAJAPAHIT" | "PAJAJARAN");
        return mapProgress(row ? {
          id: row.id,
          userId: row.userId,
          kingdom: row.kingdom,
          completedMissionIds: stringArray(row.completedMissionIds),
          replayCounts: objectNumbers(row.replayCounts),
          choices: objectStrings(row.choices),
          claimedBattleIds: stringArray(row.claimedBattleIds),
          claimResults: row.claimResults && typeof row.claimResults === "object" && !Array.isArray(row.claimResults) ? row.claimResults as StoredStoryProgressRecord["claimResults"] : {},
          endingSeen: row.endingSeen,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        } : emptyProgress(userId, kingdom as "MAJAPAHIT" | "PAJAJARAN"), campaigns.find((campaign) => campaign.kingdom === kingdom));
      });
    }
    const rows = getEmbeddedStore().storyProgress.filter((row) => row.userId === userId);
    return ["MAJAPAHIT", "PAJAJARAN"].map((kingdom) => mapProgress(
      rows.find((row) => row.kingdom === kingdom) ?? emptyProgress(userId, kingdom as "MAJAPAHIT" | "PAJAJARAN"),
      campaigns.find((campaign) => campaign.kingdom === kingdom),
    ));
  }

  public async claimMission(input: {
    userId: string;
    battleId: string;
    kingdom: "MAJAPAHIT" | "PAJAJARAN";
    missionId: string;
    choiceId: string | null;
  }) {
    const campaign = (await listStoryCampaignContent()).find((item) => item.kingdom === input.kingdom);
    const mission = campaign?.missions.find((item) => item.id === input.missionId);
    if (!campaign || !mission) throw AppError.notFound("Misi cerita tidak ditemukan.");
    const cards = await cardRepository.findMany({ includeWithdrawn: false });

    if (isPrismaDriverEnabled()) {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
          WITH story_lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(8813046, hashtext(${`${input.userId}:${input.kingdom}`}))
          )
          SELECT 1::int AS locked FROM story_lock
        `);
        const battle = await tx.battleSession.findFirst({ where: { id: input.battleId, userId: input.userId } });
        if (!battle || battle.storyKingdom !== input.kingdom || battle.storyMissionId !== input.missionId) {
          throw AppError.forbidden("Pertandingan ini bukan milik misi cerita tersebut.");
        }
        if (battle.status !== "COMPLETED" || (JSON.parse(battle.stateJson) as { winner?: string }).winner !== "PLAYER") {
          throw AppError.validation("Misi hanya dapat diselesaikan setelah memenangkan pertandingan.");
        }
        const row = await tx.storyProgress.findUnique({ where: { userId_kingdom: { userId: input.userId, kingdom: input.kingdom } } });
        const progress = row ? {
          id: row.id,
          completed: stringArray(row.completedMissionIds),
          replays: objectNumbers(row.replayCounts),
          choices: objectStrings(row.choices),
          claimed: stringArray(row.claimedBattleIds),
          results: row.claimResults && typeof row.claimResults === "object" && !Array.isArray(row.claimResults) ? row.claimResults as StoredStoryProgressRecord["claimResults"] : {},
          endingSeen: row.endingSeen,
        } : { id: randomUUID(), completed: [] as string[], replays: {} as Record<string, number>, choices: {} as Record<string, string>, claimed: [] as string[], results: {} as StoredStoryProgressRecord["claimResults"], endingSeen: false };

        if (progress.claimed.includes(input.battleId)) {
          const result = progress.results[input.battleId] ?? { nusaPoints: 0, rewardCard: null };
          return { ...mapProgress({ ...emptyProgress(input.userId, input.kingdom), id: progress.id, completedMissionIds: progress.completed, replayCounts: progress.replays, choices: progress.choices, claimedBattleIds: progress.claimed, claimResults: progress.results, endingSeen: progress.endingSeen }, campaign), ...result, alreadyClaimed: true };
        }
        const missionIndex = campaign.missions.findIndex((item) => item.id === mission.id);
        const previous = campaign.missions[missionIndex - 1];
        if (previous && !progress.completed.includes(previous.id)) throw AppError.forbidden("Selesaikan misi sebelumnya terlebih dahulu.");

        const isFirstClear = !progress.completed.includes(mission.id);
        const replayIndex = progress.replays[mission.id] ?? 0;
        const pointsRequested = Math.max(1, Math.floor(mission.replayPointBase * Math.pow(0.5, replayIndex)));
        const nusaPoints = await grantNusaPointsPrisma(tx, {
          userId: input.userId,
          amount: pointsRequested,
          source: "STORY_MODE",
          sourceId: input.battleId,
        });
        let rewardCard: { slug: string; name: string; imagePath: string } | null = null;
        const completesCampaign = mission.kind === "FINAL_BOSS" && isFirstClear;
        if (completesCampaign) {
          const highEndSlugs = input.kingdom === "MAJAPAHIT" ? HIGH_END_MAJAPAHIT_SLUGS : HIGH_END_PAJAJARAN_SLUGS;
          const eligibleSlugs = new Set([...highEndSlugs, ...HIGH_END_INSTRUMENT_SLUGS]);
          const owned = await tx.userCard.findMany({ where: { userId: input.userId, quantity: { gt: 0 } }, select: { cardId: true } });
          const ownedIds = new Set(owned.map((item) => item.cardId));
          const eligible = cards.filter((card) => eligibleSlugs.has(card.slug) && !ownedIds.has(card.id));
          if (eligible.length > 0) {
            const selected = eligible[randomInt(eligible.length)];
            if (selected) {
              await grantOwnedCards(input.userId, [selected.slug], `STORY_MODE:${input.battleId}`, tx);
              rewardCard = { slug: selected.slug, name: selected.name, imagePath: selected.imagePath };
            }
          }
          progress.endingSeen = true;
        }
        if (isFirstClear) progress.completed.push(mission.id);
        if (input.choiceId) progress.choices[mission.id] = input.choiceId;
        progress.replays[mission.id] = replayIndex + 1;
        progress.claimed.push(input.battleId);
        progress.results[input.battleId] = { nusaPoints, rewardCard };
        const completedAll = progress.endingSeen || campaign.missions.every((item) => progress.completed.includes(item.id));
        await tx.storyProgress.upsert({
          where: { userId_kingdom: { userId: input.userId, kingdom: input.kingdom } },
          create: {
            id: progress.id,
            userId: input.userId,
            kingdom: input.kingdom,
            completedMissionIds: progress.completed,
            replayCounts: progress.replays,
            choices: progress.choices,
            claimedBattleIds: progress.claimed,
            claimResults: progress.results,
            endingSeen: progress.endingSeen,
          },
          update: {
            completedMissionIds: progress.completed,
            replayCounts: progress.replays,
            choices: progress.choices,
            claimedBattleIds: progress.claimed,
            claimResults: progress.results,
            endingSeen: progress.endingSeen,
          },
        });
        return {
          kingdom: input.kingdom,
          completedMissionIds: progress.completed,
          replayCounts: progress.replays,
          choices: progress.choices,
          endingSeen: progress.endingSeen,
          isComplete: completedAll,
          nusaPoints,
          rewardCard,
          alreadyClaimed: false,
        };
      });
    }

    const store = getEmbeddedStore();
    const battle = store.battleSessions.find((session) => session.id === input.battleId && session.userId === input.userId);
    if (!battle || battle.storyKingdom !== input.kingdom || battle.storyMissionId !== input.missionId) {
      throw AppError.forbidden("Pertandingan ini bukan milik misi cerita tersebut.");
    }
    if (battle.status !== "COMPLETED" || (JSON.parse(battle.stateJson) as { winner?: string }).winner !== "PLAYER") {
      throw AppError.validation("Misi hanya dapat diselesaikan setelah memenangkan pertandingan.");
    }
    const progress = store.storyProgress.find((row) => row.userId === input.userId && row.kingdom === input.kingdom)
      ?? emptyProgress(input.userId, input.kingdom);
    if (!store.storyProgress.includes(progress)) store.storyProgress.push(progress);
    if (progress.claimedBattleIds.includes(input.battleId)) {
      return { ...mapProgress(progress, campaign), ...(progress.claimResults[input.battleId] ?? { nusaPoints: 0, rewardCard: null }), alreadyClaimed: true };
    }
    const missionIndex = campaign.missions.findIndex((item) => item.id === mission.id);
    const previous = campaign.missions[missionIndex - 1];
    if (previous && !progress.completedMissionIds.includes(previous.id)) throw AppError.forbidden("Selesaikan misi sebelumnya terlebih dahulu.");
    const isFirstClear = !progress.completedMissionIds.includes(mission.id);
    const replayIndex = progress.replayCounts[mission.id] ?? 0;
    const pointsRequested = Math.max(1, Math.floor(mission.replayPointBase * Math.pow(0.5, replayIndex)));
    const pointResult = grantEmbeddedStoryPoints(store, input.userId, input.battleId, pointsRequested);
    let rewardCard: { slug: string; name: string; imagePath: string } | null = null;
    if (mission.kind === "FINAL_BOSS" && isFirstClear) {
      const highEndSlugs = input.kingdom === "MAJAPAHIT" ? HIGH_END_MAJAPAHIT_SLUGS : HIGH_END_PAJAJARAN_SLUGS;
      const eligibleSlugs = new Set([...highEndSlugs, ...HIGH_END_INSTRUMENT_SLUGS]);
      const ownedIds = new Set(store.userCards.filter((holding) => holding.userId === input.userId && holding.quantity > 0).map((holding) => holding.cardId));
      const eligible = cards.filter((card) => eligibleSlugs.has(card.slug) && !ownedIds.has(card.id));
      const selected = eligible.length ? eligible[randomInt(eligible.length)] : undefined;
      if (selected) {
        const existing = store.userCards.find((holding) => holding.userId === input.userId && holding.cardId === selected.id);
        if (existing) existing.quantity += 1;
        else store.userCards.push({ id: randomUUID(), userId: input.userId, cardId: selected.id, quantity: 1, source: `STORY_MODE:${input.battleId}`, createdAt: new Date().toISOString() });
        rewardCard = { slug: selected.slug, name: selected.name, imagePath: selected.imagePath };
      }
      progress.endingSeen = true;
    }
    if (isFirstClear) progress.completedMissionIds.push(mission.id);
    if (input.choiceId) progress.choices[mission.id] = input.choiceId;
    progress.replayCounts[mission.id] = replayIndex + 1;
    progress.claimedBattleIds.push(input.battleId);
    progress.claimResults[input.battleId] = { nusaPoints: pointResult, rewardCard };
    progress.updatedAt = new Date().toISOString();
    persistEmbeddedStore(store);
    return { ...mapProgress(progress, campaign), nusaPoints: pointResult, rewardCard, alreadyClaimed: false };
  }
}

function emptyProgress(userId: string, kingdom: "MAJAPAHIT" | "PAJAJARAN"): StoredStoryProgressRecord {
  const now = new Date().toISOString();
  return { id: randomUUID(), userId, kingdom, completedMissionIds: [], replayCounts: {}, choices: {}, claimedBattleIds: [], claimResults: {}, endingSeen: false, createdAt: now, updatedAt: now };
}

function grantEmbeddedStoryPoints(store: ReturnType<typeof getEmbeddedStore>, userId: string, battleId: string, requested: number): number {
  if (store.nusaPointTransactions.some((row) => row.userId === userId && row.source === "STORY_MODE" && row.sourceId === battleId)) return 0;
  const user = store.users.find((row) => row.id === userId);
  if (!user || user.isGuest) return 0;
  const start = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const parts = start.split("-").map(Number);
  const dayStart = Date.UTC(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1) - 7 * 60 * 60 * 1000;
  const earning = new Set(["BATTLE_BOT_WIN", "BATTLE_PVP_WIN", "LEAGUE_MATCH_WIN", "LEAGUE_CHAMPION", "STORY_MODE"]);
  const daily = store.nusaPointTransactions.filter((row) => row.userId === userId && earning.has(row.source) && Date.parse(row.createdAt) >= dayStart);
  const storyEarned = daily.filter((row) => row.source === "STORY_MODE").reduce((sum, row) => sum + Math.max(0, row.amount), 0);
  const totalEarned = daily.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
  const amount = Math.min(requested, Math.max(0, NUSA_POINT_POLICY.dailyStoryCap - storyEarned), Math.max(0, NUSA_POINT_POLICY.dailyTotalCap - totalEarned));
  if (amount <= 0) return 0;
  store.nusaPointTransactions.push({ id: randomUUID(), userId, amount, source: "STORY_MODE", sourceId: battleId, createdAt: new Date().toISOString() });
  return amount;
}

export const storyRepository = new StoryRepositoryImpl();
