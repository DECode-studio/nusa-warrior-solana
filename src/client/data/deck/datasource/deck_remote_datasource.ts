import { injectable } from "@needle-di/core";
import type { CreateDeckRequest } from "@/client/domain/deck/entity/deck_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type { DeckApiModel } from "../model/deck_model";

@injectable()
export class DeckRemoteDataSource {
  public async getDecks(): Promise<DeckApiModel[]> {
    return apiClient.get<DeckApiModel[]>(API_ROUTES.DECKS.LIST);
  }

  public async createDeck(request: CreateDeckRequest): Promise<DeckApiModel> {
    return apiClient.post<DeckApiModel, CreateDeckRequest>(
      API_ROUTES.DECKS.CREATE,
      request
    );
  }

  public async updateDeck(id: string, request: CreateDeckRequest): Promise<DeckApiModel> {
    return apiClient.patch<DeckApiModel, CreateDeckRequest>(
      API_ROUTES.DECKS.DETAIL(id),
      request,
    );
  }

  public async deleteDeck(id: string): Promise<void> {
    await apiClient.delete<{ deleted: boolean; id: string }>(
      API_ROUTES.DECKS.DETAIL(id)
    );
  }
}

