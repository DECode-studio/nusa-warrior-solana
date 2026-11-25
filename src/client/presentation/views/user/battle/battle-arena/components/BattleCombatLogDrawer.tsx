"use client";

import React from "react";
import { ScrollText, X } from "lucide-react";
import type { BattleLogEntry } from "@/client/domain/battle/entity/battle_entity";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface BattleCombatLogDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly logs: readonly BattleLogEntry[];
  readonly opponentLabel?: string;
}

export function BattleCombatLogDrawer({
  isOpen,
  onClose,
  logs,
  opponentLabel,
}: BattleCombatLogDrawerProps): React.ReactElement | null {
  const { t } = useTranslator();
  const displayedOpponentLabel = opponentLabel ?? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);

  const getLogMessage = (log: BattleLogEntry): string => {
    if (!log.messageKey) return log.message;
    const params = { ...(log.messageParams ?? {}) };
    for (const name of ["actor", "firstPlayer", "nextPlayer", "winner"]) {
      const side = params[name];
      if (side === "PLAYER") params[name] = t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER);
      else if (side === "BOT") params[name] = t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);
    }
    return t(log.messageKey, params);
  };

  if (!isOpen) return null;

  return (
    <div
      id={BATTLE_SEMANTIC_IDS.BATTLE_LOG_PANEL}
      className="fixed bottom-0 right-0 top-0 z-50 flex w-80 flex-col border-l border-border-base bg-surface-base/98 p-4 shadow-2xl backdrop-blur-xl sm:w-96"
    >
      <div className="flex items-center justify-between border-b border-border-base pb-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-cream">
          <ScrollText className="h-4 w-4 text-primary-light" />
          <span>{t(BATTLE_TEXT_CONSTANT.COMBAT_LOG_TITLE)}</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted hover:bg-surface-muted hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {logs.length === 0 ? (
          <p className="text-center text-subtle pt-8">
            {t(BATTLE_TEXT_CONSTANT.COMBAT_LOG_EMPTY)}
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`rounded-lg border p-2.5 ${
                log.actor === "PLAYER"
                  ? "border-emerald/30 bg-emerald/10 text-emerald-light"
                  : log.actor === "BOT"
                    ? "border-danger/30 bg-danger/10 text-danger-light"
                    : "border-border-base bg-surface-elevated/40 text-muted"
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px] text-subtle">
                <span>{t(BATTLE_TEXT_CONSTANT.LOG_ROUND, { turn: log.turn })}</span>
                <span>{log.actor === "BOT" ? displayedOpponentLabel : log.actor === "PLAYER" ? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER) : t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_SYSTEM)}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-cream">
                {getLogMessage(log)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
