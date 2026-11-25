"use client";

import React from "react";
import { Search } from "lucide-react";
import { InputField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_USERS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_USERS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminUsersHeadingProps {
  readonly searchQuery: string;
  readonly onSearchChange: (val: string) => void;
}

export function AdminUsersHeading({
  searchQuery,
  onSearchChange,
}: AdminUsersHeadingProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={ADMIN_USERS_SEMANTIC_IDS.HEADER}
      className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6"
    >
      <div>
        <h2 id={ADMIN_USERS_SEMANTIC_IDS.PAGE_TITLE} className="font-display text-2xl font-bold text-white sm:text-3xl">
          {t(ADMIN_USERS_TEXT_CONSTANT.TITLE_KEY)}
        </h2>
        <p id={ADMIN_USERS_SEMANTIC_IDS.PAGE_SUBTITLE} className="mt-1 text-xs text-[#CFCBE2] sm:text-sm">
          {t(ADMIN_USERS_TEXT_CONSTANT.SUBTITLE_KEY)}
        </p>
      </div>

      <div className="relative w-full sm:w-72">
        <InputField
          id={ADMIN_USERS_SEMANTIC_IDS.SEARCH_INPUT}
          aria-label={t(ADMIN_USERS_TEXT_CONSTANT.SEARCH_ARIA)}
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t(ADMIN_USERS_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
          leftIcon={<Search className="h-4 w-4 text-[#CFCBE2]" aria-hidden="true" />}
          sizeVariant="sm"
          className="!bg-[#07011F] !pr-4"
        />
      </div>
    </div>
  );
}

