import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { ApiClientError, apiClient } from "@/core/http-client/api-client";
import type {
  BattleActionSubmission,
  BotDifficulty,
} from "@/client/domain/battle/entity/battle_entity";
import type {
  BattleSessionApiModel,
  ConfirmVaultLockApiModel,
  MatchLogApiModel,
  PrepareVaultLockApiModel,
  QuickMatchQueueApiModel,
} from "../model/battle_model";

@injectable()
export class BattleRemoteDataSource {
  public async getMatchHistory(): Promise<MatchLogApiModel[]> {
    return apiClient.get<MatchLogApiModel[]>(API_ROUTES.MATCHES.LIST);
  }

  public async createSession(input: {
    deckId: string;
    idempotencyKey: string;
    botDifficulty: BotDifficulty;
  }): Promise<BattleSessionApiModel> {
    return apiClient.post<BattleSessionApiModel>(API_ROUTES.BATTLES.create, input);
  }

  public async getActiveSession(): Promise<BattleSessionApiModel | null> {
    return apiClient.get<BattleSessionApiModel | null>(API_ROUTES.BATTLES.active);
  }

  public async getSession(id: string): Promise<BattleSessionApiModel> {
    return apiClient.get<BattleSessionApiModel>(API_ROUTES.BATTLES.detail(id));
  }

  public async reconnectSession(
    id: string
  ): Promise<BattleSessionApiModel | null> {
    try {
      return await apiClient.post<BattleSessionApiModel>(
        API_ROUTES.BATTLES.reconnect(id),
        {}
      );
    } catch (error: unknown) {
      if (error instanceof ApiClientError && [404, 409].includes(error.status)) {
        return null;
      }
      throw error;
    }
  }

  public async submitAction(
    id: string,
    input: BattleActionSubmission
  ): Promise<BattleSessionApiModel> {
    return apiClient.post<BattleSessionApiModel>(
      API_ROUTES.BATTLES.actions(id),
      input
    );
  }

  public async joinQuickMatch(input: { deckId: string; idempotencyKey: string; acceptCardStake: true }): Promise<QuickMatchQueueApiModel> {
    return apiClient.post<QuickMatchQueueApiModel>(API_ROUTES.BATTLES.quickMatch, input);
  }

  public async getQuickMatchStatus(): Promise<QuickMatchQueueApiModel | null> {
    return apiClient.get<QuickMatchQueueApiModel | null>(API_ROUTES.BATTLES.quickMatch);
  }

  public async searchQuickMatch(): Promise<QuickMatchQueueApiModel | null> {
    return apiClient.post<QuickMatchQueueApiModel | null>(API_ROUTES.BATTLES.quickMatchSearch, {});
  }

  public async cancelQuickMatch(): Promise<boolean> {
    const response = await apiClient.delete<{ cancelled: boolean }>(API_ROUTES.BATTLES.quickMatch);
    return response.cancelled;
  }

  public async prepareVaultLock(id: string): Promise<PrepareVaultLockApiModel> {
    return apiClient.post<PrepareVaultLockApiModel>(
      API_ROUTES.BATTLES.vaultPrepare(id),
      {}
    );
  }

  public async confirmVaultLock(
    id: string,
    txSignatures: string[]
  ): Promise<ConfirmVaultLockApiModel> {
    return apiClient.post<ConfirmVaultLockApiModel>(
      API_ROUTES.BATTLES.vaultConfirm(id),
      { txSignatures }
    );
  }

}

