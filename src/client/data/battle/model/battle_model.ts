import type {
  BattleStateEntity,
  BattleSessionEntity,
  BotDifficulty,
  MatchLogEntity,
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

