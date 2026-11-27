import { inject, injectable } from "@needle-di/core";
import { BATTLE_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type {
  BattleActionSubmission,
  BattleSessionEntity,
  BotDifficulty,
  ConfirmVaultLockEntity,
  MatchLogEntity,
  PrepareVaultLockEntity,
  QuickMatchQueueEntity,
} from "../entity/battle_entity";
import type { BattleRepository } from "../repository/battle_repository";

@injectable()
export class BattleUseCase {
  constructor(
    private readonly battleRepository: BattleRepository = inject(
      BATTLE_REPOSITORY_TOKEN
    )
  ) {}

  public async getMatchHistory(): Promise<MatchLogEntity[]> {
    return this.battleRepository.getMatchHistory();
  }

  public async createSession(input: {
    deckId: string;
    idempotencyKey: string;
    botDifficulty: BotDifficulty;
  }): Promise<BattleSessionEntity> {
    return this.battleRepository.createSession(input);
  }

  public async getActiveSession(): Promise<BattleSessionEntity | null> {
    return this.battleRepository.getActiveSession();
  }

  public async getSession(id: string): Promise<BattleSessionEntity> {
    return this.battleRepository.getSession(id);
  }

  public async reconnectSession(
    id: string
  ): Promise<BattleSessionEntity | null> {
    return this.battleRepository.reconnectSession(id);
  }

  public async submitAction(
    id: string,
    input: BattleActionSubmission
  ): Promise<BattleSessionEntity> {
    return this.battleRepository.submitAction(id, input);
  }

  public async joinQuickMatch(input: { deckId: string; idempotencyKey: string; acceptCardStake: true }): Promise<QuickMatchQueueEntity> {
    return this.battleRepository.joinQuickMatch(input);
  }

  public async getQuickMatchStatus(): Promise<QuickMatchQueueEntity | null> {
    return this.battleRepository.getQuickMatchStatus();
  }

  public async searchQuickMatch(): Promise<QuickMatchQueueEntity | null> {
    return this.battleRepository.searchQuickMatch();
  }

  public async cancelQuickMatch(): Promise<boolean> {
    return this.battleRepository.cancelQuickMatch();
  }

  public async prepareVaultLock(id: string): Promise<PrepareVaultLockEntity> {
    return this.battleRepository.prepareVaultLock(id);
  }

  public async confirmVaultLock(
    id: string,
    txSignatures: string[]
  ): Promise<ConfirmVaultLockEntity> {
    return this.battleRepository.confirmVaultLock(id, txSignatures);
  }

}

