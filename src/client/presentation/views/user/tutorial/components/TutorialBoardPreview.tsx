"use client";

import React from "react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { TUTORIAL_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TUTORIAL_TEXT_CONSTANT } from "../constants/TextConstant";
import type { TutorialStepLesson } from "../hooks/useTutorial";

export interface TutorialBoardPreviewProps {
  readonly lesson: TutorialStepLesson;
}

function createMockCard(params: {
  id: string;
  name: string;
  cardType: "CHARACTER" | "INSTRUMENT";
  kingdom: "MAJAPAHIT" | "PAJAJARAN";
  role: "PEMIMPIN" | "PRAJURIT" | "PEMUKA" | "UTUSAN" | "PERAJIN";
  baseAttack: number;
  baseDefense: number;
  imagePath: string;
  effectDesc?: string;
}): CardEntity {
  return {
    id: params.id,
    code: params.id.toUpperCase(),
    slug: params.id,
    name: params.name,
    cardType: params.cardType,
    kingdom: params.kingdom,
    role: params.role,
    secondaryRoles: [],
    gender: "LAKI_LAKI",
    baseAttack: params.baseAttack,
    baseDefense: params.baseDefense,
    effectName: params.effectDesc ?? null,
    effectType: params.effectDesc ? "BOOST_ATK" : null,
    effectDescriptionId: params.effectDesc ?? null,
    effectDescriptionEn: params.effectDesc ?? null,
    effectDescriptionZh: params.effectDesc ?? null,
    attackMod: 0,
    strikeAttackBonus: 0,
    defenseMod: 0,
    enemyAttackMod: 0,
    ignoreDefenseAmount: 0,
    affinityRole: null,
    affinityGender: null,
    affinityBonusAtk: 0,
    affinityBonusDef: 0,
    historicalSummaryId: "",
    historicalSummaryEn: "",
    historicalSummaryZh: "",
    illustrationNote: "",
    sourceCitation: "",
    sourceUrl: null,
    verificationStatus: "VERIFIED",
    publicationStatus: "ACTIVE",
    imagePath: params.imagePath,
    asset: null,
  };
}

export function TutorialBoardPreview({
  lesson,
}: TutorialBoardPreviewProps): React.ReactElement {
  const { t } = useTranslator();

  const attackerCard = createMockCard({
    id: `tut-attacker-${lesson.stepNumber}`,
    name: lesson.sampleAttacker.name,
    cardType: "CHARACTER",
    kingdom: lesson.sampleAttacker.kingdom.toUpperCase() === "PAJAJARAN" ? "PAJAJARAN" : "MAJAPAHIT",
    role: lesson.sampleAttacker.role === "Pemimpin" ? "PEMIMPIN" : "PRAJURIT",
    baseAttack: lesson.sampleAttacker.atk,
    baseDefense: lesson.sampleAttacker.def,
    imagePath: lesson.sampleAttacker.imagePath,
  });

  const defenderCard = createMockCard({
    id: `tut-defender-${lesson.stepNumber}`,
    name: lesson.sampleDefender.name,
    cardType: "CHARACTER",
    kingdom: lesson.sampleDefender.kingdom.toUpperCase() === "PAJAJARAN" ? "PAJAJARAN" : "MAJAPAHIT",
    role: lesson.sampleDefender.role === "Pemimpin" ? "PEMIMPIN" : "PRAJURIT",
    baseAttack: lesson.sampleDefender.atk,
    baseDefense: lesson.sampleDefender.def,
    imagePath: lesson.sampleDefender.imagePath,
  });

  const instrumentCard = lesson.sampleInstrument
    ? createMockCard({
        id: `tut-inst-${lesson.stepNumber}`,
        name: lesson.sampleInstrument.name,
        cardType: "INSTRUMENT",
        kingdom: "MAJAPAHIT",
        role: "PRAJURIT",
        baseAttack: 0,
        baseDefense: 0,
        imagePath: lesson.sampleInstrument.imagePath,
        effectDesc: t(lesson.sampleInstrument.effectKey),
      })
    : null;

  return (
    <div
      id={TUTORIAL_SEMANTIC_IDS.BOARD_PREVIEW}
      className="space-y-4 rounded-xl border border-border-base bg-surface-elevated/40 p-4 lg:col-span-5"
    >
      <div className="font-display text-sm font-bold text-cream">
        {t(TUTORIAL_TEXT_CONSTANT.BOARD_PREVIEW_TITLE)}
      </div>

      {/* Opponent Front Row (Defender) */}
      <div className="space-y-1.5 rounded-lg border border-danger/20 bg-danger/10 p-3">
        <span className="text-xs font-bold text-danger-light">
          {t(TUTORIAL_TEXT_CONSTANT.BOT_FRONT_ROW)}
        </span>
        <div className="flex justify-center py-1">
          <CardVisual card={defenderCard} size="sm" />
        </div>
      </div>

      {/* Player Front Row (Attacker) */}
      <div className="space-y-1.5 rounded-lg border border-emerald/20 bg-emerald/10 p-3">
        <span className="text-xs font-bold text-emerald-light">
          {t(TUTORIAL_TEXT_CONSTANT.PLAYER_FRONT_ROW)}
        </span>
        <div className="flex justify-center py-1">
          <CardVisual card={attackerCard} size="sm" />
        </div>
      </div>

      {/* Waditra Hand (If instrument present) */}
      {instrumentCard && (
        <div className="space-y-1.5 rounded-lg border border-amber/20 bg-amber/10 p-3">
          <span className="text-xs font-bold text-amber-light">
            {t(TUTORIAL_TEXT_CONSTANT.WADITRA_HAND)}: {lesson.sampleInstrument ? t(lesson.sampleInstrument.effectKey) : null}
          </span>
          <div className="flex justify-center py-1">
            <CardVisual card={instrumentCard} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
