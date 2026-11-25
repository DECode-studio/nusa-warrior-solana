"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { BattleSlotCharacter, BattleStateEntity } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
const CARD_BACK_IMAGE = "/cards/nusantara-card.back-card.png";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import styles from "./BattleAnimations.module.css";

interface Flight {
  id: string;
  imagePath: string;
  left: number;
  top: number;
  x: number;
  y: number;
  faceDown: boolean;
  targetId: string;
  revealTarget: boolean;
}

interface Props {
  readonly battleState: BattleStateEntity;
  readonly allCards: readonly CardEntity[];
  readonly token: number;
  readonly turnChangeNoticeVisible: boolean;
  readonly openingDealAnimating: boolean;
}

function snapshot(state: BattleStateEntity): Set<string> {
  const ids = new Set<string>();
  for (const row of [state.playerFrontRow, state.playerSecondRow, state.botFrontRow, state.botSecondRow]) {
    for (const slot of row) if (slot) ids.add(`character:${slot.instanceId}`);
  }
  for (const item of [...state.playerInstrumentHand, ...state.botInstrumentHand]) ids.add(`instrument:${item.instanceId}`);
  for (const row of [state.playerFrontRow, state.playerSecondRow, state.botFrontRow, state.botSecondRow]) {
    for (const slot of row) {
      if (slot) slot.appliedInstruments.forEach((instrument, index) => ids.add(`applied:${slot.instanceId}:${instrument.instrumentSlug}:${index}`));
    }
  }
  return ids;
}

function targetId(slot: BattleSlotCharacter, state: BattleStateEntity): string {
  const rows: Array<[BattleSlotCharacter | null, string, string]> = [
    ...state.playerFrontRow.map((item, i) => [item, BATTLE_SEMANTIC_IDS.PLAYER_CHARACTER_DECK_ORIGIN, `${BATTLE_SEMANTIC_IDS.PLAYER_FRONT_SLOT_PREFIX}${i}`] as [BattleSlotCharacter | null, string, string]),
    ...state.playerSecondRow.map((item, i) => [item, BATTLE_SEMANTIC_IDS.PLAYER_CHARACTER_DECK_ORIGIN, `${BATTLE_SEMANTIC_IDS.PLAYER_SECOND_SLOT_PREFIX}${i}`] as [BattleSlotCharacter | null, string, string]),
    ...state.botFrontRow.map((item, i) => [item, BATTLE_SEMANTIC_IDS.BOT_CHARACTER_DECK_ORIGIN, `${BATTLE_SEMANTIC_IDS.BOT_FRONT_SLOT_PREFIX}${i}`] as [BattleSlotCharacter | null, string, string]),
    ...state.botSecondRow.map((item, i) => [item, BATTLE_SEMANTIC_IDS.BOT_CHARACTER_DECK_ORIGIN, `${BATTLE_SEMANTIC_IDS.BOT_SECOND_SLOT_PREFIX}${i}`] as [BattleSlotCharacter | null, string, string]),
  ];
  return rows.find(([item]) => item?.instanceId === slot.instanceId)?.[2] ?? "";
}

function makeFlight(sourceId: string, targetElement: HTMLElement, id: string, imagePath: string, faceDown = false): Flight | null {
  const source = document.getElementById(sourceId);
  if (!source) return null;
  const from = source.getBoundingClientRect();
  const to = targetElement.getBoundingClientRect();
  if (from.width === 0 || from.height === 0 || to.width === 0 || to.height === 0) {
    return null;
  }
  const left = from.left + from.width / 2;
  const top = from.top + from.height / 2;
  return {
    id,
    imagePath: faceDown ? CARD_BACK_IMAGE : imagePath,
    left,
    top,
    x: to.left + to.width / 2 - left,
    y: to.top + to.height / 2 - top,
    faceDown,
    targetId: targetElement.id,
    revealTarget: false,
  };
}

export function BattleStateChangeAnimation({
  battleState,
  allCards,
  token,
  turnChangeNoticeVisible,
  openingDealAnimating,
}: Props): React.ReactElement | null {
  const previousRef = useRef<Set<string> | null>(null);
  const previousTurnRef = useRef<{ matchId: string; activePlayer: "PLAYER" | "BOT" } | null>(null);
  const pendingInstrumentDrawsRef = useRef<Set<string>>(new Set());
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    const current = snapshot(battleState);
    const previous = previousRef.current;
    const previousTurn = previousTurnRef.current;
    const turnChanged = Boolean(
      previousTurn &&
      previousTurn.matchId === battleState.matchId &&
      previousTurn.activePlayer !== battleState.activePlayer
    );
    previousRef.current = current;
    previousTurnRef.current = {
      matchId: battleState.matchId,
      activePlayer: battleState.activePlayer,
    };
    if (openingDealAnimating) return;
    // The initial setup is animated by BattleOpeningDealAnimation.
    if (!previous || token > 0 && previous.size === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const next: Flight[] = [];
    const instrumentDrawTargets: string[] = [];
    const add = (sourceId: string, targetIdValue: string, id: string, card: CardEntity, faceDown = false): void => {
      const target = document.getElementById(targetIdValue);
      if (!target) return;
      const flight = makeFlight(sourceId, target, id, card.imagePath, faceDown);
      if (flight) next.push(flight);
    };

    for (const [side, rowName, row] of [
      ["PLAYER", "front", battleState.playerFrontRow],
      ["PLAYER", "second", battleState.playerSecondRow],
      ["BOT", "front", battleState.botFrontRow],
      ["BOT", "second", battleState.botSecondRow],
    ] as const) {
      for (const slot of row) {
        if (!slot || previous.has(`character:${slot.instanceId}`)) continue;
        const id = targetId(slot, battleState);
        add(side === "PLAYER" ? BATTLE_SEMANTIC_IDS.PLAYER_CHARACTER_DECK_ORIGIN : BATTLE_SEMANTIC_IDS.BOT_CHARACTER_DECK_ORIGIN, id, `character-${slot.instanceId}`, slot.card, side === "BOT");
      }
    }

    for (const [hand, sourceId, slotPrefix, faceDown] of [
      [battleState.playerInstrumentHand, BATTLE_SEMANTIC_IDS.DECK_PLAYER_INSTRUMENT, BATTLE_SEMANTIC_IDS.PLAYER_INSTRUMENT_SLOT_PREFIX, false],
      [battleState.botInstrumentHand, BATTLE_SEMANTIC_IDS.DECK_BOT_INSTRUMENT, BATTLE_SEMANTIC_IDS.BOT_INSTRUMENT_SLOT_PREFIX, true],
    ] as const) {
      for (const item of hand) {
        const snapshotId = `instrument:${item.instanceId}`;
        const targetIdValue = `${slotPrefix}${item.instanceId}`;
        const target = document.getElementById(targetIdValue);
        if (!previous.has(snapshotId)) {
          pendingInstrumentDrawsRef.current.add(item.instanceId);
          if (turnChanged || turnChangeNoticeVisible) {
            target?.classList.add(styles.arriving);
          }
        }
        if (!pendingInstrumentDrawsRef.current.has(item.instanceId)) continue;
        if (turnChangeNoticeVisible || turnChanged) {
          target?.classList.add(styles.arriving);
          continue;
        }
        const flight = target
          ? makeFlight(sourceId, target, `instrument-${item.instanceId}`, item.card.imagePath, faceDown)
          : null;
        if (flight) {
          next.push({ ...flight, revealTarget: true });
          instrumentDrawTargets.push(flight.targetId);
          pendingInstrumentDrawsRef.current.delete(item.instanceId);
        }
      }
    }

    for (const row of [battleState.playerFrontRow, battleState.playerSecondRow, battleState.botFrontRow, battleState.botSecondRow]) {
      for (const slot of row) {
        if (!slot) continue;
        slot.appliedInstruments.forEach((instrument, index) => {
          const id = `applied:${slot.instanceId}:${instrument.instrumentSlug}:${index}`;
          if (previous.has(id)) return;
          const card = allCards.find((item) => item.slug === instrument.instrumentSlug);
          const target = document.getElementById(targetId(slot, battleState));
          const isBotSlot = battleState.botFrontRow.concat(battleState.botSecondRow).some((item) => item?.instanceId === slot.instanceId);
          const sourceId = isBotSlot ? BATTLE_SEMANTIC_IDS.BOT_INSTRUMENT_HAND : BATTLE_SEMANTIC_IDS.PLAYER_INSTRUMENT_HAND;
          const source = document.getElementById(sourceId);
          if (!card || !target || !source) return;
          const flight = makeFlight(sourceId, target, `used-${slot.instanceId}-${index}`, card.imagePath);
          if (flight) next.push(flight);
        });
      }
    }

    if (next.length) {
      for (const targetIdValue of instrumentDrawTargets) {
        document.getElementById(targetIdValue)?.classList.add(styles.arriving);
      }
      setFlights(next);
      const finishTimer = window.setTimeout(() => {
        for (const flight of next) {
          if (!flight.revealTarget) continue;
          const target = document.getElementById(flight.targetId);
          target?.classList.remove(styles.arriving);
          target?.classList.add(styles.landed);
        }
        setFlights([]);
      }, 820);
      const cleanupTimer = window.setTimeout(() => {
        for (const flight of next) {
          if (flight.revealTarget) {
            document.getElementById(flight.targetId)?.classList.remove(styles.landed);
          }
        }
      }, 1460);
      return () => {
        window.clearTimeout(finishTimer);
        window.clearTimeout(cleanupTimer);
        for (const flight of next) {
          if (!flight.revealTarget) continue;
          const target = document.getElementById(flight.targetId);
          target?.classList.remove(styles.arriving, styles.landed);
        }
      };
    }
  }, [allCards, battleState, openingDealAnimating, token, turnChangeNoticeVisible]);

  if (!flights.length) return null;
  return (
    <div className={styles.flightLayer} aria-hidden="true">
      {flights.map((flight) => (
        <Image
          key={flight.id}
          src={flight.imagePath}
          alt=""
          width={400}
          height={560}
          className={`${styles.stateDrawFlyer} ${flight.faceDown ? styles.faceDown : ""}`}
          style={{ left: flight.left, top: flight.top, "--flight-x": `${flight.x}px`, "--flight-y": `${flight.y}px` } as React.CSSProperties}
          unoptimized
        />
      ))}
    </div>
  );
}
