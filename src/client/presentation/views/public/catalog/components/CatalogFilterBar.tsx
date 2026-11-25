"use client";

import React from "react";
import { RotateCcw, Search } from "lucide-react";
import type {
  CardTypeValue,
  KingdomValue,
  RoleValue,
} from "@/core/constants/cards-catalog";
import { useTranslator } from "@/core/translator";
import {
  formatKingdomLabel,
  formatRoleLabel,
} from "@/core/utils/formatters";
import {
  Button,
  InputField,
  IntellioCard,
} from "@/client/presentation/components/ui";
import { CATALOG_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CATALOG_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CatalogFilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly cardTypeFilter: "ALL" | CardTypeValue;
  readonly onCardTypeFilterChange: (type: "ALL" | CardTypeValue) => void;
  readonly kingdomFilter: "ALL" | KingdomValue;
  readonly onKingdomFilterChange: (kingdom: "ALL" | KingdomValue) => void;
  readonly roleFilter: "ALL" | RoleValue;
  readonly onRoleFilterChange: (role: "ALL" | RoleValue) => void;
  readonly filteredCardsCount: number;
  readonly totalCardsCount: number;
  readonly hasActiveFilter: boolean;
  readonly onResetFilters: () => void;
}

const CARD_TYPES: readonly ("ALL" | CardTypeValue)[] = [
  "ALL",
  "CHARACTER",
  "INSTRUMENT",
];

const KINGDOMS: readonly ("ALL" | KingdomValue)[] = [
  "ALL",
  "MAJAPAHIT",
  "PAJAJARAN",
  "NUSANTARA_UMUM",
  "DAHA_KADIRI",
  "PORTUGIS",
  "DEMAK_CIREBON",
  "BANTEN",
];

const ROLES: readonly ("ALL" | RoleValue)[] = [
  "ALL",
  "PEMIMPIN",
  "PRAJURIT",
  "PEMUKA",
  "UTUSAN",
  "PERAJIN",
];

export function CatalogFilterBar({
  searchQuery,
  onSearchChange,
  cardTypeFilter,
  onCardTypeFilterChange,
  kingdomFilter,
  onKingdomFilterChange,
  roleFilter,
  onRoleFilterChange,
  filteredCardsCount,
  totalCardsCount,
  hasActiveFilter,
  onResetFilters,
}: CatalogFilterBarProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <IntellioCard
      id={CATALOG_SEMANTIC_IDS.FILTER_BAR}
      variant="glass"
      padding="md"
      className="mt-6 space-y-5 sm:mt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-64 flex-1">
          <InputField
            id={CATALOG_SEMANTIC_IDS.SEARCH_INPUT}
            label={t(CATALOG_TEXT_CONSTANT.SEARCH_LABEL)}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(CATALOG_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
            leftIcon={<Search className="h-4 w-4" />}
            sizeVariant="md"
          />
        </div>

        <div
          id={CATALOG_SEMANTIC_IDS.FILTER_TYPE_GROUP}
          role="group"
          aria-label={t(CATALOG_TEXT_CONSTANT.FILTER_TYPE_ARIA)}
          className="flex flex-wrap items-center gap-2"
        >
          {CARD_TYPES.map((type) => (
            <Button
              key={type}
              id={`${CATALOG_SEMANTIC_IDS.FILTER_TYPE_BTN_PREFIX}${type.toLowerCase()}`}
              type="button"
              variant={cardTypeFilter === type ? "primary" : "secondary"}
              size="sm"
              onClick={() => onCardTypeFilterChange(type)}
            >
              {type === "ALL"
                ? t(CATALOG_TEXT_CONSTANT.FILTER_ALL_KEY)
                : type === "CHARACTER"
                  ? t(CATALOG_TEXT_CONSTANT.FILTER_CHARACTERS_KEY)
                  : t(CATALOG_TEXT_CONSTANT.FILTER_INSTRUMENTS_KEY)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#6766FF]/20 pt-4 text-xs">
        <div
          id={CATALOG_SEMANTIC_IDS.FILTER_KINGDOM_GROUP}
          role="group"
          aria-label={t(CATALOG_TEXT_CONSTANT.FILTER_KINGDOM_ARIA)}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="mr-1 text-xs font-bold text-white">
            {t(CATALOG_TEXT_CONSTANT.FILTER_KINGDOM_LABEL)}
          </span>
          {KINGDOMS.map((k) => (
            <Button
              key={k}
              id={`${CATALOG_SEMANTIC_IDS.FILTER_KINGDOM_BTN_PREFIX}${k.toLowerCase()}`}
              type="button"
              variant={kingdomFilter === k ? "amber" : "secondary"}
              size="xs"
              onClick={() => onKingdomFilterChange(k)}
            >
              {k === "ALL"
                ? t(CATALOG_TEXT_CONSTANT.FILTER_KINGDOM_ALL)
                : formatKingdomLabel(k)}
            </Button>
          ))}
        </div>

        <div
          id={CATALOG_SEMANTIC_IDS.FILTER_ROLE_GROUP}
          role="group"
          aria-label={t(CATALOG_TEXT_CONSTANT.FILTER_ROLE_ARIA)}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="mr-1 text-xs font-bold text-white">
            {t(CATALOG_TEXT_CONSTANT.FILTER_ROLE_LABEL)}
          </span>
          {ROLES.map((r) => (
            <Button
              key={r}
              id={`${CATALOG_SEMANTIC_IDS.FILTER_ROLE_BTN_PREFIX}${r.toLowerCase()}`}
              type="button"
              variant={roleFilter === r ? "emerald" : "secondary"}
              size="xs"
              onClick={() => onRoleFilterChange(r)}
            >
              {r === "ALL"
                ? t(CATALOG_TEXT_CONSTANT.FILTER_ROLE_ALL)
                : formatRoleLabel(r)}
            </Button>
          ))}
        </div>
      </div>

      <div
        id={CATALOG_SEMANTIC_IDS.FILTER_SUMMARY_ROW}
        className="flex flex-wrap items-center justify-between gap-2 border-t border-[#6766FF]/20 pt-3 text-xs text-[#F8F5F0]/75"
      >
        <span>
          {t(CATALOG_TEXT_CONSTANT.RESULT_COUNT_SHOWING)}{" "}
          <strong className="text-white">{filteredCardsCount}</strong>{" "}
          {t(CATALOG_TEXT_CONSTANT.RESULT_COUNT_OF)}{" "}
          <strong className="text-white">{totalCardsCount}</strong>{" "}
          {t(CATALOG_TEXT_CONSTANT.RESULT_COUNT_SUFFIX)}
        </span>
        {hasActiveFilter && (
          <Button
            id={CATALOG_SEMANTIC_IDS.FILTER_RESET_BTN}
            type="button"
            onClick={onResetFilters}
            variant="outline"
            size="xs"
            leftIcon={<RotateCcw className="h-3 w-3" />}
          >
            {t(CATALOG_TEXT_CONSTANT.RESET_FILTERS)}
          </Button>
        )}
      </div>
    </IntellioCard>
  );
}

