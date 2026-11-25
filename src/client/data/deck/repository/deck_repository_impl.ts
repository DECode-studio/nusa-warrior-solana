import { inject, injectable } from "@needle-di/core";
import type {
  CreateDeckRequest,
  DeckEntity,
} from "@/client/domain/deck/entity/deck_entity";
import type { DeckRepository } from "@/client/domain/deck/repository/deck_repository";
import { DeckRemoteDataSource } from "../datasource/deck_remote_datasource";
import { mapDeckModelToEntity } from "../model/deck_model";

@injectable()
export class DeckRepositoryImpl implements DeckRepository {
  constructor(
    private readonly remoteDataSource: DeckRemoteDataSource = inject(
      DeckRemoteDataSource
    )
  ) {}

  public async getDecks(): Promise<DeckEntity[]> {
    const models = await this.remoteDataSource.getDecks();
    return models.map(mapDeckModelToEntity);
  }

  public async createDeck(request: CreateDeckRequest): Promise<DeckEntity> {
    const model = await this.remoteDataSource.createDeck(request);
    return mapDeckModelToEntity(model);
  }

  public async updateDeck(id: string, request: CreateDeckRequest): Promise<DeckEntity> {
    const model = await this.remoteDataSource.updateDeck(id, request);
    return mapDeckModelToEntity(model);
  }

  public async deleteDeck(id: string): Promise<void> {
    await this.remoteDataSource.deleteDeck(id);
  }
}

