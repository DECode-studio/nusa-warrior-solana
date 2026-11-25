"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeDisclaimerBoxProps {
  readonly disclaimerAccepted: boolean;
  readonly onDisclaimerChange: (val: boolean) => void;
}

export function CardForgeDisclaimerBox({
  disclaimerAccepted,
  onDisclaimerChange,
}: CardForgeDisclaimerBoxProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-2 text-xs leading-relaxed text-amber-200/90">
          <p className="font-bold text-amber-300">
            {t(CARD_FORGE_TEXT_CONSTANT.DISCLAIMER_TITLE)}
          </p>
          <p>
            {t(CARD_FORGE_TEXT_CONSTANT.DISCLAIMER_BODY)}
          </p>
          <p className="text-amber-400 font-semibold">
            {t(CARD_FORGE_TEXT_CONSTANT.DISCLAIMER_WARNING)}
          </p>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2.5 cursor-pointer pt-2 border-t border-amber-500/20 text-xs text-white">
        <input
          id={CARD_FORGE_SEMANTIC_IDS.DISCLAIMER_CHECKBOX}
          type="checkbox"
          checked={disclaimerAccepted}
          onChange={(e) => onDisclaimerChange(e.target.checked)}
          className="h-4 w-4 rounded border-amber-400/50 bg-black/40 text-[#6766FF] focus:ring-0"
          required
        />
        <span>{t(CARD_FORGE_TEXT_CONSTANT.DISCLAIMER_AGREE)}</span>
      </label>
    </div>
  );
}
