"use client";

import React from "react";
import { Swords } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { Button, IntellioCard } from "@/client/presentation/components/ui";
import { UserPageHeading } from "@/client/presentation/components/user";
import {
  TutorialBoardPreview,
  TutorialLessonCard,
  TutorialNavigationControls,
  TutorialStepProgress,
} from "./components";
import { TUTORIAL_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { TUTORIAL_TEXT_CONSTANT } from "./constants/TextConstant";
import { TUTORIAL_STEPS, useTutorial } from "./hooks/useTutorial";

export function UserTutorialView(): React.ReactElement {
  const { locale, t } = useTranslator();
  const {
    currentStepIndex,
    currentLesson,
    totalSteps,
    actionCompleted,
    executeStepAction,
    nextStep,
    prevStep,
    selectStep,
  } = useTutorial();

  return (
    <div id={TUTORIAL_SEMANTIC_IDS.ROOT} className="space-y-6">
      <div id={TUTORIAL_SEMANTIC_IDS.HEADING}>
        <UserPageHeading
          title={t(TUTORIAL_TEXT_CONSTANT.TITLE_KEY)}
          description={t(TUTORIAL_TEXT_CONSTANT.SUBTITLE_KEY)}
          actions={
            <Button
              id={TUTORIAL_SEMANTIC_IDS.START_REAL_BATTLE_BTN}
              href={ROUTES.USER_BATTLE(locale)}
              leftIcon={<Swords className="h-4 w-4" aria-hidden="true" />}
              size="sm"
            >
              {t(TUTORIAL_TEXT_CONSTANT.START_BATTLE_KEY)}
            </Button>
          }
        />
      </div>

      {/* 1. Interactive Step Progress Tabs */}
      <TutorialStepProgress
        steps={TUTORIAL_STEPS}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onSelectStep={selectStep}
      />

      {/* 2. Interactive Lesson Explanation & 2-Row Board Simulation */}
      <IntellioCard
        as="section"
        variant="glass"
        padding="sm"
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        <TutorialLessonCard
          lesson={currentLesson}
          actionCompleted={actionCompleted}
          onExecuteAction={executeStepAction}
        />

        <TutorialBoardPreview lesson={currentLesson} />
      </IntellioCard>

      {/* 3. Navigation Controls (Previous, Next, Finish) */}
      <TutorialNavigationControls
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onPrevStep={prevStep}
        onNextStep={nextStep}
      />
    </div>
  );
}
