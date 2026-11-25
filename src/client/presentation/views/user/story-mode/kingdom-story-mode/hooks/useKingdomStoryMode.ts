"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoryCampaignEntity, StoryKingdomEntity, StoryMissionEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { getService } from "@/core/di/container";
import { STORY_MODE_USECASE_TOKEN } from "@/core/di/tokens";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { KINGDOM_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";

export function useKingdomStoryMode() {
  const router = useRouter();
  const { locale } = useTranslator();
  const [kingdom, setKingdom] = useState<StoryKingdomEntity | null>(null);
  const [campaign, setCampaign] = useState<StoryCampaignEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams(window.location.search);
    const rawKingdom = params.get("kingdom");
    if (rawKingdom !== "MAJAPAHIT" && rawKingdom !== "PAJAJARAN") {
      setLoading(false);
      router.replace(ROUTES.USER_KINGDOM_LIST_STORY(locale));
      return;
    }
    setKingdom(rawKingdom);
    setLoading(true);
    setError(null);
    try {
      const campaigns = await getService(STORY_MODE_USECASE_TOKEN).getCampaigns();
      setCampaign(campaigns.find((item) => item.kingdom === rawKingdom) ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : KINGDOM_STORY_MODE_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [locale, router]);

  useEffect(() => { void loadStory(); }, [loadStory]);

  const finalMission = useMemo(() => campaign?.missions.at(-1) ?? null, [campaign]);
  const isCampaignComplete = campaign?.progress.isComplete ?? false;

  const openMission = (mission: StoryMissionEntity): void => {
    if (!kingdom || !mission.unlocked) return;
    router.push(ROUTES.USER_STORY_DETAIL(locale, kingdom, mission.id));
  };
  const goBack = (): void => router.push(ROUTES.USER_KINGDOM_LIST_STORY(locale));

  return {
    kingdom,
    campaign,
    loading,
    error,
    retry: loadStory,
    finalMission,
    isCampaignComplete,
    openMission,
    goBack,
  };
}
