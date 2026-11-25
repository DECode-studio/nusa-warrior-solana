"use client";

import React from "react";
import { Check, ChevronRight, Crown } from "lucide-react";
import type { StoryCampaignEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { KINGDOM_LIST_STORY_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { KINGDOM_LIST_STORY_TEXT_CONSTANT } from "../constants/TextConstant";

interface KingdomCampaignCardProps {
  campaign: StoryCampaignEntity;
  onSelect: (kingdom: StoryCampaignEntity["kingdom"]) => void;
}

export function KingdomCampaignCard({
  campaign,
  onSelect,
}: KingdomCampaignCardProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const isComplete = campaign.progress.isComplete;
  const completedCount = campaign.progress.completedMissionIds.length;
  const isMajapahit = campaign.kingdom === "MAJAPAHIT";
  const progressPercent = Math.round(
    (completedCount / Math.max(1, campaign.missions.length)) * 100
  );

  return (
    <IntellioCard
      as="article"
      variant="elevated"
      padding="md"
      className="group relative flex min-h-64 flex-col justify-between gap-6 transition-all duration-300 hover:border-border-strong hover:-translate-y-1"
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20 ${
          isMajapahit
            ? "bg-[radial-gradient(ellipse_at_90%_0%,var(--color-amber),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_90%_0%,var(--color-emerald),transparent_60%)]"
        }`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Badge variant={isMajapahit ? "amber" : "emerald"} size="sm">
            {isMajapahit ? "Majapahit" : "Pajajaran"}
          </Badge>
          <h2 className="nc-type-card-title mt-3 font-display font-bold text-white md:text-2xl">
            {getStoryLocalizedText(campaign.title, campaign.translations?.title, locale)}
          </h2>
          <p className="nc-type-body-sm mt-2 max-w-lg text-muted leading-relaxed">
            {getStoryLocalizedText(campaign.subtitle, campaign.translations?.subtitle, locale)}
          </p>
        </div>
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
            isMajapahit
              ? "bg-amber/15 text-amber-light"
              : "bg-emerald/15 text-emerald-light"
          }`}
          aria-hidden="true"
        >
          {isComplete ? <Check className="h-6 w-6" /> : <Crown className="h-6 w-6" />}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-36 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs text-subtle">
            <span>
              {t(KINGDOM_LIST_STORY_TEXT_CONSTANT.PROGRESS, {
                completed: completedCount,
                total: campaign.missions.length,
              })}
            </span>
            <span className="font-semibold text-cream">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-base border border-border-subtle">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMajapahit ? "bg-amber" : "bg-emerald"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <Button
          id={`${KINGDOM_LIST_STORY_SEMANTIC_IDS.CAMPAIGN_PREFIX}${campaign.kingdom.toLowerCase()}`}
          variant={isMajapahit ? "amber" : "emerald"}
          size="sm"
          shape="rounded"
          onClick={() => onSelect(campaign.kingdom)}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          {t(
            isComplete
              ? KINGDOM_LIST_STORY_TEXT_CONSTANT.COMPLETED
              : KINGDOM_LIST_STORY_TEXT_CONSTANT.ENTER
          )}
        </Button>
      </div>
    </IntellioCard>
  );
}
