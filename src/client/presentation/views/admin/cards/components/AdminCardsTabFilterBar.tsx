"use client";

import React from "react";
import { Flag, ShieldCheck } from "lucide-react";
import { InputField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_CARDS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminCardsTabFilterBarProps {
  readonly activeTab: "CARDS" | "REPORTS";
  readonly onSelectTab: (tab: "CARDS" | "REPORTS") => void;
  readonly cardsCount: number;
  readonly reportsCount: number;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
}

export function AdminCardsTabFilterBar({
  activeTab,
  onSelectTab,
  cardsCount,
  reportsCount,
  searchQuery,
  onSearchChange,
}: AdminCardsTabFilterBarProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        id={ADMIN_CARDS_SEMANTIC_IDS.TAB_CONTAINER}
        role="tablist"
        aria-label={t(ADMIN_CARDS_TEXT_CONSTANT.TAB_ARIA)}
        className="flex gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "CARDS"}
          id={ADMIN_CARDS_SEMANTIC_IDS.TAB_CARDS_BTN}
          onClick={() => onSelectTab("CARDS")}
          className={
            activeTab === "CARDS"
              ? "nc-btn-primary px-4 py-2.5 text-xs cursor-pointer"
              : "nc-btn-secondary px-4 py-2.5 text-xs cursor-pointer"
          }
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>
            {t(ADMIN_CARDS_TEXT_CONSTANT.TAB_CARDS_KEY)} ({cardsCount})
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "REPORTS"}
          id={ADMIN_CARDS_SEMANTIC_IDS.TAB_REPORTS_BTN}
          onClick={() => onSelectTab("REPORTS")}
          className={
            activeTab === "REPORTS"
              ? "nc-btn-primary px-4 py-2.5 text-xs cursor-pointer"
              : "nc-btn-secondary px-4 py-2.5 text-xs cursor-pointer"
          }
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          <span>
            {t(ADMIN_CARDS_TEXT_CONSTANT.TAB_REPORTS_KEY)} ({reportsCount})
          </span>
        </button>
      </div>

      {activeTab === "CARDS" && (
        <div className="w-full sm:w-72">
          <InputField
            id={ADMIN_CARDS_SEMANTIC_IDS.SEARCH_INPUT}
            aria-label={t(ADMIN_CARDS_TEXT_CONSTANT.SEARCH_ARIA)}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(ADMIN_CARDS_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
            sizeVariant="sm"
            className="nc-input"
          />
        </div>
      )}
    </div>
  );
}

