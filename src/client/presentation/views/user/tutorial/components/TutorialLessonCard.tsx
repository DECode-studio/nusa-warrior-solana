"use client";

import React from "react";
import { BookOpen, CheckCircle2, Play } from "lucide-react";
import type { TutorialStepLesson } from "../hooks/useTutorial";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { TUTORIAL_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TUTORIAL_TEXT_CONSTANT } from "../constants/TextConstant";

export interface TutorialLessonCardProps {
  readonly lesson: TutorialStepLesson;
  readonly actionCompleted: boolean;
  readonly onExecuteAction: () => void;
}

export function TutorialLessonCard({
  lesson,
  actionCompleted,
  onExecuteAction,
}: TutorialLessonCardProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={TUTORIAL_SEMANTIC_IDS.LESSON_CARD}
      className="space-y-4 lg:col-span-7"
    >
      <h3 className="font-display text-2xl font-bold text-cream">
        {t(lesson.titleKey)}
      </h3>

      <div
        id={TUTORIAL_SEMANTIC_IDS.CULTURAL_HIGHLIGHT}
        className="rounded-xl border border-amber/20 bg-amber/10 p-4 text-xs text-cream"
      >
        <div className="flex items-center gap-1.5 font-bold">
          <BookOpen className="h-4 w-4 text-amber-light" aria-hidden="true" />
          <span>{t(TUTORIAL_TEXT_CONSTANT.CULTURAL_HIGHLIGHT_LABEL)}</span>
        </div>
        <p className="mt-1 leading-relaxed text-muted">
          {t(lesson.culturalHighlightKey)}
        </p>
      </div>

      <div
        id={TUTORIAL_SEMANTIC_IDS.RULE_EXPLANATION}
        className="rounded-xl border border-border-base bg-surface-elevated/40 p-4 text-sm leading-relaxed text-cream"
      >
        {t(lesson.ruleExplanationKey)}
      </div>

      <div className="space-y-3 rounded-xl border border-border-base bg-surface-elevated/40 p-4">
        <div className="font-display text-sm font-bold text-cream">
          {t(TUTORIAL_TEXT_CONSTANT.INTERACTIVE_EXERCISE_LABEL)}
        </div>
        <p className="text-sm text-muted">
          {t(lesson.interactiveTaskPromptKey)}
        </p>

        <Button
          type="button"
          id={TUTORIAL_SEMANTIC_IDS.ACTION_BTN}
          onClick={onExecuteAction}
          size="sm"
          leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
        >
          {t(lesson.actionButtonLabelKey)}
        </Button>

        {actionCompleted && (
          <div
            id={TUTORIAL_SEMANTIC_IDS.TASK_FEEDBACK}
            className="flex items-center gap-2 rounded-lg border border-emerald/20 bg-emerald/10 p-3 text-xs font-semibold text-emerald-light"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t(lesson.outcomeFeedbackKey)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
