"use client";

import React from "react";
import { Swords, Shield } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeBattlePointSliderProps {
  readonly attack: number;
  readonly defense: number;
  readonly totalBp: number;
  readonly maxBp: number;
  readonly isBpOver: boolean;
  readonly onAttackChange: (val: number) => void;
  readonly onDefenseChange: (val: number) => void;
  readonly onApplyPreset: (atk: number, def: number) => void;
}

export function CardForgeBattlePointSlider({
  attack,
  defense,
  totalBp,
  maxBp,
  isBpOver,
  onAttackChange,
  onDefenseChange,
  onApplyPreset,
}: CardForgeBattlePointSliderProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={CARD_FORGE_SEMANTIC_IDS.BP_SECTION}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <div className="flex items-center justify-between">
        <label className="font-display text-sm font-semibold text-white">
          {t(CARD_FORGE_TEXT_CONSTANT.STEP_BP_FORMATTED, { maxBp })}
        </label>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            isBpOver ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {totalBp} / {maxBp} BP
        </span>
      </div>

      {/* Quick Presets */}
      <div className="mt-3 flex gap-2">
        <button
          id={CARD_FORGE_SEMANTIC_IDS.PRESET_BALANCED_BTN}
          type="button"
          onClick={() => onApplyPreset(1050, 1050)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#F8F5F0]/80 hover:bg-white/10"
        >
          {t(CARD_FORGE_TEXT_CONSTANT.PRESET_BALANCED)}
        </button>
        <button
          id={CARD_FORGE_SEMANTIC_IDS.PRESET_OFFENSIVE_BTN}
          type="button"
          onClick={() => onApplyPreset(1500, 600)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#F8F5F0]/80 hover:bg-white/10"
        >
          {t(CARD_FORGE_TEXT_CONSTANT.PRESET_OFFENSIVE)}
        </button>
        <button
          id={CARD_FORGE_SEMANTIC_IDS.PRESET_DEFENSIVE_BTN}
          type="button"
          onClick={() => onApplyPreset(600, 1500)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[#F8F5F0]/80 hover:bg-white/10"
        >
          {t(CARD_FORGE_TEXT_CONSTANT.PRESET_DEFENSIVE)}
        </button>
      </div>

      {/* Slider Attack */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-rose-300">
            <Swords className="h-3.5 w-3.5" />
            {t(CARD_FORGE_TEXT_CONSTANT.BP_ATTACK_LABEL)}
          </span>
          <span className="text-white">{attack.toLocaleString("id-ID")}</span>
        </div>
        <input
          id={CARD_FORGE_SEMANTIC_IDS.ATK_SLIDER}
          type="range"
          min="100"
          max="2000"
          step="50"
          value={attack}
          onChange={(e) => onAttackChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-rose-500"
        />
      </div>

      {/* Slider Defense */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-blue-300">
            <Shield className="h-3.5 w-3.5" />
            {t(CARD_FORGE_TEXT_CONSTANT.BP_DEFENSE_LABEL)}
          </span>
          <span className="text-white">{defense.toLocaleString("id-ID")}</span>
        </div>
        <input
          id={CARD_FORGE_SEMANTIC_IDS.DEF_SLIDER}
          type="range"
          min="100"
          max="2000"
          step="50"
          value={defense}
          onChange={(e) => onDefenseChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
        />
      </div>
    </div>
  );
}
