import type { KingdomValue } from "@/core/constants/cards-catalog";

export interface DeckEntity {
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

export interface CreateDeckRequest {
  name: string;
  description: string | null;
  kingdomFilter: KingdomValue | "MIXED";
  characterSlugs: string[];
  instrumentSlugs: string[];
}

