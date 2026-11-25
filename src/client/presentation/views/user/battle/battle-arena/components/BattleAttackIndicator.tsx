"use client";

import React, { useEffect, useState } from "react";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import styles from "./BattleAnimations.module.css";

interface BattleAttackIndicatorValue {
  readonly key: string;
  readonly attackerSide: "PLAYER" | "BOT";
  readonly attackerFrontIndex: number;
  readonly defenderFrontIndex: number;
}

interface Props {
  readonly attack: BattleAttackIndicatorValue | null;
  readonly onComplete: (key: string) => void;
}

function getCardId(side: "PLAYER" | "BOT", index: number): string {
  const prefix = side === "PLAYER"
    ? BATTLE_SEMANTIC_IDS.PLAYER_FRONT_SLOT_PREFIX
    : BATTLE_SEMANTIC_IDS.BOT_FRONT_SLOT_PREFIX;
  return `${prefix}${index}`;
}

export function BattleAttackIndicator({ attack, onComplete }: Props): React.ReactElement | null {
  const [path, setPath] = useState("");

  useEffect(() => {
    if (!attack) {
      setPath("");
      return;
    }

    const attackerSide = attack.attackerSide;
    const defenderSide = attackerSide === "PLAYER" ? "BOT" : "PLAYER";
    const attacker = document.getElementById(getCardId(attackerSide, attack.attackerFrontIndex));
    const defender = document.getElementById(getCardId(defenderSide, attack.defenderFrontIndex));
    if (!attacker || !defender) {
      const fallback = window.setTimeout(() => onComplete(attack.key), 80);
      return () => window.clearTimeout(fallback);
    }

    const attackerGlow = attackerSide === "PLAYER" ? styles.boardAttackerGlow : styles.boardOpponentAttackerGlow;
    const defenderGlow = defenderSide === "PLAYER" ? styles.boardDefenderGlow : styles.boardOpponentDefenderGlow;
    attacker.classList.add(attackerGlow);
    defender.classList.add(defenderGlow);

    const drawPath = (): void => {
      const from = attacker.getBoundingClientRect();
      const to = defender.getBoundingClientRect();
      const fromCenter = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
      const toCenter = { x: to.left + to.width / 2, y: to.top + to.height / 2 };
      const dx = toCenter.x - fromCenter.x;
      const dy = toCenter.y - fromCenter.y;
      const distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance;
      const uy = dy / distance;
      const insetFrom = Math.min(Math.min(from.width, from.height) * 0.34, distance * 0.22);
      const insetTo = Math.min(Math.min(to.width, to.height) * 0.34, distance * 0.22);
      const start = { x: fromCenter.x + ux * insetFrom, y: fromCenter.y + uy * insetFrom };
      const end = { x: toCenter.x - ux * insetTo, y: toCenter.y - uy * insetTo };
      const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      let normal = { x: -uy, y: ux };
      if (normal.y > 0) normal = { x: -normal.x, y: -normal.y };
      const arc = Math.min(140, Math.max(52, distance * 0.2));
      setPath(`M ${start.x} ${start.y} Q ${mid.x + normal.x * arc} ${mid.y + normal.y * arc} ${end.x} ${end.y}`);
    };

    const frameId = window.requestAnimationFrame(drawPath);
    const resizeObserver = new ResizeObserver(drawPath);
    resizeObserver.observe(attacker);
    resizeObserver.observe(defender);
    window.addEventListener("resize", drawPath);
    const finishTimer = window.setTimeout(() => onComplete(attack.key), 600);
    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", drawPath);
      window.clearTimeout(finishTimer);
      attacker.classList.remove(attackerGlow);
      defender.classList.remove(defenderGlow);
    };
  }, [attack, onComplete]);

  if (!attack || !path) return null;

  return (
    <svg
      className={styles.battleAttackArrow}
      viewBox={`0 0 ${typeof window === "undefined" ? 1 : window.innerWidth} ${typeof window === "undefined" ? 1 : window.innerHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <marker id={`battle-attack-arrowhead-${attack.key}`} markerWidth="18" markerHeight="18" refX="13" refY="9" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M 2 2 L 15 9 L 2 16 Q 6 9 2 2 Z" className={styles.battleAttackArrowHead} />
        </marker>
      </defs>
      <path
        d={path}
        pathLength="1"
        markerEnd={`url(#battle-attack-arrowhead-${attack.key})`}
        className={styles.battleAttackArrowPath}
      />
    </svg>
  );
}
