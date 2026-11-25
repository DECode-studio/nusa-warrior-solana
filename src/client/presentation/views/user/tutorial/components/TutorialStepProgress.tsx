"use client";

import React from "react";
import type { TutorialStepLesson } from "../hooks/useTutorial";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { TUTORIAL_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TUTORIAL_TEXT_CONSTANT } from "../constants/TextConstant";

export interface TutorialStepProgressProps {
  readonly steps: readonly TutorialStepLesson[];
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly onSelectStep: (index: number) => void;
}

export function TutorialStepProgress({
  steps,
  currentStepIndex,
  totalSteps,
  onSelectStep,
}: TutorialStepProgressProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={TUTORIAL_SEMANTIC_IDS.STEP_PROGRESS}
      role="tablist"
      aria-label={t(TUTORIAL_TEXT_CONSTANT.STEP_ARIA_LABEL)}
      className="flex flex-wrap gap-2"
    >
      {steps.map((step, idx) => (
        <Button
          key={step.stepNumber}
          id={`${TUTORIAL_SEMANTIC_IDS.STEP_TAB_PREFIX}${step.stepNumber}`}
          role="tab"
          ariaSelected={idx === currentStepIndex}
          onClick={() => onSelectStep(idx)}
          variant={
            idx === currentStepIndex
              ? "amber"
              : idx < currentStepIndex
                ? "emerald"
                : "secondary"
          }
          size="sm"
        >
          {t(TUTORIAL_TEXT_CONSTANT.STEP_LABEL_PREFIX)} {step.stepNumber}/{totalSteps}
        </Button>
      ))}
    </div>
  );
}
