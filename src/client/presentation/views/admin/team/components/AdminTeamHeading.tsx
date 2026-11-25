"use client";

import React from "react";
import { Plus, Search, Users2 } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_TEAM_TEXT_CONSTANT } from "../constants/TextConstant";

interface AdminTeamHeadingProps {
  readonly totalCount: number;
  readonly searchQuery: string;
  readonly onSearchChange: (q: string) => void;
  readonly onAddClick: () => void;
}

export function AdminTeamHeading({
  totalCount,
  searchQuery,
  onSearchChange,
  onAddClick,
}: AdminTeamHeadingProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={ADMIN_TEAM_SEMANTIC_IDS.HEADING}
      className="flex flex-col gap-4 rounded-2xl border border-[rgba(103,102,255,0.22)] bg-[#07011F]/90 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6766FF]/20 text-[#6766FF]">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold tracking-tight text-white">
                {t(ADMIN_TEAM_TEXT_CONSTANT.TITLE)}
              </h1>
              <span className="rounded-full bg-[#6766FF]/20 px-2.5 py-0.5 text-xs font-semibold text-[#A2A1FF]">
                {totalCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#B9B5D8]">
              {t(ADMIN_TEAM_TEXT_CONSTANT.DESCRIPTION)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B9B5D8]" />
          <input
            id={ADMIN_TEAM_SEMANTIC_IDS.SEARCH_INPUT}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(ADMIN_TEAM_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
            className="w-full sm:w-64 rounded-xl border border-[rgba(103,102,255,0.25)] bg-[#0E0927]/90 pl-9 pr-3 py-2 text-xs text-white placeholder-[#7A749E] focus:border-[#6766FF] focus:outline-none focus:ring-1 focus:ring-[#6766FF]"
          />
        </div>

        {/* Add Button */}
        <button
          id={ADMIN_TEAM_SEMANTIC_IDS.ADD_BTN}
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6766FF] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#6766FF]/30 transition-all hover:bg-[#5554E6] hover:shadow-[#6766FF]/50 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{t(ADMIN_TEAM_TEXT_CONSTANT.ADD_BTN)}</span>
        </button>
      </div>
    </div>
  );
}
