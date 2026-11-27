import type {
  BattleStateEntity,
  BattleSessionEntity,
  BotDifficulty,
  ConfirmVaultLockEntity,
  MatchLogEntity,
  PrepareVaultLockEntity,
  QuickMatchQueueEntity,
} from "@/client/domain/battle/entity/battle_entity";

export interface BattleSessionApiModel {
  id: string;
  sequence: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  rulesVersion: string;
  turnDeadlineAt: string | null;
  state: BattleStateEntity;
  isQuickMatch?: boolean;
  opponentName?: string | null;
  rewardCardSlug?: string | null;
  storyKingdom?: "MAJAPAHIT" | "PAJAJARAN" | null;
  storyMissionId?: string | null;
  storyChoiceId?: string | null;
  vaultPda?: string | null;
  playerLockTxSignature?: string | null;
  opponentLockTxSignature?: string | null;
  viewerLockTxSignature?: string | null;
  settleTxSignature?: string | null;
  vaultLockRequired?: boolean;
  viewerVaultLocked?: boolean;
  opponentVaultLocked?: boolean;
}

export interface PrepareVaultLockApiModel {
  matchId: string;
  vaultPda: string;
  cardCount: number;
  alreadyLocked: boolean;
  serializedTransactions: string[];
}

export interface ConfirmVaultLockApiModel {
  matchId: string;
  vaultPda: string;
  txSignatures: string[];
  primaryTxSignature: string;
  explorerUrls: string[];
  bothLocked: boolean;
}

export interface QuickMatchQueueApiModel {
  id: string;
  status: "WAITING" | "MATCHED" | "CANCELLED";
  battlePower: number;
  createdAt: string;
  waitMs: number;
  session: BattleSessionApiModel | null;
}

export interface MatchLogApiModel {
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

export function mapBattleSessionModelToEntity(
  model: BattleSessionApiModel
): BattleSessionEntity {
  return {
    id: model.id,
    sequence: model.sequence,
    status: model.status,
    rulesVersion: model.rulesVersion,
    turnDeadlineAt: model.turnDeadlineAt,
    state: model.state,
    isQuickMatch: model.isQuickMatch,
    opponentName: model.opponentName,
    rewardCardSlug: model.rewardCardSlug,
    storyKingdom: model.storyKingdom,
    storyMissionId: model.storyMissionId,
    storyChoiceId: model.storyChoiceId,
    vaultPda: model.vaultPda ?? null,
    playerLockTxSignature: model.playerLockTxSignature ?? null,
    opponentLockTxSignature: model.opponentLockTxSignature ?? null,
    viewerLockTxSignature: model.viewerLockTxSignature ?? null,
    settleTxSignature: model.settleTxSignature ?? null,
    vaultLockRequired: model.vaultLockRequired,
    viewerVaultLocked: model.viewerVaultLocked,
    opponentVaultLocked: model.opponentVaultLocked,
  };
}

export function mapPrepareVaultLockModelToEntity(
  model: PrepareVaultLockApiModel
): PrepareVaultLockEntity {
  return {
    matchId: model.matchId,
    vaultPda: model.vaultPda,
    cardCount: model.cardCount,
    alreadyLocked: model.alreadyLocked,
    serializedTransactions: model.serializedTransactions,
  };
}

export function mapConfirmVaultLockModelToEntity(
  model: ConfirmVaultLockApiModel
): ConfirmVaultLockEntity {
  return {
    matchId: model.matchId,
    vaultPda: model.vaultPda,
    txSignatures: model.txSignatures,
    primaryTxSignature: model.primaryTxSignature,
    explorerUrls: model.explorerUrls,
    bothLocked: model.bothLocked,
  };
}

export function mapQuickMatchQueueModelToEntity(
  model: QuickMatchQueueApiModel
): QuickMatchQueueEntity {
  return {
    id: model.id,
    status: model.status,
    battlePower: model.battlePower,
    createdAt: model.createdAt,
    waitMs: model.waitMs,
    session: model.session ? mapBattleSessionModelToEntity(model.session) : null,
  };
}

export function mapMatchLogModelToEntity(
  model: MatchLogApiModel
): MatchLogEntity {
  return {
    id: model.id,
    userId: model.userId,
    playerDeckName: model.playerDeckName,
    botDifficulty: model.botDifficulty,
    winner: model.winner,
    totalTurns: model.totalTurns,
    durationSec: model.durationSec,
    playerScore: model.playerScore,
    botScore: model.botScore,
    createdAt: model.createdAt,
  };
}

