"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { ADMIN_CARDS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";

export function AdminCardsHeading(): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={ADMIN_CARDS_SEMANTIC_IDS.HEADER}
      className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6"
    >
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {t(ADMIN_CARDS_TEXT_CONSTANT.TITLE_KEY)}
        </h2>
        <p className="mt-1 text-xs text-[#CFCBE2] sm:text-sm">
          {t(ADMIN_CARDS_TEXT_CONSTANT.SUBTITLE_KEY)}
        </p>
      </div>
    </div>
  );
}

