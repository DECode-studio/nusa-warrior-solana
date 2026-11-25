"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { BattleStateEntity } from "@/client/domain/battle/entity/battle_entity";
const CARD_BACK_IMAGE = "/cards/nusantara-card.back-card.png";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import styles from "./BattleAnimations.module.css";

interface DealFlyer {
  id: string;
  imagePath: string;
  left: number;
  top: number;
  width: number;
  height: number;
  x: number;
  y: number;
  delay: number;
  targetId: string;
}

interface BattleOpeningDealAnimationProps {
  readonly battleState: BattleStateEntity;
  readonly token: number;
  readonly onRevealStart: () => void;
  readonly onComplete: () => void;
}

function makeTargetId(side: "player" | "bot", row: "front" | "second", index: number): string {
  if (side === "bot") {
    return row === "front"
      ? `${BATTLE_SEMANTIC_IDS.BOT_FRONT_SLOT_PREFIX}${index}`
      : `${BATTLE_SEMANTIC_IDS.BOT_SECOND_SLOT_PREFIX}${index}`;
  }
  return row === "front"
    ? `${BATTLE_SEMANTIC_IDS.PLAYER_FRONT_SLOT_PREFIX}${index}`
    : `${BATTLE_SEMANTIC_IDS.PLAYER_SECOND_SLOT_PREFIX}${index}`;
}

function makeDeal(
  sourceId: string,
  targetId: string,
  id: string,
  delay: number
): DealFlyer | null {
  const source = document.getElementById(sourceId);
  const target = document.getElementById(targetId);
  if (!source || !target) return null;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const width = Math.max(30, targetRect.width * 0.72);
  const height = Math.max(40, targetRect.height * 0.72);
  return {
    id,
    imagePath: CARD_BACK_IMAGE,
    left: sourceRect.left + sourceRect.width / 2,
    top: sourceRect.top + sourceRect.height / 2,
    width,
    height,
    x: targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2,
    y: targetRect.top + targetRect.height / 2 - sourceRect.top - sourceRect.height / 2,
    delay,
    targetId,
  };
}

export function BattleOpeningDealAnimation({
  battleState,
  token,
  onRevealStart,
  onComplete,
}: BattleOpeningDealAnimationProps): React.ReactElement | null {
  const [flyers, setFlyers] = useState<DealFlyer[]>([]);
  const battleStateRef = useRef(battleState);
  const onRevealStartRef = useRef(onRevealStart);
  const onCompleteRef = useRef(onComplete);
  battleStateRef.current = battleState;
  onRevealStartRef.current = onRevealStart;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (token === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onRevealStartRef.current();
      onCompleteRef.current();
      return;
    }

    const timeoutIds: number[] = [];
    let frameId = 0;
    let cancelled = false;
    frameId = window.requestAnimationFrame(() => {
      const nextFlyers: DealFlyer[] = [];
      let delay = 0;
      const add = (
        sourceId: string,
        targetId: string,
        id: string
      ): void => {
        const flyer = makeDeal(sourceId, targetId, id, delay);
        if (flyer) {
          nextFlyers.push(flyer);
          document.getElementById(targetId)?.classList.add(styles.arriving);
          const landingDelay = delay + 720;
          timeoutIds.push(window.setTimeout(() => {
            if (cancelled) return;
            const target = document.getElementById(targetId);
            target?.classList.remove(styles.arriving);
            target?.classList.add(styles.landed);
            timeoutIds.push(window.setTimeout(() => {
              if (!cancelled) target?.classList.remove(styles.landed);
            }, 640));
          }, landingDelay));
          delay += 105;
        }
      };

      const currentBattleState = battleStateRef.current;
      currentBattleState.botFrontRow.forEach((slot, index) => {
        if (slot) add(BATTLE_SEMANTIC_IDS.BOT_CHARACTER_DECK_ORIGIN, makeTargetId("bot", "front", index), slot.instanceId);
      });
      currentBattleState.botSecondRow.forEach((slot, index) => {
        if (slot) add(BATTLE_SEMANTIC_IDS.BOT_CHARACTER_DECK_ORIGIN, makeTargetId("bot", "second", index), slot.instanceId);
      });
      currentBattleState.playerFrontRow.forEach((slot, index) => {
        if (slot) add(BATTLE_SEMANTIC_IDS.PLAYER_CHARACTER_DECK_ORIGIN, makeTargetId("player", "front", index), slot.instanceId);
      });
      currentBattleState.playerSecondRow.forEach((slot, index) => {
        if (slot) add(BATTLE_SEMANTIC_IDS.PLAYER_CHARACTER_DECK_ORIGIN, makeTargetId("player", "second", index), slot.instanceId);
      });
      currentBattleState.playerInstrumentHand.forEach((item) => {
        add(
          BATTLE_SEMANTIC_IDS.PLAYER_INSTRUMENT_DECK_ORIGIN,
          `${BATTLE_SEMANTIC_IDS.PLAYER_INSTRUMENT_SLOT_PREFIX}${item.instanceId}`,
          item.instanceId
        );
      });

      if (!cancelled) setFlyers(nextFlyers);
      if (nextFlyers.length === 0) {
        onRevealStartRef.current();
        onCompleteRef.current();
        return;
      }
      const finishDelay = delay - 105 + 720 + 640;
      timeoutIds.push(window.setTimeout(() => {
        if (cancelled) return;
        setFlyers([]);
        onRevealStartRef.current();
        timeoutIds.push(window.setTimeout(() => {
          if (!cancelled) onCompleteRef.current();
        }, 650));
      }, finishDelay));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach(window.clearTimeout);
      document.querySelectorAll(`.${styles.arriving}`).forEach((element) => element.classList.remove(styles.arriving));
      document.querySelectorAll(`.${styles.landed}`).forEach((element) => element.classList.remove(styles.landed));
    };
  }, [token]);

  if (!flyers.length) return null;
  return (
    <div className={styles.flightLayer} aria-hidden="true">
      {flyers.map((flyer) => (
        <Image
          key={flyer.id}
          src={flyer.imagePath}
          alt=""
          width={flyer.width}
          height={flyer.height}
          className={`${styles.dealFlyer} ${styles.faceDown}`}
          style={{
            left: flyer.left,
            top: flyer.top,
            width: flyer.width,
            height: flyer.height,
            "--flight-x": `${flyer.x}px`,
            "--flight-y": `${flyer.y}px`,
            animationDelay: `${flyer.delay}ms`,
          } as React.CSSProperties}
          unoptimized
        />
      ))}
    </div>
  );
}
