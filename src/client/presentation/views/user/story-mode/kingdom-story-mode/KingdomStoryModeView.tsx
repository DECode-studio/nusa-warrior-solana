"use client";

import React from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button, IntellioCard } from "@/client/presentation/components/ui";
import { UserFeedback, UserPageHeading } from "@/client/presentation/components/user";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { StoryCampaignEnding, StoryMissionCard } from "./components";
import { useKingdomStoryMode } from "./hooks/useKingdomStoryMode";
import { KINGDOM_STORY_MODE_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { KINGDOM_STORY_MODE_TEXT_CONSTANT } from "./constants/TextConstant";

export function KingdomStoryModeView(): React.ReactElement {
  const { t, locale } = useTranslator();
  const story = useKingdomStoryMode();

  if (story.loading) {
    return (
      <div id={KINGDOM_STORY_MODE_SEMANTIC_IDS.ROOT} className="w-full space-y-6">
        <UserFeedback
          kind="loading"
          title={t(KINGDOM_STORY_MODE_TEXT_CONSTANT.LOADING)}
        />
      </div>
    );
  }

  if (!story.campaign || !story.kingdom) {
    return (
      <div id={KINGDOM_STORY_MODE_SEMANTIC_IDS.ROOT} className="w-full space-y-6">
        <UserFeedback
          kind="error"
          title={story.error ?? t(KINGDOM_STORY_MODE_TEXT_CONSTANT.LOAD_ERROR)}
          action={
            <Button
              variant="secondary"
              shape="rounded"
              onClick={() => void story.retry()}
            >
              {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.RETRY)}
            </Button>
          }
        />
      </div>
    );
  }

  const { campaign } = story;
  const isMajapahit = campaign.kingdom === "MAJAPAHIT";

  return (
    <div id={KINGDOM_STORY_MODE_SEMANTIC_IDS.ROOT} className="w-full space-y-6">
      <div>
        <Button
          id={KINGDOM_STORY_MODE_SEMANTIC_IDS.BACK}
          variant="ghost"
          size="sm"
          shape="rounded"
          onClick={story.goBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-3 text-subtle hover:text-white"
        >
          {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.BACK)}
        </Button>

        <UserPageHeading
          variant="hero"
          eyebrowVariant={isMajapahit ? "amber" : "emerald"}
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.CAMPAIGN)} ·{" "}
                {isMajapahit ? "Majapahit" : "Pajajaran"}
              </span>
            </span>
          }
          title={getStoryLocalizedText(campaign.title, campaign.translations?.title, locale)}
          description={getStoryLocalizedText(campaign.subtitle, campaign.translations?.subtitle, locale)}
        />
      </div>

      {story.error && (
        <UserFeedback
          kind="error"
          title={story.error}
          action={
            <Button
              variant="secondary"
              size="sm"
              shape="rounded"
              onClick={() => void story.retry()}
            >
              {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.RETRY)}
            </Button>
          }
        />
      )}

      <IntellioCard as="section" variant="elevated" padding="md" className="space-y-6">
        <div className="flex flex-col gap-2 border-b border-border-subtle pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-xs font-bold ${
                isMajapahit ? "text-amber-light" : "text-emerald-light"
              }`}
            >
              {isMajapahit ? "Majapahit" : "Pajajaran"} · {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.CAMPAIGN)} · {getStoryLocalizedText(campaign.title, campaign.translations?.title, locale)}
            </p>
            <h2 className="nc-type-section-title mt-2 font-display font-bold text-cream">
              {campaign.title}
            </h2>
          </div>
          <p className="text-xs text-subtle sm:text-sm">
            {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.FINAL_REWARD)}
          </p>
        </div>

        <div className="space-y-4">
          {campaign.missions.map((mission, index) => {
            const previousMission = campaign.missions[index - 1];
            const previousChoiceText = mission.previousChoice
              ? (() => {
                  const choice = previousMission?.choices.find((item) => item.id === mission.previousChoice);
                  return choice
                    ? getStoryLocalizedText(choice.consequence, choice.translations?.consequence, locale)
                    : null;
                })()
              : null;
            return (
              <StoryMissionCard
                key={mission.id}
                mission={mission}
                kingdom={campaign.kingdom}
                previousChoiceText={previousChoiceText}
                disabled={!mission.unlocked}
                onOpen={() => story.openMission(mission)}
              />
            );
          })}
        </div>

        {story.isCampaignComplete && story.finalMission && (
          <StoryCampaignEnding
            mission={story.finalMission}
            accent={campaign.accent}
            kingdom={campaign.kingdom}
          />
        )}
      </IntellioCard>
    </div>
  );
}
