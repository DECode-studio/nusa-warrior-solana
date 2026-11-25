"use client";

import { useState } from "react";
import { gamelanAudio } from "@/core/utils/audio-synth";

export interface TutorialStepLesson {
  stepNumber: number;
  titleKey: string;
  culturalHighlightKey: string;
  ruleExplanationKey: string;
  interactiveTaskPromptKey: string;
  actionButtonLabelKey: string;
  outcomeFeedbackKey: string;
  sampleAttacker: {
    name: string;
    kingdom: string;
    role: string;
    atk: number;
    def: number;
    imagePath: string;
  };
  sampleDefender: {
    name: string;
    kingdom: string;
    role: string;
    atk: number;
    def: number;
    imagePath: string;
  };
  sampleInstrument?: {
    name: string;
    effectKey: string;
    imagePath: string;
  };
}

export const TUTORIAL_STEPS: readonly TutorialStepLesson[] = [
  {
    stepNumber: 1,
    titleKey: "tutorial.step1.title",
    culturalHighlightKey: "tutorial.step1.culturalHighlight",
    ruleExplanationKey: "tutorial.step1.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step1.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step1.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step1.outcomeFeedback",
    sampleAttacker: {
      name: "Gajah Mada",
      kingdom: "Majapahit",
      role: "Prajurit",
      atk: 1500,
      def: 1200,
      imagePath: "/cards/nusantara-card.majapahit.gajah-mada.png",
    },
    sampleDefender: {
      name: "Sri Baduga Maharaja",
      kingdom: "Pajajaran",
      role: "Pemimpin",
      atk: 1200,
      def: 1400,
      imagePath: "/cards/nusantara-card.pajajaran.sri-baduga-maharaja.png",
    },
  },
  {
    stepNumber: 2,
    titleKey: "tutorial.step2.title",
    culturalHighlightKey: "tutorial.step2.culturalHighlight",
    ruleExplanationKey: "tutorial.step2.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step2.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step2.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step2.outcomeFeedback",
    sampleAttacker: {
      name: "Hayam Wuruk",
      kingdom: "Majapahit",
      role: "Pemimpin",
      atk: 1200,
      def: 1300,
      imagePath: "/cards/nusantara-card.majapahit.hayam-wuruk.png",
    },
    sampleDefender: {
      name: "Surawisesa",
      kingdom: "Pajajaran",
      role: "Pemimpin",
      atk: 1400,
      def: 1100,
      imagePath: "/cards/nusantara-card.pajajaran.surawisesa.png",
    },
    sampleInstrument: {
      name: "Kendang",
      effectKey: "tutorial.step2.sampleInstrumentEffect",
      imagePath: "/cards/nusantara-card.instrument.kendang.png",
    },
  },
  {
    stepNumber: 3,
    titleKey: "tutorial.step3.title",
    culturalHighlightKey: "tutorial.step3.culturalHighlight",
    ruleExplanationKey: "tutorial.step3.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step3.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step3.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step3.outcomeFeedback",
    sampleAttacker: {
      name: "Gajah Mada",
      kingdom: "Majapahit",
      role: "Prajurit",
      atk: 1900,
      def: 1200,
      imagePath: "/cards/nusantara-card.majapahit.gajah-mada.png",
    },
    sampleDefender: {
      name: "Niskala Wastu Kancana",
      kingdom: "Pajajaran",
      role: "Pemimpin",
      atk: 900,
      def: 1500,
      imagePath: "/cards/nusantara-card.pajajaran.nisakala-wastu-kancana.png",
    },
    sampleInstrument: {
      name: "Padahi",
      effectKey: "tutorial.step3.sampleInstrumentEffect",
      imagePath: "/cards/nusantara-card.instrument.padahi.png",
    },
  },
  {
    stepNumber: 4,
    titleKey: "tutorial.step4.title",
    culturalHighlightKey: "tutorial.step4.culturalHighlight",
    ruleExplanationKey: "tutorial.step4.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step4.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step4.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step4.outcomeFeedback",
    sampleAttacker: {
      name: "Gajah Mada",
      kingdom: "Majapahit",
      role: "Prajurit",
      atk: 1500,
      def: 1200,
      imagePath: "/cards/nusantara-card.majapahit.gajah-mada.png",
    },
    sampleDefender: {
      name: "Surawisesa",
      kingdom: "Pajajaran",
      role: "Pemimpin",
      atk: 1400,
      def: 1100,
      imagePath: "/cards/nusantara-card.pajajaran.surawisesa.png",
    },
  },
  {
    stepNumber: 5,
    titleKey: "tutorial.step5.title",
    culturalHighlightKey: "tutorial.step5.culturalHighlight",
    ruleExplanationKey: "tutorial.step5.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step5.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step5.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step5.outcomeFeedback",
    sampleAttacker: {
      name: "Hayam Wuruk",
      kingdom: "Majapahit",
      role: "Pemimpin",
      atk: 1200,
      def: 1300,
      imagePath: "/cards/nusantara-card.majapahit.hayam-wuruk.png",
    },
    sampleDefender: {
      name: "Sri Baduga Maharaja",
      kingdom: "Pajajaran",
      role: "Pemimpin",
      atk: 1200,
      def: 1200,
      imagePath: "/cards/nusantara-card.pajajaran.sri-baduga-maharaja.png",
    },
  },
  {
    stepNumber: 6,
    titleKey: "tutorial.step6.title",
    culturalHighlightKey: "tutorial.step6.culturalHighlight",
    ruleExplanationKey: "tutorial.step6.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step6.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step6.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step6.outcomeFeedback",
    sampleAttacker: {
      name: "Dyah Pitaloka",
      kingdom: "Pajajaran",
      role: "Utusan",
      atk: 1100,
      def: 1000,
      imagePath: "/cards/nusantara-card.pajajaran.dyah-pitaloka.png",
    },
    sampleDefender: {
      name: "Sri Baduga Maharaja",
      kingdom: "Pajajaran",
      role: "Pemimpin",
      atk: 1200,
      def: 1400,
      imagePath: "/cards/nusantara-card.pajajaran.sri-baduga-maharaja.png",
    },
  },
  {
    stepNumber: 7,
    titleKey: "tutorial.step7.title",
    culturalHighlightKey: "tutorial.step7.culturalHighlight",
    ruleExplanationKey: "tutorial.step7.ruleExplanation",
    interactiveTaskPromptKey: "tutorial.step7.interactiveTaskPrompt",
    actionButtonLabelKey: "tutorial.step7.actionButtonLabel",
    outcomeFeedbackKey: "tutorial.step7.outcomeFeedback",
    sampleAttacker: {
      name: "Tribhuwana Wijayatunggadewi",
      kingdom: "Majapahit",
      role: "Pemimpin",
      atk: 1300,
      def: 1200,
      imagePath:
        "/cards/nusantara-card.majapahit.tribhuwana-wijayatunggadewi.png",
    },
    sampleDefender: {
      name: "Bujangga Manik",
      kingdom: "Pajajaran",
      role: "Pemuka",
      atk: 700,
      def: 1300,
      imagePath: "/cards/nusantara-card.pajajaran.bujangga-manik.png",
    },
  },
];

export interface UseTutorialReturn {
  currentStepIndex: number;
  currentLesson: TutorialStepLesson;
  totalSteps: number;
  actionCompleted: boolean;
  executeStepAction: () => void;
  nextStep: () => void;
  prevStep: () => void;
  selectStep: (idx: number) => void;
}

export function useTutorial(): UseTutorialReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [actionCompleted, setActionCompleted] = useState(false);

  const currentLesson = TUTORIAL_STEPS[currentStepIndex];

  const executeStepAction = (): void => {
    gamelanAudio.playInstrumentBuff(true);
    setActionCompleted(true);
  };

  const nextStep = (): void => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      gamelanAudio.playCardSelect();
      setCurrentStepIndex((prev) => prev + 1);
      setActionCompleted(false);
    }
  };

  const prevStep = (): void => {
    if (currentStepIndex > 0) {
      gamelanAudio.playCardSelect();
      setCurrentStepIndex((prev) => prev - 1);
      setActionCompleted(false);
    }
  };

  const selectStep = (idx: number): void => {
    gamelanAudio.playCardSelect();
    setCurrentStepIndex(idx);
    setActionCompleted(false);
  };

  return {
    currentStepIndex,
    currentLesson,
    totalSteps: TUTORIAL_STEPS.length,
    actionCompleted,
    executeStepAction,
    nextStep,
    prevStep,
    selectStep,
  };
}

