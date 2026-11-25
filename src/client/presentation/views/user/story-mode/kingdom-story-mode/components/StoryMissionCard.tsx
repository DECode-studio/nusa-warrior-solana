"use client";

import React from "react";
import { BookOpen, Check, Crown } from "lucide-react";
import type { StoryMissionEntity } from "@/client/domain/story-mode/entity/story_mode_entity";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { KINGDOM_STORY_MODE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { KINGDOM_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";

interface StoryMissionCardProps {
  mission: StoryMissionEntity;
  kingdom: "MAJAPAHIT" | "PAJAJARAN";
  previousChoiceText: string | null;
  disabled: boolean;
  onOpen: () => void;
}

export function StoryMissionCard({
  mission,
  kingdom,
  previousChoiceText,
  disabled,
  onOpen,
}: StoryMissionCardProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const isFinalBoss = mission.kind === "FINAL_BOSS";
  const isMajapahit = kingdom === "MAJAPAHIT";
  const replayReward = Math.max(1, Math.floor(mission.replayPointBase * Math.pow(0.5, mission.replayCount)));

  const cardBorderClass = mission.completed
    ? "border-emerald/40 bg-surface-elevated/95"
    : mission.unlocked
      ? "border-border-base bg-surface-elevated hover:border-border-strong"
      : "border-border-subtle/40 bg-surface-muted/60 opacity-60";

  return (
    <IntellioCard
      as="article"
      id={`${KINGDOM_STORY_MODE_SEMANTIC_IDS.MISSION_PREFIX}${mission.id}`}
      variant="flat"
      padding="sm"
      className={`transition-all duration-300 border ${cardBorderClass}`}
    >
      <div className="flex flex-col gap-4 p-1 sm:flex-row sm:items-start sm:p-2">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display font-bold ${
            mission.completed
              ? "bg-emerald/15 text-emerald-light"
              : isFinalBoss
                ? "bg-amber/15 text-amber-light"
                : isMajapahit
                  ? "bg-amber/15 text-amber-light"
                  : "bg-emerald/15 text-emerald-light"
          }`}
        >
          {mission.completed ? (
            <Check className="h-5 w-5" />
          ) : isFinalBoss ? (
            <Crown className="h-5 w-5" />
          ) : (
            <span>{mission.chapter}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral" size="sm">
              {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.CHAPTER, { chapter: mission.chapter })}
            </Badge>
            {isFinalBoss && (
              <Badge variant="amber" size="sm" icon={<Crown className="h-3 w-3" />}>
                {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.FINAL_BOSS)}
              </Badge>
            )}
            {mission.completed && (
              <Badge variant="emerald" size="sm" icon={<Check className="h-3 w-3" />}>
                {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.COMPLETED)} · {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.REPLAY_COUNT, { count: mission.replayCount })}
              </Badge>
            )}
          </div>

          <h3 className="nc-type-card-title mt-2 font-display font-bold text-white text-lg sm:text-xl">
            {getStoryLocalizedText(mission.title, mission.translations?.title, locale)}
          </h3>
          <p className="nc-type-caption mt-1 text-xs font-semibold text-subtle">
            {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.OPPONENT, { name: getStoryLocalizedText(mission.opponentTitle, mission.translations?.opponentTitle, locale) })}
          </p>
          <p className="nc-type-body-sm mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            {getStoryLocalizedText(mission.intro, mission.translations?.intro, locale)}
          </p>

          {previousChoiceText && (
            <div className="mt-3 rounded-[var(--radius-control)] border border-border-subtle bg-surface-base px-3 py-2 text-xs text-muted">
              {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.PREVIOUS_CHOICE, { choice: previousChoiceText })}
            </div>
          )}

          <p className="nc-type-caption mt-3 text-xs leading-5 text-subtle">
            {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.OBJECTIVE, { objective: getStoryLocalizedText(mission.objective, mission.translations?.objective, locale) })}
            {" · "}
            {t(
              mission.replayCount > 0
                ? KINGDOM_STORY_MODE_TEXT_CONSTANT.REPLAY_REWARD
                : KINGDOM_STORY_MODE_TEXT_CONSTANT.FIRST_REWARD,
              {
                points: mission.replayCount > 0 ? replayReward : mission.replayPointBase,
              }
            )}
          </p>
          {isFinalBoss && (
            <p className="mt-1 text-xs font-semibold text-amber-light">
              {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.FINAL_REWARD)}
            </p>
          )}
        </div>

        <Button
          id={`${KINGDOM_STORY_MODE_SEMANTIC_IDS.MISSION_DETAIL_PREFIX}${mission.id}`}
          variant={isFinalBoss ? "amber" : isMajapahit ? "amber" : "emerald"}
          size="sm"
          shape="rounded"
          disabled={disabled}
          onClick={onOpen}
          leftIcon={<BookOpen className="h-4 w-4" />}
          className="shrink-0"
        >
          {t(KINGDOM_STORY_MODE_TEXT_CONSTANT.READ_STORY)}
        </Button>
      </div>
    </IntellioCard>
  );
}
