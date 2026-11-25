import "server-only";
import type { KingdomValue } from "@/core/constants/cards-catalog";
import type { StoredDeckRecord } from "@/server/shared/db/embedded-store";

export interface EnrichedDeckDto {
  id: string;
  name: string;
  description: string | null;
  kingdomFilter: KingdomValue | "MIXED" | null;
  isPreset: boolean;
  isTemporary?: boolean;
  userId: string | null;
  characterSlugs: string[];
  instrumentSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckInput {
  name: string;
  description: string | null;
  kingdomFilter: KingdomValue | "MIXED" | null;
  userId: string | null;
  characterSlugs: string[];
  instrumentSlugs: string[];
}

export interface DeckRepository {
  listDecks(userId: string | null): Promise<EnrichedDeckDto[]>;
  createDeck(input: CreateDeckInput): Promise<EnrichedDeckDto>;
  updateDeck(deckId: string, input: CreateDeckInput): Promise<EnrichedDeckDto>;
  deleteDeck(deckId: string, userId: string): Promise<void>;
}

