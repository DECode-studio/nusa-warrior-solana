"use client";

import React from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import Image from "next/image";
import type { BattleStateEntity } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
const CARD_BACK_IMAGE = "/cards/nusantara-card.back-card.png";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import styles from "./BattleAnimations.module.css";

interface BattleCardPilesProps {
  readonly battleState: BattleStateEntity;
}

interface PileProps {
  readonly id?: string;
  readonly label: string;
  readonly count: number;
  readonly topCard: CardEntity | null;
  readonly isDeck: boolean;
  readonly caption: string;
  readonly positionClass: string;
}

function Pile({ id, label, count, topCard, isDeck, caption, positionClass }: PileProps): React.ReactElement {
  const { t } = useTranslator();
  const imagePath = isDeck ? CARD_BACK_IMAGE : topCard?.imagePath;

  return (
    <div
      id={id}
      role="group"
      aria-label={t(BATTLE_TEXT_CONSTANT.UI_PILE_COUNT, { label, count })}
      title={t(BATTLE_TEXT_CONSTANT.UI_PILE_COUNT, { label, count })}
      className={`${styles.pileSlot} ${positionClass}`}
    >
      {imagePath ? (
        <Image src={imagePath} alt="" width={400} height={560} className={styles.pileImage} unoptimized />
      ) : (
        <div className={styles.emptyPile} aria-hidden="true" />
      )}
      <span className={styles.pileCaption}>{caption}</span>
      <span className={styles.pileCount}>{count}</span>
    </div>
  );
}

export function BattleCardPiles({ battleState }: BattleCardPilesProps): React.ReactElement {
  const { t } = useTranslator();
  const botGraveyardTopCard =
    battleState.botGraveyard.at(-1) ?? battleState.botInstrumentDiscard.at(-1) ?? null;
  const playerGraveyardTopCard =
    battleState.playerGraveyard.at(-1) ?? battleState.playerInstrumentDiscard.at(-1) ?? null;

  return (
    <div className={styles.pileLayer}>
      <Pile
        id={BATTLE_SEMANTIC_IDS.DECK_BOT_CHARACTER}
        label={t(BATTLE_TEXT_CONSTANT.UI_DECK_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_OPPONENT), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_CHARACTER) })}
        count={battleState.botCharacterDeck.length}
        topCard={null}
        isDeck
        caption={t(BATTLE_TEXT_CONSTANT.UI_CHARACTER_SHORT)}
        positionClass={styles.deckBotCharacter}
      />
      <Pile
        id={BATTLE_SEMANTIC_IDS.DECK_BOT_INSTRUMENT}
        label={t(BATTLE_TEXT_CONSTANT.UI_DECK_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_OPPONENT), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_INSTRUMENT) })}
        count={battleState.botInstrumentDeck.length}
        topCard={null}
        isDeck
        caption={t(BATTLE_TEXT_CONSTANT.UI_INSTRUMENT_SHORT)}
        positionClass={styles.deckBotInstrument}
      />
      <Pile
        id={BATTLE_SEMANTIC_IDS.DECK_PLAYER_CHARACTER}
        label={t(BATTLE_TEXT_CONSTANT.UI_DECK_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_PLAYER), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_CHARACTER) })}
        count={battleState.playerCharacterDeck.length}
        topCard={null}
        isDeck
        caption={t(BATTLE_TEXT_CONSTANT.UI_CHARACTER_SHORT)}
        positionClass={styles.deckPlayerCharacter}
      />
      <Pile
        id={BATTLE_SEMANTIC_IDS.DECK_PLAYER_INSTRUMENT}
        label={t(BATTLE_TEXT_CONSTANT.UI_DECK_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_PLAYER), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_INSTRUMENT) })}
        count={battleState.playerInstrumentDeck.length}
        topCard={null}
        isDeck
        caption={t(BATTLE_TEXT_CONSTANT.UI_INSTRUMENT_SHORT)}
        positionClass={styles.deckPlayerInstrument}
      />

      <Pile
        id={BATTLE_SEMANTIC_IDS.GRAVEYARD_BOT_CHARACTER}
        label={t(BATTLE_TEXT_CONSTANT.UI_GRAVEYARD_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_OPPONENT), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_CHARACTER) })}
        count={battleState.botGraveyard.length}
        topCard={battleState.botGraveyard.at(-1) ?? null}
        isDeck={false}
        caption={t(BATTLE_TEXT_CONSTANT.UI_CHARACTER_SHORT)}
        positionClass={styles.graveBotCharacter}
      />
      <Pile
        id={BATTLE_SEMANTIC_IDS.GRAVEYARD_BOT_INSTRUMENT}
        label={t(BATTLE_TEXT_CONSTANT.UI_GRAVEYARD_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_OPPONENT), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_INSTRUMENT) })}
        count={battleState.botInstrumentDiscard.length}
        topCard={battleState.botInstrumentDiscard.at(-1) ?? null}
        isDeck={false}
        caption={t(BATTLE_TEXT_CONSTANT.UI_INSTRUMENT_SHORT)}
        positionClass={styles.graveBotInstrument}
      />
      <Pile
        id={BATTLE_SEMANTIC_IDS.GRAVEYARD_PLAYER_CHARACTER}
        label={t(BATTLE_TEXT_CONSTANT.UI_GRAVEYARD_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_PLAYER), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_CHARACTER) })}
        count={battleState.playerGraveyard.length}
        topCard={battleState.playerGraveyard.at(-1) ?? null}
        isDeck={false}
        caption={t(BATTLE_TEXT_CONSTANT.UI_CHARACTER_SHORT)}
        positionClass={styles.gravePlayerCharacter}
      />
      <Pile
        id={BATTLE_SEMANTIC_IDS.GRAVEYARD_PLAYER_INSTRUMENT}
        label={t(BATTLE_TEXT_CONSTANT.UI_GRAVEYARD_PILE, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_PLAYER), type: t(BATTLE_TEXT_CONSTANT.UI_TYPE_INSTRUMENT) })}
        count={battleState.playerInstrumentDiscard.length}
        topCard={battleState.playerInstrumentDiscard.at(-1) ?? null}
        isDeck={false}
        caption={t(BATTLE_TEXT_CONSTANT.UI_INSTRUMENT_SHORT)}
        positionClass={styles.gravePlayerInstrument}
      />

      <Pile
        label={t(BATTLE_TEXT_CONSTANT.UI_COMBINED_GRAVEYARD, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_OPPONENT) })}
        count={battleState.botGraveyard.length + battleState.botInstrumentDiscard.length}
        topCard={botGraveyardTopCard}
        isDeck={false}
        caption={t(BATTLE_TEXT_CONSTANT.UI_GRAVEYARD_SHORT)}
        positionClass={`${styles.mobileGraveyard} ${styles.mobileGraveBot}`}
      />
      <Pile
        label={t(BATTLE_TEXT_CONSTANT.UI_COMBINED_GRAVEYARD, { side: t(BATTLE_TEXT_CONSTANT.UI_SIDE_PLAYER) })}
        count={battleState.playerGraveyard.length + battleState.playerInstrumentDiscard.length}
        topCard={playerGraveyardTopCard}
        isDeck={false}
        caption={t(BATTLE_TEXT_CONSTANT.UI_GRAVEYARD_SHORT)}
        positionClass={`${styles.mobileGraveyard} ${styles.mobileGravePlayer}`}
      />
    </div>
  );
}
