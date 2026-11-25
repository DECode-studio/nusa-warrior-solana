"use client";

import React, { useEffect, useState } from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import { Swords, ShieldAlert } from "lucide-react";
import type { BattleDuelOutcome } from "@/client/domain/battle/entity/battle_entity";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import styles from "./BattleAnimations.module.css";

export interface DuelStageOverlayProps {
  outcome: BattleDuelOutcome | null;
  autoContinue?: boolean;
  onDismiss: () => void;
  opponentLabel?: string;
}

export function DuelStageOverlay({
  outcome,
  autoContinue = false,
  onDismiss,
  opponentLabel,
}: DuelStageOverlayProps): React.ReactElement | null {
  const { t } = useTranslator();
  const displayedOpponentLabel = opponentLabel ?? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    if (!outcome) {
      setCanContinue(false);
      return;
    }
    setCanContinue(false);
    if (autoContinue) {
      const autoDismissTimeoutId = window.setTimeout(onDismiss, 4350);
      return () => window.clearTimeout(autoDismissTimeoutId);
    }
    const continueTimeoutId = window.setTimeout(() => setCanContinue(true), 4350);
    return () => window.clearTimeout(continueTimeoutId);
  }, [autoContinue, onDismiss, outcome]);

  if (!outcome) return null;

  const isAttackerDefeated =
    outcome.resolutionType === "COUNTER_DEFENDER_WINS";
  const isDefenderDefeated = outcome.resolutionType === "ATTACKER_WINS";
  const summaryParams = { ...(outcome.summaryMessageParams ?? {}) };
  for (const name of ["actor", "firstPlayer", "nextPlayer", "winner"]) {
    const side = summaryParams[name];
    if (side === "PLAYER") summaryParams[name] = t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER);
    else if (side === "BOT") summaryParams[name] = t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);
  }
  const summary = outcome.summaryMessageKey
    ? t(outcome.summaryMessageKey, summaryParams)
    : outcome.summaryText;

  return (
    <BaseModal
      id={BATTLE_SEMANTIC_IDS.DUEL_STAGE_OVERLAY}
      isOpen={Boolean(outcome)}
      onClose={canContinue ? onDismiss : () => {}}
      size="xl"
      mobileBehavior="modal"
      closeOnBackdropClick={false}
      showCloseButton={false}
      dragToDismiss={false}
      containerClassName={styles.duelBackdrop}
      className={`${styles.duelPanel} border border-amber/40 bg-surface-base/95 relative w-full max-w-5xl overflow-y-auto overflow-x-hidden p-4 sm:p-6 text-center`}
      ariaLabel={t(BATTLE_TEXT_CONSTANT.ARIA_DUEL)}
      footer={
        canContinue && !autoContinue ? (
          <div className="flex w-full justify-center">
            <Button
              type="button"
              id="btn-close-duel-stage"
              onClick={onDismiss}
              variant="primary"
              size="md"
              className="px-8 font-display"
            >
              {t(BATTLE_TEXT_CONSTANT.ACTION_CONTINUE)}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit]">
        <div className={styles.duelPanelGlow} />
        <div className={`${styles.duelImpact} h-64 w-64 rounded-full border-4 border-amber/50`} />
      </div>

      <div className={`${styles.duelEyebrow} relative mx-auto mb-3 w-fit`}>
        {t(BATTLE_TEXT_CONSTANT.UI_DUEL_RESOLUTION)}
      </div>
      <h2 className={`${styles.duelTitle} relative font-display text-xl font-bold text-cream sm:text-2xl`}>
        {outcome.counterAttackTriggered
          ? t(BATTLE_TEXT_CONSTANT.UI_DUEL_COUNTER_TITLE)
          : t(BATTLE_TEXT_CONSTANT.UI_DUEL_TITLE)}
      </h2>

      <div className={`${styles.duelCardsStage} relative my-4 flex flex-col items-center justify-center gap-4 sm:my-6 md:flex-row md:gap-12`}>
        <div className={`flex flex-col items-center gap-2 ${styles.duelAttacker}`}>
          <span className={`${styles.duelRole} ${styles.duelRoleAttacker}`}>
            {t(BATTLE_TEXT_CONSTANT.UI_ATTACKER, { actor: outcome.attackerSide === "PLAYER" ? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER) : displayedOpponentLabel })}
          </span>
          <CardVisual
            card={outcome.attackerCard}
            size="md"
            currentAttack={outcome.effectiveAttackerAtk}
            currentDefense={outcome.effectiveAttackerDef}
            showName={false}
            badgeContent="role"
            className={isAttackerDefeated ? styles.duelCardDestroyed : ""}
          />
          {isAttackerDefeated && (
            <span className={`${styles.duelDeathLabel} rounded-lg px-2.5 py-1 text-xs font-bold text-cream`}>
              {t(BATTLE_TEXT_CONSTANT.UI_DEFEATED_BY_COUNTER)}
            </span>
          )}
        </div>

        <div className="my-1 flex shrink-0 flex-col items-center gap-1.5 md:my-0">
          <div className={`${styles.duelSigil} flex h-11 w-11 items-center justify-center rounded-full sm:h-12 sm:w-12`}>
            {outcome.counterAttackTriggered ? (
              <ShieldAlert
                className="h-5 w-5 text-danger-light sm:h-6 sm:w-6"
                aria-hidden="true"
              />
            ) : (
              <Swords className="h-5 w-5 text-primary-light sm:h-6 sm:w-6" aria-hidden="true" />
            )}
          </div>
          {outcome.ignoredDefenseAmount > 0 && (
            <span className="nc-badge-amber mt-1 text-xs">
              {t(BATTLE_TEXT_CONSTANT.UI_DEFENSE_PIERCED, { amount: outcome.ignoredDefenseAmount })}
            </span>
          )}
        </div>

        <div className={`flex flex-col items-center gap-2 ${styles.duelDefender}`}>
          <span className={`${styles.duelRole} ${styles.duelRoleDefender}`}>
            {t(BATTLE_TEXT_CONSTANT.UI_DEFENDER, { actor: outcome.attackerSide === "PLAYER" ? displayedOpponentLabel : t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER) })}
          </span>
          <CardVisual
            card={outcome.defenderCard}
            size="md"
            currentAttack={outcome.effectiveDefenderAtk}
            currentDefense={outcome.effectiveDefenderDef}
            showName={false}
            badgeContent="role"
            className={isDefenderDefeated ? styles.duelCardDestroyed : ""}
          />
          {isDefenderDefeated && (
            <span className={`${styles.duelDeathLabel} rounded-lg px-2.5 py-1 text-xs font-bold text-white`}>
              {t(BATTLE_TEXT_CONSTANT.UI_DEFEATED)}
            </span>
          )}
        </div>
      </div>

      <div className={`${styles.duelSummary} relative mx-auto max-w-3xl p-4 text-sm font-semibold text-white sm:p-5`}>
        {summary}
      </div>
    </BaseModal>
  );
}
