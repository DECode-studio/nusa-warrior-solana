"use client";

import React from "react";
import { ArrowLeft, Flag, ScrollText, ShieldAlert, SkipForward, Swords, X } from "lucide-react";
import type { BattleStateEntity } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import { BattleTurnTimer } from "./BattleTurnTimer";
import { BattleMusicControl } from "./BattleMusicControl";
import styles from "./BattleAnimations.module.css";

export interface BattleArenaHeaderProps {
  readonly battleState: BattleStateEntity;
  readonly isQuickMatch: boolean;
  readonly turnDeadlineAt: string | null;
  readonly isPlayerPromotionNeeded: boolean;
  readonly isPlayerDefenderResponse: boolean;
  readonly isBotDefenderResponse: boolean;
  readonly botDefenderResponseMessage: string;
  readonly playerDefenderResponseMessage: string;
  readonly selectedHandInstrument: CardEntity | null;
  readonly selectedAttackerFrontIndex: number | null;
  readonly confirmingSurrender: boolean;
  readonly onExitToLobby: () => void;
  readonly onToggleLogDrawer: () => void;
  readonly onSurrender: () => void;
  readonly onStartSurrenderConfirm: () => void;
  readonly onConfirmDefenderResponse: () => void;
  readonly onContinueClash: () => void;
  readonly onStartAttackSelection: () => void;
  readonly onEndTurn: () => void;
  readonly onClearSelection: () => void;
}

export function BattleArenaHeader({
  battleState,
  isQuickMatch,
  turnDeadlineAt,
  isPlayerPromotionNeeded,
  isPlayerDefenderResponse,
  isBotDefenderResponse,
  botDefenderResponseMessage,
  playerDefenderResponseMessage,
  selectedHandInstrument,
  selectedAttackerFrontIndex,
  confirmingSurrender,
  onExitToLobby,
  onToggleLogDrawer,
  onSurrender,
  onStartSurrenderConfirm,
  onConfirmDefenderResponse,
  onContinueClash,
  onStartAttackSelection,
  onEndTurn,
  onClearSelection,
}: BattleArenaHeaderProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <>
      <header
        id={BATTLE_SEMANTIC_IDS.TOP_CONTROL_BAR}
        className={`${styles.arenaHeader} z-30 flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#08070b]/85 px-3 pb-2 pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur-md sm:px-7 sm:pb-3`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            id={BATTLE_SEMANTIC_IDS.EXIT_TO_LOBBY_BTN}
            onClick={onExitToLobby}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2.5 font-display text-xs font-bold text-white/75 transition hover:bg-white/10 hover:text-white sm:px-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(BATTLE_TEXT_CONSTANT.EXIT_LOBBY_BTN)}</span>
          </button>

          <div className="min-w-0 flex-1 border-l border-white/15 pl-3 sm:pl-5">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:text-xs">
              {t(BATTLE_TEXT_CONSTANT.TITLE_KEY)}
            </p>
            <h1 id={BATTLE_SEMANTIC_IDS.ROUND_BADGE} className="truncate font-display text-xs font-bold text-white sm:text-sm">
              {t(BATTLE_TEXT_CONSTANT.ROUND_LABEL)} #{battleState.turnNumber} ·{" "}
              {battleState.activePlayer === "PLAYER"
                ? t(BATTLE_TEXT_CONSTANT.ACTIVE_PLAYER)
                : isQuickMatch
                  ? t(BATTLE_TEXT_CONSTANT.OPPONENT_TURN)
                  : t(BATTLE_TEXT_CONSTANT.ACTIVE_BOT)}{" "}
              {!isQuickMatch && <span className="font-normal text-white/55">
                ({t(battleState.botDifficulty === "EASY" ? "battle.ui.botDifficulty.easy" : battleState.botDifficulty === "MEDIUM" ? "battle.ui.botDifficulty.medium" : "battle.ui.botDifficulty.hard")})
              </span>}
            </h1>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="hidden max-w-[27vw] text-xs font-semibold xl:block"
          >
            {isPlayerPromotionNeeded && (
              <span className="rounded-md bg-emerald/20 px-2 py-0.5 font-bold text-emerald-light">
                {t(BATTLE_TEXT_CONSTANT.UI_PROMOTION_PROMPT)}
              </span>
            )}
            {isPlayerDefenderResponse && (
              <span className="inline-flex items-center gap-1 rounded-md bg-danger/20 px-2 py-0.5 font-bold text-danger-light">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                {playerDefenderResponseMessage}
              </span>
            )}
            {isBotDefenderResponse && !isQuickMatch && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 font-bold text-primary-light">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                {botDefenderResponseMessage}
              </span>
            )}
            {!isPlayerPromotionNeeded &&
              !isPlayerDefenderResponse &&
              !isBotDefenderResponse &&
              battleState.activePlayer === "PLAYER" && (
                <span className="text-muted">
                  {selectedHandInstrument
                    ? t(BATTLE_TEXT_CONSTANT.UI_SELECT_INSTRUMENT_TARGET, { name: selectedHandInstrument.name })
                    : selectedAttackerFrontIndex !== null
                      ? t(BATTLE_TEXT_CONSTANT.UI_SELECTED_ATTACKER, { index: selectedAttackerFrontIndex + 1, opponent: isQuickMatch ? t(BATTLE_TEXT_CONSTANT.UI_SIDE_OPPONENT) : t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT) })
                      : t(BATTLE_TEXT_CONSTANT.STATUS_FRONT_ROW_ATTACKER)}
                </span>
              )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <BattleTurnTimer deadlineAt={turnDeadlineAt} />
          <BattleMusicControl />
          {battleState.phase !== "MATCH_OVER" && (
            <button
              type="button"
              onClick={confirmingSurrender ? onSurrender : onStartSurrenderConfirm}
              className={`${styles.mobileSurrender} inline-flex items-center gap-1 rounded-md bg-danger/20 px-2 py-1 text-[10px] font-bold text-danger-light hover:bg-danger/30`}
            >
              <Flag className="h-3 w-3" aria-hidden="true" />
              <span>{confirmingSurrender ? t(BATTLE_TEXT_CONSTANT.UI_CONFIRM_SURRENDER_SHORT) : t(BATTLE_TEXT_CONSTANT.SURRENDER)}</span>
            </button>
          )}
          <button
            type="button"
            id={BATTLE_SEMANTIC_IDS.LOG_DRAWER_TOGGLE_BTN}
            onClick={onToggleLogDrawer}
            className="rounded-lg border border-border-base bg-surface-elevated px-2.5 py-1 font-display text-xs font-bold text-primary-light hover:border-border-strong hover:bg-surface-muted"
          >
            <ScrollText className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(BATTLE_TEXT_CONSTANT.UI_LOG_SHORT)}</span>
          </button>

        </div>
      </header>

      <div className={styles.boardActions}>
        <button
          type="button"
          id={BATTLE_SEMANTIC_IDS.ATTACK_BTN}
          onClick={onStartAttackSelection}
          disabled={battleState.activePlayer !== "PLAYER" || battleState.phase !== "PRE_ATTACK_INSTRUMENT" || !battleState.playerFrontRow.some((slot) => slot && !slot.hasAttackedThisTurn)}
          className={`${styles.boardActionButton} ${styles.attackButton}`}
        >
          <Swords className="h-4 w-4" aria-hidden="true" />
          <span>{t(BATTLE_TEXT_CONSTANT.UI_ATTACK)}</span>
        </button>

        {isPlayerDefenderResponse ? (
          <button type="button" onClick={onConfirmDefenderResponse} className={styles.boardActionButton}>
            <Swords className="h-4 w-4" aria-hidden="true" />
            <span>{t(BATTLE_TEXT_CONSTANT.UI_CONTINUE_CLASH)}</span>
          </button>
        ) : isBotDefenderResponse ? (
          isQuickMatch ? (
            <button type="button" disabled className={`${styles.boardActionButton} opacity-70`}>
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>{t(BATTLE_TEXT_CONSTANT.OPPONENT_TURN)}</span>
            </button>
          ) : (
            <button type="button" onClick={onContinueClash} className={styles.boardActionButton}>
              <Swords className="h-4 w-4" aria-hidden="true" />
              <span>{t(BATTLE_TEXT_CONSTANT.UI_CONTINUE_CLASH)}</span>
            </button>
          )
        ) : (
          <button
            type="button"
            id={BATTLE_SEMANTIC_IDS.END_TURN_BTN}
            disabled={battleState.activePlayer !== "PLAYER" || battleState.phase !== "PRE_ATTACK_INSTRUMENT"}
            onClick={onEndTurn}
            className={styles.boardActionButton}
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            <span>{t(BATTLE_TEXT_CONSTANT.END_TURN)}</span>
          </button>
        )}

        {battleState.phase !== "MATCH_OVER" && (
          <button
            type="button"
            id={BATTLE_SEMANTIC_IDS.SURRENDER_BTN}
            onClick={confirmingSurrender ? onSurrender : onStartSurrenderConfirm}
            className={`${styles.boardActionButton} ${styles.surrenderButton}`}
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            <span>{confirmingSurrender ? t(BATTLE_TEXT_CONSTANT.CONFIRM_SURRENDER) : t(BATTLE_TEXT_CONSTANT.SURRENDER)}</span>
          </button>
        )}
      </div>

      {/* Floating Mode Helper Banner */}
      {(selectedHandInstrument || selectedAttackerFrontIndex !== null || isPlayerDefenderResponse || isBotDefenderResponse) && (
        <div className={`${styles.modeHelper} flex items-center justify-between px-4 py-1 text-xs`}>
          <span className="font-semibold text-cream">
            {isBotDefenderResponse
              ? isQuickMatch
                ? `${botDefenderResponseMessage} ${t(BATTLE_TEXT_CONSTANT.UI_WAIT_OPPONENT_RESPONSE)}`
                : `${botDefenderResponseMessage} ${t(BATTLE_TEXT_CONSTANT.UI_CHECK_DEFENSE_CONTINUE)}`
              : isPlayerDefenderResponse
                ? playerDefenderResponseMessage
                : selectedHandInstrument
              ? t(BATTLE_TEXT_CONSTANT.UI_INSTRUMENT_MODE, { instrument: selectedHandInstrument.name })
              : t(BATTLE_TEXT_CONSTANT.UI_ATTACK_MODE)}
          </span>
          {!isBotDefenderResponse && !isPlayerDefenderResponse && (
            <button
              type="button"
              onClick={onClearSelection}
              className="inline-flex items-center gap-1 rounded-md bg-surface-elevated px-2.5 py-0.5 text-xs font-bold text-cream hover:bg-surface-muted"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              <span>{t(BATTLE_TEXT_CONSTANT.UI_CANCEL_SELECTION)}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
