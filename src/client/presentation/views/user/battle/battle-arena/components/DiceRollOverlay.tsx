"use client";

import React, { useEffect, useRef, useState } from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import { Dices, Sparkles } from "lucide-react";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

export interface DiceRollOverlayProps {
  readonly isOpen?: boolean;
  readonly onRollComplete: () => Promise<void>;
  readonly onRollSettled: () => void;
  readonly playerRoll: number | null;
  readonly botRoll: number | null;
  readonly opponentLabel?: string;
  readonly canRoll?: boolean;
}

function renderPips(faceNumber: number, isPlayer: boolean): React.ReactElement {
  const pipClass = isPlayer
    ? "dice-pip-3d dice-pip-player"
    : "dice-pip-3d dice-pip-bot";

  const pipPositions: Record<number, Array<[number, number]>> = {
    1: [[2, 2]],
    2: [
      [1, 1],
      [3, 3],
    ],
    3: [
      [1, 1],
      [2, 2],
      [3, 3],
    ],
    4: [
      [1, 1],
      [1, 3],
      [3, 1],
      [3, 3],
    ],
    5: [
      [1, 1],
      [1, 3],
      [2, 2],
      [3, 1],
      [3, 3],
    ],
    6: [
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  };

  const positions = pipPositions[faceNumber] ?? [];

  return (
    <>
      {positions.map(([row, col], idx) => (
        <span
          key={`pip-${faceNumber}-${idx}`}
          className={pipClass}
          style={{ gridRow: row, gridColumn: col }}
        />
      ))}
    </>
  );
}

function Die3D({
  value,
  rolling,
  isPlayer,
}: {
  value: number;
  rolling: boolean;
  isPlayer: boolean;
}): React.ReactElement {
  const faceClass = isPlayer
    ? "dice-face-3d dice-face-player"
    : "dice-face-3d dice-face-bot";

  const targetRotationClass = `show-face-${value}`;

  return (
    <div className="dice-3d-viewport">
      <div
        className={`dice-3d-cube ${
          rolling ? "is-rolling" : targetRotationClass
        }`}
      >
        <div className={`${faceClass} dice-f-1`}>{renderPips(1, isPlayer)}</div>
        <div className={`${faceClass} dice-f-2`}>{renderPips(2, isPlayer)}</div>
        <div className={`${faceClass} dice-f-3`}>{renderPips(3, isPlayer)}</div>
        <div className={`${faceClass} dice-f-4`}>{renderPips(4, isPlayer)}</div>
        <div className={`${faceClass} dice-f-5`}>{renderPips(5, isPlayer)}</div>
        <div className={`${faceClass} dice-f-6`}>{renderPips(6, isPlayer)}</div>
      </div>
    </div>
  );
}

export function DiceRollOverlay({
  isOpen = true,
  onRollComplete,
  onRollSettled,
  playerRoll,
  botRoll,
  opponentLabel,
  canRoll = true,
}: DiceRollOverlayProps): React.ReactElement | null {
  const { t } = useTranslator();
  const displayedOpponentLabel = opponentLabel ?? t(BATTLE_TEXT_CONSTANT.BOT_LABEL);
  const [rolling, setRolling] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const settledRef = useRef(false);

  useEffect(() => {
    if (rolling || playerRoll === null || botRoll === null || settledRef.current) return;
    const timeoutId = window.setTimeout(() => {
      settledRef.current = true;
      onRollSettled();
    }, 1300);
    return () => window.clearTimeout(timeoutId);
  }, [botRoll, onRollSettled, playerRoll, rolling]);

  const handleRoll = (): void => {
    if (rolling) return;
    settledRef.current = false;
    setRolling(true);
    setTimeout(() => {
      setRequestFailed(false);
      void onRollComplete()
        .then(() => setRolling(false))
        .catch(() => {
          setRolling(false);
          setRequestFailed(true);
        });
    }, 1100);
  };

  return (
    <BaseModal
      id={BATTLE_SEMANTIC_IDS.DICE_OVERLAY}
      isOpen={isOpen}
      onClose={() => {}}
      size="md"
      mobileBehavior="modal"
      closeOnBackdropClick={false}
      showCloseButton={false}
      dragToDismiss={false}
      className="border border-primary/40 bg-surface-base/95 p-2 text-center"
      ariaLabel={t(BATTLE_TEXT_CONSTANT.UI_FIRST_TURN_DICE_ALT)}
      footer={
        !canRoll ? (
          <div
            role="status"
            aria-live="polite"
            className="w-full rounded-xl border border-border-base bg-surface-elevated/40 p-3.5 text-center text-sm font-semibold text-muted"
          >
            {t(BATTLE_TEXT_CONSTANT.UI_WAITING_OPPONENT_DICE)}
          </div>
        ) : requestFailed ? (
          <div
            role="status"
            aria-live="polite"
            className="w-full rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-center font-display text-base font-bold text-danger-light"
          >
            {t(BATTLE_TEXT_CONSTANT.UI_DICE_REQUEST_FAILED)}
          </div>
        ) : (
          <Button
            type="button"
            id="btn-roll-dice-start"
            onClick={handleRoll}
            disabled={rolling}
            variant="primary"
            size="lg"
            className="w-full py-3.5 font-display text-sm disabled:opacity-60"
            leftIcon={<Dices className="h-5 w-5" aria-hidden="true" />}
          >
            {rolling ? t(BATTLE_TEXT_CONSTANT.UI_DICE_ROLLING) : t(BATTLE_TEXT_CONSTANT.UI_DICE_ROLL)}
          </Button>
        )
      }
    >
      <div className="intellio-pill-badge mx-auto">
        <Sparkles className="h-3.5 w-3.5 text-amber-light" aria-hidden="true" />
        <span>{t(BATTLE_TEXT_CONSTANT.UI_FIRST_TURN_TITLE)}</span>
      </div>

      <h2
        id="dice-roll-modal-title"
        className="mt-4 font-display text-2xl font-bold text-cream sm:text-3xl"
      >
        {t(BATTLE_TEXT_CONSTANT.UI_DICE_ARENA_TITLE)}
      </h2>
      <p className="mt-1.5 text-xs text-muted sm:text-sm">
        {t(BATTLE_TEXT_CONSTANT.UI_DICE_ARENA_DESCRIPTION)}
      </p>

      {/* 3D Dice Stage */}
      <div className="my-6 flex items-center justify-around sm:my-8">
        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-sm font-bold text-amber-light">
            {t(BATTLE_TEXT_CONSTANT.UI_PLAYER_DIE)}
          </span>
          <Die3D value={playerRoll ?? 1} rolling={rolling} isPlayer={true} />
          <div className="font-display text-lg font-bold text-cream">
            {rolling
              ? t(BATTLE_TEXT_CONSTANT.UI_DICE_ROLLING_SHORT)
              : playerRoll === null
                ? t(BATTLE_TEXT_CONSTANT.UI_DICE_READY)
                : t(BATTLE_TEXT_CONSTANT.UI_DICE_RESULT, { value: playerRoll })}
          </div>
        </div>

        <div className="font-display text-2xl font-bold text-primary-light">
          VS
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-sm font-bold text-danger-light">
            {t(BATTLE_TEXT_CONSTANT.UI_OPPONENT_DIE, { opponent: displayedOpponentLabel })}
          </span>
          <Die3D value={botRoll ?? 6} rolling={rolling} isPlayer={false} />
          <div className="font-display text-lg font-bold text-white">
            {rolling
              ? t(BATTLE_TEXT_CONSTANT.UI_DICE_ROLLING_SHORT)
              : botRoll === null
                ? t(BATTLE_TEXT_CONSTANT.UI_DICE_READY)
                : t(BATTLE_TEXT_CONSTANT.UI_DICE_RESULT, { value: botRoll })}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
