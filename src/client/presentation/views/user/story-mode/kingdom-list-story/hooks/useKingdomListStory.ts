"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoryCampaignEntity, StoryKingdomEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { getService } from "@/core/di/container";
import { STORY_MODE_USECASE_TOKEN } from "@/core/di/tokens";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { KINGDOM_LIST_STORY_TEXT_CONSTANT } from "../constants/TextConstant";

export function useKingdomListStory() {
  const router = useRouter();
  const { locale } = useTranslator();
  const [campaigns, setCampaigns] = useState<StoryCampaignEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await getService(STORY_MODE_USECASE_TOKEN).getCampaigns());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : KINGDOM_LIST_STORY_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCampaigns(); }, [loadCampaigns]);

  const openCampaign = (kingdom: StoryKingdomEntity): void => {
    router.push(ROUTES.USER_KINGDOM_STORY_MODE(locale, kingdom));
  };

  return { campaigns, loading, error, retry: loadCampaigns, openCampaign };
}
