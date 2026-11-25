"use client";

import React from "react";
import { Layers, Trash2 } from "lucide-react";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import { useTranslator } from "@/core/translator";
import { Button, IntellioCard } from "@/client/presentation/components/ui";
import { DECK_BUILDER_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { DECK_BUILDER_TEXT_CONSTANT } from "../constants/TextConstant";

export interface DeckBuilderSavedDecksListProps {
  readonly savedDecks: readonly DeckEntity[];
  readonly onLoadDeck: (deck: DeckEntity) => void;
  readonly onDeleteDeck: (id: string) => void;
}

export function DeckBuilderSavedDecksList({
  savedDecks,
  onLoadDeck,
  onDeleteDeck,
}: DeckBuilderSavedDecksListProps): React.ReactElement {
  const { t } = useTranslator();
  const userSavedDecks = savedDecks.filter(
    (deck) => !deck.isPreset && !deck.isTemporary,
  );

  return (
    <div
      id={DECK_BUILDER_SEMANTIC_IDS.SAVED_DECKS_SECTION}
      className="space-y-3"
    >
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-cream">
        <Layers className="h-4 w-4 text-amber-light" aria-hidden="true" />
        <span>{t(DECK_BUILDER_TEXT_CONSTANT.SAVED_DECKS_TITLE)}</span>
      </h3>

      <div
        id={DECK_BUILDER_SEMANTIC_IDS.SAVED_DECKS_LIST}
        className="space-y-2.5"
      >
        {userSavedDecks.length === 0 ? (
          <IntellioCard variant="glass" padding="xs" className="p-4 text-center">
            <p className="nc-type-caption text-subtle">
              {t(DECK_BUILDER_TEXT_CONSTANT.SAVED_DECKS_EMPTY)}
            </p>
          </IntellioCard>
        ) : (
          userSavedDecks.map((deck) => (
            <IntellioCard
              key={deck.id}
              id={`${DECK_BUILDER_SEMANTIC_IDS.SAVED_DECK_ITEM_PREFIX}${deck.id}`}
              variant="flat"
              padding="xs"
              className="flex items-center justify-between p-3"
            >
              <div className="min-w-0 pr-2">
                <div className="truncate font-display text-sm font-bold text-cream">
                  {deck.name}
                </div>
                <div className="nc-type-caption text-subtle">
                  {deck.characterSlugs.length} Tokoh • {deck.instrumentSlugs.length} Waditra
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  id={`${DECK_BUILDER_SEMANTIC_IDS.SAVED_DECK_LOAD_BTN_PREFIX}${deck.id}`}
                  onClick={() => onLoadDeck(deck)}
                  variant="secondary"
                  size="xs"
                >
                  {t(DECK_BUILDER_TEXT_CONSTANT.LOAD_DECK_BTN)}
                </Button>
                <button
                  id={`${DECK_BUILDER_SEMANTIC_IDS.SAVED_DECK_DELETE_BTN_PREFIX}${deck.id}`}
                  type="button"
                  onClick={() => onDeleteDeck(deck.id)}
                  aria-label={t(DECK_BUILDER_TEXT_CONSTANT.DELETE_DECK_BTN)}
                  className="rounded-lg p-1.5 text-danger-light transition-colors hover:bg-danger/15 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </IntellioCard>
          ))
        )}
      </div>
    </div>
  );
}

