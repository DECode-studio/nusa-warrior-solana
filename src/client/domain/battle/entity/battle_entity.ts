import type { CardEntity } from "@/client/domain/card/entity/card_entity";

export type BotDifficulty = "EASY" | "MEDIUM" | "HARD";

export type BattleAction =
  | { type: "ROLL_DICE" }
  | {
      type: "PLAY_INSTRUMENT";
      handInstanceId: string;
      targetRow: "FRONT" | "SECOND";
      targetIndex: number;
      targetSide?: "OWN" | "OPPONENT";
    }
  | {
      type: "DECLARE_ATTACK";
      attackerFrontIndex: number;
      defenderFrontIndex: number;
    }
  | { type: "CONFIRM_DEFENDER_RESPONSE" }
  | { type: "CONTINUE_CLASH" }
  | { type: "PROMOTE_CHARACTER"; secondRowIndex: number }
  | { type: "END_TURN" }
  | { type: "DISCARD_INSTRUMENT"; handInstanceId: string }
  | { type: "SURRENDER" };

export interface BattleSessionEntity {
  readonly id: string;
  readonly sequence: number;
  readonly status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  readonly rulesVersion: string;
  readonly turnDeadlineAt: string | null;
  readonly state: BattleStateEntity;
  readonly isQuickMatch?: boolean;
  readonly opponentName?: string | null;
  readonly rewardCardSlug?: string | null;
  readonly storyKingdom?: "MAJAPAHIT" | "PAJAJARAN" | null;
  readonly storyMissionId?: string | null;
  readonly storyChoiceId?: string | null;
}

export interface QuickMatchQueueEntity {
  readonly id: string;
  readonly status: "WAITING" | "MATCHED" | "CANCELLED";
  readonly battlePower: number;
  readonly createdAt: string;
  readonly waitMs: number;
  readonly session: BattleSessionEntity | null;
}

export interface BattleActionSubmission {
  readonly expectedSequence: number;
  readonly idempotencyKey: string;
  readonly action: BattleAction;
}

export type BattlePhase =
  | "DICE_ROLL"
  | "DRAW_INSTRUMENT"
  | "PRE_ATTACK_INSTRUMENT"
  | "DECLARE_ATTACK"
  | "DEFENDER_INSTRUMENT_RESPONSE"
  | "RESOLVE_COMBAT"
  | "PROMOTE_CHARACTER"
  | "MATCH_OVER";

export interface ActiveBuffInfo {
  instrumentName: string;
  instrumentSlug: string;
  attackDelta: number;
  defenseDelta: number;
  enemyAttackDelta: number;
  ignoreDefenseAmount: number;
  strikeAttackBonus: number;
  synergyTriggered: boolean;
}

export interface BattleSlotCharacter {
  instanceId: string;
  card: CardEntity;
  isRevealed: boolean;
  currentAttack: number;
  currentDefense: number;
  tempAttackMod: number;
  tempDefenseMod: number;
  tempEnemyAttackMod: number;
  tempIgnoreDefense: number;
  appliedInstruments: ActiveBuffInfo[];
  hasAttackedThisTurn: boolean;
}

export interface BattleHandInstrument {
  instanceId: string;
  card: CardEntity;
}

export interface PendingAttackDeclaration {
  attackerSide: "PLAYER" | "BOT";
  attackerFrontIndex: number;
  defenderFrontIndex: number;
}

export interface PendingPromotionState {
  side: "PLAYER" | "BOT";
  emptyFrontIndex: number;
}

export type CombatResolutionType =
  | "ATTACKER_WINS"
  | "TIE"
  | "COUNTER_DEFENDER_WINS"
  | "COUNTER_BOTH_SURVIVE";

export interface BattleDuelOutcome {
  id: string;
  attackerSide: "PLAYER" | "BOT";
  attackerFrontIndex: number;
  defenderFrontIndex: number;
  attackerCard: CardEntity;
  defenderCard: CardEntity;
  effectiveAttackerAtk: number;
  effectiveAttackerDef: number;
  effectiveDefenderAtk: number;
  effectiveDefenderDef: number;
  ignoredDefenseAmount: number;
  resolutionType: CombatResolutionType;
  counterAttackTriggered: boolean;
  defeatedSide: "PLAYER" | "BOT" | null;
  defeatedFrontIndex: number | null;
  summaryText: string;
  summaryMessageKey?: string;
  summaryMessageParams?: Record<string, string | number>;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  actor: "PLAYER" | "BOT" | "SYSTEM";
  message: string;
  /** Optional localization metadata; older saved logs keep only `message`. */
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  highlight?: "COMBAT" | "INSTRUMENT" | "PROMOTION" | "SYNERGY";
}

export interface BattleStateEntity {
  matchId: string;
  turnNumber: number;
  /** Number of attacks declared by the active player this turn. */
  attacksThisTurn?: number;
  activePlayer: "PLAYER" | "BOT";
  phase: BattlePhase;
  botDifficulty: BotDifficulty;
  playerDeckName: string;
  diceRollResult: {
    playerRoll: number;
    botRoll: number;
    firstPlayer: "PLAYER" | "BOT";
  } | null;
  playerFrontRow: Array<BattleSlotCharacter | null>; // 2 slots [0, 1]
  playerSecondRow: Array<BattleSlotCharacter | null>; // 3 slots [0, 1, 2]
  botFrontRow: Array<BattleSlotCharacter | null>; // 2 slots [0, 1]
  botSecondRow: Array<BattleSlotCharacter | null>; // 3 slots [0, 1, 2]
  playerCharacterDeck: CardEntity[];
  botCharacterDeck: CardEntity[];
  playerInstrumentDeck: CardEntity[];
  botInstrumentDeck: CardEntity[];
  playerInstrumentHand: BattleHandInstrument[]; // max 6
  botInstrumentHand: BattleHandInstrument[]; // max 6
  playerInstrumentDiscard: CardEntity[];
  botInstrumentDiscard: CardEntity[];
  playerGraveyard: CardEntity[];
  botGraveyard: CardEntity[];
  pendingAttack: PendingAttackDeclaration | null;
  pendingPromotion: PendingPromotionState | null;
  lastDuelOutcome: BattleDuelOutcome | null;
  winner: "PLAYER" | "BOT" | null;
  battleLogs: BattleLogEntry[];
  startedAtMs: number;
}

export interface MatchLogEntity {
  id: string;
  userId: string | null;
  playerDeckName: string;
  botDifficulty: BotDifficulty | "PVP";
  winner: "PLAYER" | "BOT";
  totalTurns: number;
  durationSec: number;
  playerScore: number;
  botScore: number;
  createdAt: string;
}


