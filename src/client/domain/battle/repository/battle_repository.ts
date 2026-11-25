import type {
  BattleActionSubmission,
  BattleSessionEntity,
  BotDifficulty,
  MatchLogEntity,
  QuickMatchQueueEntity,
} from "../entity/battle_entity";

export interface BattleRepository {
  getMatchHistory(): Promise<MatchLogEntity[]>;
  createSession(input: {
    deckId: string;
    idempotencyKey: string;
    botDifficulty: BotDifficulty;
  }): Promise<BattleSessionEntity>;
  getActiveSession(): Promise<BattleSessionEntity | null>;
  getSession(id: string): Promise<BattleSessionEntity>;
  reconnectSession(id: string): Promise<BattleSessionEntity | null>;
  submitAction(
    id: string,
    input: BattleActionSubmission
  ): Promise<BattleSessionEntity>;
  joinQuickMatch(input: { deckId: string; idempotencyKey: string; acceptCardStake: true }): Promise<QuickMatchQueueEntity>;
  getQuickMatchStatus(): Promise<QuickMatchQueueEntity | null>;
  searchQuickMatch(): Promise<QuickMatchQueueEntity | null>;
  cancelQuickMatch(): Promise<boolean>;
}

