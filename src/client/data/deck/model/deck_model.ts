import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import type { KingdomValue } from "@/core/constants/cards-catalog";

export interface DeckApiModel {
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

export function mapDeckModelToEntity(model: DeckApiModel): DeckEntity {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    kingdomFilter: model.kingdomFilter,
    isPreset: model.isPreset,
    isTemporary: model.isTemporary,
    userId: model.userId,
    characterSlugs: [...model.characterSlugs],
    instrumentSlugs: [...model.instrumentSlugs],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

