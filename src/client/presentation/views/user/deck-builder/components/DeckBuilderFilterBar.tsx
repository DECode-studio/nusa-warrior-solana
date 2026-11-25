"use client";

import React from "react";
import { Search } from "lucide-react";
import type { CardTypeValue, KingdomValue } from "@/core/constants/cards-catalog";
import { useTranslator } from "@/core/translator";
import { formatKingdomLabel } from "@/core/utils/formatters";
import { Button } from "@/client/presentation/components/ui";
import { DECK_BUILDER_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { DECK_BUILDER_TEXT_CONSTANT } from "../constants/TextConstant";

export interface DeckBuilderFilterBarProps {
  readonly filterType: "ALL" | CardTypeValue;
  readonly onFilterTypeChange: (type: "ALL" | CardTypeValue) => void;
  readonly filterKingdom: "ALL" | KingdomValue;
  readonly onFilterKingdomChange: (kingdom: "ALL" | KingdomValue) => void;
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly className?: string;
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

export function DeckBuilderFilterBar({
  filterType,
  onFilterTypeChange,
  filterKingdom,
  onFilterKingdomChange,
  searchValue,
  onSearchChange,
  className = "",
}: DeckBuilderFilterBarProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={DECK_BUILDER_SEMANTIC_IDS.FILTER_BAR}
      className={`sticky top-24 sm:top-28 z-20 -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-6 sm:px-8 py-3.5 sm:py-4 bg-surface-base/95 backdrop-blur-xl rounded-t-2xl border-b border-border-base flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {/* Soft progressive blur & gradient fade above filter bar to seamlessly dissolve scrolling cards */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-full h-10 sm:h-12 bg-gradient-to-t from-surface-base via-surface-base/70 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black,transparent)] [-webkit-mask-image:linear-gradient(to_top,black,transparent)]"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {CARD_TYPES.map((type) => (
          <Button
            key={type}
            id={`${DECK_BUILDER_SEMANTIC_IDS.FILTER_TYPE_PREFIX}${type.toLowerCase()}`}
            onClick={() => onFilterTypeChange(type)}
            variant={filterType === type ? "primary" : "secondary"}
            size="xs"
          >
            {type === "ALL"
              ? t(DECK_BUILDER_TEXT_CONSTANT.FILTER_ALL)
              : type === "CHARACTER"
                ? t(DECK_BUILDER_TEXT_CONSTANT.FILTER_CHARACTERS)
                : t(DECK_BUILDER_TEXT_CONSTANT.FILTER_INSTRUMENTS)}
          </Button>
        ))}
      </div>

      <label className="relative order-first w-full sm:order-none sm:w-64 lg:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
        <input
          id={DECK_BUILDER_SEMANTIC_IDS.SEARCH_INPUT}
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder={t(DECK_BUILDER_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
          aria-label={t(DECK_BUILDER_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
          className="h-10 w-full rounded-xl border border-border-base bg-surface-elevated/40 pl-10 pr-3 text-sm text-cream outline-none transition placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <div className="flex flex-wrap items-center gap-1.5">
        {KINGDOMS.map((k) => (
          <Button
            key={k}
            id={`${DECK_BUILDER_SEMANTIC_IDS.FILTER_KINGDOM_PREFIX}${k.toLowerCase()}`}
            onClick={() => onFilterKingdomChange(k)}
            variant={filterKingdom === k ? "amber" : "secondary"}
            size="xs"
          >
            {k === "ALL"
              ? t(DECK_BUILDER_TEXT_CONSTANT.FILTER_KINGDOM_ALL)
              : formatKingdomLabel(k)}
          </Button>
        ))}
      </div>
    </div>
  );
}

