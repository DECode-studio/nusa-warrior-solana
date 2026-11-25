import { inject, injectable } from "@needle-di/core";
import { DECK_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type { CreateDeckRequest, DeckEntity } from "../entity/deck_entity";
import type { DeckRepository } from "../repository/deck_repository";

@injectable()
export class DeckUseCase {
  constructor(
    private readonly deckRepository: DeckRepository = inject(
      DECK_REPOSITORY_TOKEN
    )
  ) {}

  public async getDecks(): Promise<DeckEntity[]> {
    return this.deckRepository.getDecks();
  }

  public async createDeck(request: CreateDeckRequest): Promise<DeckEntity> {
    return this.deckRepository.createDeck(request);
  }

  public async updateDeck(id: string, request: CreateDeckRequest): Promise<DeckEntity> {
    return this.deckRepository.updateDeck(id, request);
  }

  public async deleteDeck(id: string): Promise<void> {
    return this.deckRepository.deleteDeck(id);
  }
}

