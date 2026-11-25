"use client";

import React from "react";
import { Crown } from "lucide-react";
import type { StoryCampaignEntity, StoryMissionEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { Badge, IntellioCard } from "@/client/presentation/components/ui";
import { KINGDOM_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";

interface StoryCampaignEndingProps {
  mission: StoryMissionEntity;
  accent: string;
  kingdom?: StoryCampaignEntity["kingdom"];
}

export function StoryCampaignEnding({
  mission,
  kingdom = "MAJAPAHIT",
}: StoryCampaignEndingProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const isMajapahit = kingdom === "MAJAPAHIT";

  return (
    <IntellioCard
      as="section"
      variant="flat"
      padding="lg"
      className={`relative mt-7 overflow-hidden border ${
        isMajapahit
          ? "border-amber/50 bg-gradient-to-br from-amber/15 via-surface-elevated to-surface-base"
          : "border-emerald/50 bg-gradient-to-br from-emerald/15 via-surface-elevated to-surface-base"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-12 opacity-10 ${
          isMajapahit ? "text-amber" : "text-emerald"
        }`}
        aria-hidden="true"
      >
        <Crown className="h-52 w-52" />
      </div>
      <div className="relative">
        <Badge variant={isMajapahit ? "amber" : "emerald"} size="sm">
          {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.ENDING)}
        </Badge>
        <h2 className="nc-type-section-title mt-3 max-w-3xl font-display font-bold text-white sm:text-3xl">
          {getStoryLocalizedText(mission.endingTitle, mission.translations?.endingTitle, locale)}
        </h2>
        <p className="nc-type-body-sm mt-4 max-w-3xl text-sm leading-relaxed text-cream/90 sm:text-base">
          {getStoryLocalizedText(mission.ending, mission.translations?.ending, locale)}
        </p>
        <p className="mt-5 text-xs text-subtle">
          {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.ENDING_DISCLAIMER)}
        </p>
      </div>
    </IntellioCard>
  );
}
