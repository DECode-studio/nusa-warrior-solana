import type { CreateDeckRequest, DeckEntity } from "../entity/deck_entity";

export interface DeckRepository {
  getDecks(): Promise<DeckEntity[]>;
  createDeck(request: CreateDeckRequest): Promise<DeckEntity>;
  updateDeck(id: string, request: CreateDeckRequest): Promise<DeckEntity>;
  deleteDeck(id: string): Promise<void>;
}

