import { inject, injectable } from "@needle-di/core";
import type {
  BattleActionSubmission,
  BattleSessionEntity,
  BotDifficulty,
  MatchLogEntity,
  QuickMatchQueueEntity,
} from "@/client/domain/battle/entity/battle_entity";
import type { BattleRepository } from "@/client/domain/battle/repository/battle_repository";
import { BattleRemoteDataSource } from "../datasource/battle_remote_datasource";
import {
  mapBattleSessionModelToEntity,
  mapMatchLogModelToEntity,
  mapQuickMatchQueueModelToEntity,
} from "../model/battle_model";

@injectable()
export class BattleRepositoryImpl implements BattleRepository {
  constructor(
    private readonly remoteDataSource: BattleRemoteDataSource = inject(
      BattleRemoteDataSource
    )
  ) {}

  public async getMatchHistory(): Promise<MatchLogEntity[]> {
    const models = await this.remoteDataSource.getMatchHistory();
    return models.map(mapMatchLogModelToEntity);
  }

  public async createSession(input: {
    deckId: string;
    idempotencyKey: string;
    botDifficulty: BotDifficulty;
  }): Promise<BattleSessionEntity> {
    return mapBattleSessionModelToEntity(
      await this.remoteDataSource.createSession(input)
    );
  }

  public async getActiveSession(): Promise<BattleSessionEntity | null> {
    const model = await this.remoteDataSource.getActiveSession();
    return model ? mapBattleSessionModelToEntity(model) : null;
  }

  public async getSession(id: string): Promise<BattleSessionEntity> {
    return mapBattleSessionModelToEntity(
      await this.remoteDataSource.getSession(id)
    );
  }

  public async reconnectSession(
    id: string
  ): Promise<BattleSessionEntity | null> {
    const model = await this.remoteDataSource.reconnectSession(id);
    return model ? mapBattleSessionModelToEntity(model) : null;
  }

  public async submitAction(
    id: string,
    input: BattleActionSubmission
  ): Promise<BattleSessionEntity> {
    return mapBattleSessionModelToEntity(
      await this.remoteDataSource.submitAction(id, input)
    );
  }

  public async joinQuickMatch(input: { deckId: string; idempotencyKey: string; acceptCardStake: true }): Promise<QuickMatchQueueEntity> {
    return mapQuickMatchQueueModelToEntity(await this.remoteDataSource.joinQuickMatch(input));
  }

  public async getQuickMatchStatus(): Promise<QuickMatchQueueEntity | null> {
    const model = await this.remoteDataSource.getQuickMatchStatus();
    return model ? mapQuickMatchQueueModelToEntity(model) : null;
  }

  public async searchQuickMatch(): Promise<QuickMatchQueueEntity | null> {
    const model = await this.remoteDataSource.searchQuickMatch();
    return model ? mapQuickMatchQueueModelToEntity(model) : null;
  }

  public async cancelQuickMatch(): Promise<boolean> {
    return this.remoteDataSource.cancelQuickMatch();
  }

}

