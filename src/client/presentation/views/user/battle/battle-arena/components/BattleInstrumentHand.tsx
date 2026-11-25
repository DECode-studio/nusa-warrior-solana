"use client";

import React from "react";
import { Sparkles, Trash2 } from "lucide-react";
import type { BattleHandInstrument } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import styles from "./BattleAnimations.module.css";

export interface BattleInstrumentHandProps {
  readonly hand: readonly BattleHandInstrument[];
  readonly selectedHandInstanceId: string | null;
  readonly isPlayerTurn: boolean;
  readonly isDealingFaceDown?: boolean;
  readonly onSelectInstrument: (instanceId: string) => void;
  readonly onDiscardSelected: () => void;
  readonly onInspectCard: (card: CardEntity) => void;
  readonly onCardClick?: (item: BattleHandInstrument) => void;
}

export function BattleInstrumentHand({
  hand,
  selectedHandInstanceId,
  isPlayerTurn,
  isDealingFaceDown = false,
  onSelectInstrument,
  onDiscardSelected,
  onInspectCard,
  onCardClick,
}: BattleInstrumentHandProps): React.ReactElement {
  const { t } = useTranslator();

  const handleItemClick = (item: BattleHandInstrument) => {
    if (onCardClick) {
      onCardClick(item);
    } else {
      onSelectInstrument(item.instanceId);
    }
  };

  return (
    <footer
      id={BATTLE_SEMANTIC_IDS.PLAYER_INSTRUMENT_HAND}
      className={styles.instrumentHand}
    >
      <div className="flex items-center gap-2">
        <span className="font-display text-xs font-bold text-primary-light">
          {t(BATTLE_TEXT_CONSTANT.INSTRUMENT_HAND)} ({hand.length}/6)
        </span>
        {selectedHandInstanceId && isPlayerTurn && (
          <button
            type="button"
            onClick={onDiscardSelected}
            className="inline-flex items-center gap-1 rounded-md bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger-light hover:bg-danger/25"
          >
            <Trash2 className="h-3 w-3" />
            <span>{t(BATTLE_TEXT_CONSTANT.UI_DISCARD_INSTRUMENT)}</span>
          </button>
        )}
      </div>

      <div className={styles.instrumentCards}>
        {hand.map((item) => {
          const isSelected = item.instanceId === selectedHandInstanceId;
          return (
            <div
              key={item.instanceId}
              id={`${BATTLE_SEMANTIC_IDS.PLAYER_INSTRUMENT_SLOT_PREFIX}${item.instanceId}`}
              onClick={() => handleItemClick(item)}
              className={`relative cursor-pointer rounded-xl transition-all duration-200 ${
                isSelected
                  ? "-translate-y-2 ring-2 ring-amber"
                  : "hover:-translate-y-1 hover:ring-1 hover:ring-border-strong"
              }`}
            >
              <div className={styles.instrumentCard}>
                <CardVisual
                  card={item.card}
                  isFaceDown={isDealingFaceDown}
                  animateFlip
                  flipClassName={styles.flip}
                  size="sm"
                  className={styles.battleCard}
                  badgeContent="role"
                  showName={false}
                  onClick={() => handleItemClick(item)}
                  onInspect={() => onInspectCard(item.card)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
