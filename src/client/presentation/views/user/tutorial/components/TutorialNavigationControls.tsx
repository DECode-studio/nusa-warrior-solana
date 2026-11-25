"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Swords } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { TUTORIAL_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TUTORIAL_TEXT_CONSTANT } from "../constants/TextConstant";

export interface TutorialNavigationControlsProps {
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly onPrevStep: () => void;
  readonly onNextStep: () => void;
}

export function TutorialNavigationControls({
  currentStepIndex,
  totalSteps,
  onPrevStep,
  onNextStep,
}: TutorialNavigationControlsProps): React.ReactElement {
  const { locale, t } = useTranslator();
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div
      id={TUTORIAL_SEMANTIC_IDS.NAV_CONTROLS}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border-base pt-4"
    >
      <Button
        id={TUTORIAL_SEMANTIC_IDS.PREV_BTN}
        onClick={onPrevStep}
        disabled={currentStepIndex === 0}
        variant="secondary"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
      >
        {t(TUTORIAL_TEXT_CONSTANT.PREV_STEP_KEY)}
      </Button>

      {isLastStep ? (
        <Button
          id={TUTORIAL_SEMANTIC_IDS.START_REAL_BATTLE_BTN}
          href={ROUTES.USER_BATTLE(locale)}
          variant="primary"
          size="sm"
          leftIcon={<Swords className="h-4 w-4" aria-hidden="true" />}
        >
          {t(TUTORIAL_TEXT_CONSTANT.START_BATTLE_KEY)}
        </Button>
      ) : (
        <Button
          id={TUTORIAL_SEMANTIC_IDS.NEXT_BTN}
          onClick={onNextStep}
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {t(TUTORIAL_TEXT_CONSTANT.NEXT_STEP_KEY)}
        </Button>
      )}
    </div>
  );
}

