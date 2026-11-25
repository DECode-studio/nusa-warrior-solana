"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import type { KingdomOption } from "../hooks/useCardForge";
import { KINGDOM_OPTIONS } from "../hooks/useCardForge";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeKingdomSelectorProps {
  readonly selectedKingdomId: string;
  readonly onSelectKingdom: (id: string) => void;
}

export function CardForgeKingdomSelector({
  selectedKingdomId,
  onSelectKingdom,
}: CardForgeKingdomSelectorProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={CARD_FORGE_SEMANTIC_IDS.KINGDOM_SELECTOR}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <label className="block font-display text-sm font-semibold text-white">
        {t(CARD_FORGE_TEXT_CONSTANT.STEP_KINGDOM)}
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {KINGDOM_OPTIONS.map((k: KingdomOption) => {
          const isSelected = selectedKingdomId === k.id;
          return (
            <button
              key={k.id}
              id={`${CARD_FORGE_SEMANTIC_IDS.KINGDOM_OPTION_PREFIX}${k.id.toLowerCase()}`}
              type="button"
              onClick={() => onSelectKingdom(k.id)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                isSelected
                  ? "border-[#6766FF] bg-[#6766FF]/20 shadow-[0_0_15px_rgba(103,102,255,0.3)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <span className="font-display text-xs font-bold text-white">{k.name}</span>
              <span className="text-[10px] text-[#F8F5F0]/60">{k.tag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
