"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { UserFeedback, UserPageHeading } from "@/client/presentation/components/user";
import { KingdomCampaignCard } from "./components";
import { useKingdomListStory } from "./hooks/useKingdomListStory";
import { KINGDOM_LIST_STORY_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { KINGDOM_LIST_STORY_TEXT_CONSTANT } from "./constants/TextConstant";

export function KingdomListStoryView(): React.ReactElement {
  const { t } = useTranslator();
  const { campaigns, loading, error, retry, openCampaign } = useKingdomListStory();

  return (
    <div id={KINGDOM_LIST_STORY_SEMANTIC_IDS.ROOT} className="w-full space-y-6">
      <div id={KINGDOM_LIST_STORY_SEMANTIC_IDS.HEADING}>
        <UserPageHeading
          variant="hero"
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t(KINGDOM_LIST_STORY_TEXT_CONSTANT.EYEBROW)}</span>
            </span>
          }
          title={t(KINGDOM_LIST_STORY_TEXT_CONSTANT.TITLE)}
          description={t(KINGDOM_LIST_STORY_TEXT_CONSTANT.DESCRIPTION)}
        />
      </div>

      {loading && (
        <UserFeedback
          kind="loading"
          title={t(KINGDOM_LIST_STORY_TEXT_CONSTANT.LOADING)}
        />
      )}

      {!loading && error && (
        <UserFeedback
          kind="error"
          title={error === KINGDOM_LIST_STORY_TEXT_CONSTANT.LOAD_ERROR ? t(error) : error}
          action={
            <Button
              id={KINGDOM_LIST_STORY_SEMANTIC_IDS.RETRY}
              variant="secondary"
              shape="rounded"
              onClick={() => void retry()}
            >
              {t(KINGDOM_LIST_STORY_TEXT_CONSTANT.RETRY)}
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <section
          aria-labelledby={KINGDOM_LIST_STORY_SEMANTIC_IDS.HEADING}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {campaigns.map((campaign) => (
            <KingdomCampaignCard
              key={campaign.kingdom}
              campaign={campaign}
              onSelect={openCampaign}
            />
          ))}
        </section>
      )}
    </div>
  );
}
