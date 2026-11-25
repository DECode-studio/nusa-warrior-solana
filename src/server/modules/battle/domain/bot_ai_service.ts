import "server-only";
import type { BattleStateEntity } from "@/client/domain/battle/entity/battle_entity";
import { checkInstrumentSynergy } from "./battle_engine";

export interface BotInstrumentDecision {
  handInstanceId: string;
  targetRow: "FRONT" | "SECOND";
  targetIndex: number;
  targetSide?: "OWN" | "OPPONENT";
}

export interface BotAttackDecision {
  attackerFrontIndex: number;
  defenderFrontIndex: number;
}

export class BotAiService {
  public static choosePreAttackInstrument(
    state: BattleStateEntity
  ): BotInstrumentDecision | null {
    // In EASY (Pemula / Latihan Dasar):
    // Bot does not use pre-attack buffs. This keeps combat transparent and easy to follow for new players.
    if (state.botDifficulty === "EASY") {
      return null;
    }

    if (state.botInstrumentHand.length === 0) {
      return null;
    }

    const availableAttackers = state.botFrontRow
      .map((slot, index) => ({ slot, index }))
      .filter((item) => item.slot !== null && !item.slot.hasAttackedThisTurn);

    if (availableAttackers.length === 0) {
      return null;
    }

    // Limit to at most 1 instrument per attack step for natural pacing
    const attackerEntry = availableAttackers[0];
    const attackerSlot = attackerEntry.slot!;
    if (attackerSlot.appliedInstruments.length >= 1) {
      return null;
    }

    const offensiveHand = state.botInstrumentHand.filter(
      (h) =>
        h.card.attackMod > 0 ||
        h.card.ignoreDefenseAmount > 0 ||
        h.card.enemyAttackMod < 0 ||
        h.card.strikeAttackBonus > 0
    );

    if (offensiveHand.length === 0) {
      return null;
    }

    // On MEDIUM/HARD, prefer instrument that triggers affinity synergy
    for (const item of offensiveHand) {
      if (item.card.effectType === "DEBUFF_ENEMY_ATK") {
        const targets = state.playerFrontRow
          .map((slot, index) => ({ slot, index }))
          .filter((candidate) => candidate.slot !== null);
        const synergyTarget = targets.find((candidate) =>
          checkInstrumentSynergy(candidate.slot!.card, item.card)
        );
        const target = synergyTarget ?? targets[0];
        if (target) {
          return {
            handInstanceId: item.instanceId,
            targetRow: "FRONT",
            targetIndex: target.index,
            targetSide: "OPPONENT",
          };
        }
        continue;
      }
      for (const cand of availableAttackers) {
        if (
          cand.slot &&
          checkInstrumentSynergy(cand.slot.card, item.card)
        ) {
          return {
            handInstanceId: item.instanceId,
            targetRow: "FRONT",
            targetIndex: cand.index,
          };
        }
      }
    }

    return {
      handInstanceId: offensiveHand[0].instanceId,
      targetRow: "FRONT",
      targetIndex: attackerEntry.index,
    };
  }

  public static chooseAttackDeclaration(
    state: BattleStateEntity
  ): BotAttackDecision | null {
    const botAttackers = state.botFrontRow
      .map((slot, index) => ({ slot, index }))
      .filter((item) => item.slot !== null && !item.slot.hasAttackedThisTurn);

    const playerTargets = state.playerFrontRow
      .map((slot, index) => ({ slot, index }))
      .filter((item) => item.slot !== null);

    if (botAttackers.length === 0 || playerTargets.length === 0) {
      return null;
    }

    // In EASY (Pemula / Latihan Dasar):
    // Bot attacks straightforwardly along lanes (direct opposing slot if present, otherwise first available).
    // It does not calculate optimal sniper min-max kills against the player's weakest card.
    if (state.botDifficulty === "EASY") {
      const firstAttacker = botAttackers[0];
      const opposingTarget =
        playerTargets.find((t) => t.index === firstAttacker.index) ??
        playerTargets[0];

      return {
        attackerFrontIndex: firstAttacker.index,
        defenderFrontIndex: opposingTarget.index,
      };
    }

    let bestDecision: BotAttackDecision | null = null;
    let bestScore = -9999;

    for (const atk of botAttackers) {
      const attacker = atk.slot!;
      for (const def of playerTargets) {
        const defender = def.slot!;
        const effectiveAtk = attacker.currentAttack;
        const effectiveDef = Math.max(
          0,
          defender.currentDefense - attacker.tempIgnoreDefense
        );

        let score = effectiveAtk - effectiveDef;
        if (effectiveAtk > effectiveDef) {
          score += 2000;
          // On HARD, prioritize neutralizing high-threat targets
          if (state.botDifficulty === "HARD" && defender.currentAttack >= 1100) {
            score += 500;
          }
        } else if (effectiveAtk === effectiveDef) {
          score += 100;
        } else {
          // Risk of counter-attack
          if (defender.currentAttack > attacker.currentDefense) {
            score -= 1500;
          } else {
            score -= 200;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestDecision = {
            attackerFrontIndex: atk.index,
            defenderFrontIndex: def.index,
          };
        }
      }
    }

    if (bestScore < -500) {
      // Avoid suicidal attacks on MEDIUM/HARD
      return null;
    }

    return bestDecision;
  }

  public static chooseDefensiveInstrument(
    state: BattleStateEntity
  ): BotInstrumentDecision | null {
    // In EASY (Pemula / Latihan Dasar):
    // Bot does not play defensive response instruments against player attacks.
    // This allows player attacks to connect when ATK > DEF and prevents frustrating counter-attack deaths.
    if (state.botDifficulty === "EASY") {
      return null;
    }

    if (!state.pendingAttack || state.pendingAttack.attackerSide !== "PLAYER") {
      return null;
    }

    const defenderIndex = state.pendingAttack.defenderFrontIndex;
    const defender = state.botFrontRow[defenderIndex];
    const attacker =
      state.playerFrontRow[state.pendingAttack.attackerFrontIndex];

    if (!defender || !attacker || state.botInstrumentHand.length === 0) {
      return null;
    }

    // Only play defensive instrument if attacker currently threatens defender
    if (attacker.currentAttack < defender.currentDefense) {
      return null;
    }

    const defensiveCandidates = state.botInstrumentHand.filter(
      (h) => h.card.defenseMod > 0 || h.card.enemyAttackMod < 0
    );

    if (defensiveCandidates.length === 0) {
      return null;
    }

    for (const item of defensiveCandidates) {
      if (item.card.effectType === "DEBUFF_ENEMY_ATK") {
        return {
          handInstanceId: item.instanceId,
          targetRow: "FRONT",
          targetIndex: state.pendingAttack.attackerFrontIndex,
          targetSide: "OPPONENT",
        };
      }
      if (checkInstrumentSynergy(defender.card, item.card)) {
        return {
          handInstanceId: item.instanceId,
          targetRow: "FRONT",
          targetIndex: defenderIndex,
        };
      }
    }

    return {
      handInstanceId: defensiveCandidates[0].instanceId,
      targetRow: "FRONT",
      targetIndex: defenderIndex,
    };
  }

  public static chooseSecondRowPromotionIndex(
    state: BattleStateEntity
  ): number {
    const candidates = state.botSecondRow
      .map((slot, index) => ({ slot, index }))
      .filter((item) => item.slot !== null);

    if (candidates.length === 0) {
      return 0;
    }

    // In EASY: Pick first available slot naturally instead of min-maxing the strongest unit
    if (state.botDifficulty === "EASY") {
      return candidates[0].index;
    }

    candidates.sort((a, b) => {
      const scoreA =
        (a.slot?.currentAttack ?? 0) + (a.slot?.currentDefense ?? 0);
      const scoreB =
        (b.slot?.currentAttack ?? 0) + (b.slot?.currentDefense ?? 0);
      return scoreB - scoreA;
    });

    return candidates[0].index;
  }
}

