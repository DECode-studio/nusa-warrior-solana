"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import type { StoryCampaignEntity, StoryKingdomEntity, StoryMissionEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { getService } from "@/core/di/container";
import { DECK_USECASE_TOKEN, STORY_MODE_USECASE_TOKEN } from "@/core/di/tokens";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { STORY_DETAIL_TEXT_CONSTANT } from "../constants/TextConstant";

const ACTIVE_BATTLE_KEY = "nusa-active-battle-session";

export function useStoryDetail() {
  const router = useRouter();
  const { locale } = useTranslator();
  const [kingdom, setKingdom] = useState<StoryKingdomEntity | null>(null);
  const [campaign, setCampaign] = useState<StoryCampaignEntity | null>(null);
  const [mission, setMission] = useState<StoryMissionEntity | null>(null);
  const [decks, setDecks] = useState<DeckEntity[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams(window.location.search);
    const rawKingdom = params.get("kingdom");
    const missionId = params.get("missionId");
    if ((rawKingdom !== "MAJAPAHIT" && rawKingdom !== "PAJAJARAN") || !missionId) {
      router.replace(ROUTES.USER_KINGDOM_LIST_STORY(locale));
      setLoading(false);
      return;
    }
    setKingdom(rawKingdom);
    setLoading(true);
    setError(null);
    try {
      const [campaigns, ownedDecks] = await Promise.all([
        getService(STORY_MODE_USECASE_TOKEN).getCampaigns(),
        getService(DECK_USECASE_TOKEN).getDecks(),
      ]);
      const foundCampaign = campaigns.find((item) => item.kingdom === rawKingdom) ?? null;
      const foundMission = foundCampaign?.missions.find((item) => item.id === missionId) ?? null;
      if (!foundCampaign || !foundMission || !foundMission.unlocked) {
        router.replace(ROUTES.USER_KINGDOM_STORY_MODE(locale, rawKingdom));
        return;
      }
      setCampaign(foundCampaign);
      setMission(foundMission);
      setSceneIndex(0);
      setDecks(ownedDecks);
      setSelectedDeckId((current) => current || ownedDecks[0]?.id || "");
      setSelectedChoiceId((current) => current || foundMission.choices[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : STORY_DETAIL_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [locale, router]);

  useEffect(() => { void loadStory(); }, [loadStory]);

  const goBack = (): void => {
    if (kingdom) router.push(ROUTES.USER_KINGDOM_STORY_MODE(locale, kingdom));
    else router.push(ROUTES.USER_KINGDOM_LIST_STORY(locale));
  };

  const startMission = async (): Promise<void> => {
    if (!campaign || !mission || !kingdom || starting || (campaign.progress.isComplete && !selectedDeckId)) return;
    setStarting(true);
    setError(null);
    try {
      const result = await getService(STORY_MODE_USECASE_TOKEN).startMission({
        kingdom,
        missionId: mission.id,
        choiceId: selectedChoiceId || null,
        deckId: campaign.progress.isComplete ? selectedDeckId : `story:${kingdom}:${mission.id}`,
        idempotencyKey: crypto.randomUUID(),
      });
      window.localStorage.setItem(ACTIVE_BATTLE_KEY, result.battleSessionId);
      window.sessionStorage.setItem(ACTIVE_BATTLE_KEY, result.battleSessionId);
      router.push(ROUTES.USER_BATTLE_ARENA(locale));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : STORY_DETAIL_TEXT_CONSTANT.LOAD_ERROR);
      setStarting(false);
    }
  };

  return {
    kingdom,
    campaign,
    mission,
    decks,
    selectedDeckId,
    setSelectedDeckId,
    selectedChoiceId,
    sceneIndex,
    setSceneIndex,
    setSelectedChoiceId,
    loading,
    starting,
    error,
    retry: loadStory,
    goBack,
    startMission,
  };
}
