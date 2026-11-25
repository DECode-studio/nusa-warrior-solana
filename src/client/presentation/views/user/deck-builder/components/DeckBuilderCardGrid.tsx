"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { CardEntity, OwnedCardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { Button } from "@/client/presentation/components/ui";
import { DECK_BUILDER_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { DECK_BUILDER_TEXT_CONSTANT } from "../constants/TextConstant";

export interface DeckBuilderCardGridProps {
  readonly cards: readonly OwnedCardEntity[];
  readonly selectedCharSlugs: readonly string[];
  readonly selectedInstSlugs: readonly string[];
  readonly onToggleSelection: (card: OwnedCardEntity) => void;
  readonly onInspectCard: (card: CardEntity) => void;
}

export function DeckBuilderCardGrid({
  cards,
  selectedCharSlugs,
  selectedInstSlugs,
  onToggleSelection,
  onInspectCard,
}: DeckBuilderCardGridProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={DECK_BUILDER_SEMANTIC_IDS.CARDS_LIBRARY_GRID}
      className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const copySuffix = card.copyNumber && card.copyNumber > 1
          ? `-copy-${card.copyNumber}`
          : "";
        const selectedCopies = (card.cardType === "CHARACTER"
          ? selectedCharSlugs
          : selectedInstSlugs).filter((slug) => slug === card.slug).length;
        const isSelected = selectedCopies >= (card.copyNumber ?? 1);

        return (
          <div
            key={`${card.slug}${copySuffix}`}
            id={`${DECK_BUILDER_SEMANTIC_IDS.CARD_ITEM_PREFIX}${card.slug}${copySuffix}`}
            className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 transition-all duration-300 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border-base bg-surface-elevated/40 hover:border-border-strong hover:bg-surface-elevated/70"
            }`}
          >
            {card.isCustom && (
              <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-sm">
                <span>{card.customStatus === "APPROVED" ? "Kustom (Resmi)" : "Kustom (Pending)"}</span>
              </div>
            )}

            {isSelected && (
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                <CheckCircle2 className="h-3 w-3" />
                <span>{t(DECK_BUILDER_TEXT_CONSTANT.SELECTED_BADGE)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleSelection(card)}
              className="flex w-full cursor-pointer flex-col items-center justify-center text-center focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex w-full items-center justify-center">
                <CardVisual
                  card={card}
                  size="sm"
                  showOverlay={false}
                />
              </div>

              <div className="mt-2 w-full truncate font-display text-xs font-bold text-cream sm:text-sm">
                {card.name}
              </div>
            </button>

            <div className="mt-2 pt-2 border-t border-border-subtle">
              <Button
                id={`${DECK_BUILDER_SEMANTIC_IDS.CARD_INSPECT_BTN_PREFIX}${card.slug}${copySuffix}`}
                type="button"
                onClick={() => onInspectCard(card)}
                variant="ghost"
                size="xs"
                className="w-full text-[11px]"
              >
                {t(DECK_BUILDER_TEXT_CONSTANT.INSPECT_CARD)}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
