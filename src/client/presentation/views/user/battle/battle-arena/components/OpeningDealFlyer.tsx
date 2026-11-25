"use client";

import React from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import { Layers } from "lucide-react";
import { useTranslator } from "@/core/translator";

export interface OpeningDealFlyerProps {
  visible: boolean;
  firstPlayer: "PLAYER" | "BOT" | null;
  playerRoll: number | null;
  botRoll: number | null;
  opponentLabel?: string;
}

export function OpeningDealFlyer({
  visible,
  firstPlayer,
  playerRoll,
  botRoll,
  opponentLabel,
}: OpeningDealFlyerProps): React.ReactElement | null {
  const { t } = useTranslator();
  const displayedOpponentLabel = opponentLabel ?? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);
  if (!visible) {
    return null;
  }

  return (
    <div
      id="battle-opening-deal-flyer"
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
    >
      <div className="nc-panel animate-fade-in flex items-center gap-3 border border-emerald/50 px-5 py-3 shadow-2xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/15 text-emerald-light">
          <Layers className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="font-display text-sm font-bold text-[var(--nc-fg)]">
            {t(BATTLE_TEXT_CONSTANT.UI_OPENING_FORMATION)}
          </div>
          <p className="text-xs text-[var(--nc-fg-muted)]">
            {t(BATTLE_TEXT_CONSTANT.UI_SERVER_DICE_RESULT, { player: playerRoll ?? "—", opponent: displayedOpponentLabel, bot: botRoll ?? "—"})}{" "}
            <strong className="text-[var(--nc-fg)]">
              {t(BATTLE_TEXT_CONSTANT.UI_FIRST_TO_MOVE, { player: firstPlayer === "BOT" ? displayedOpponentLabel : t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER) })}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

