import type { CardApiModel } from "@/client/data/card/model/card_model";
import { mapCardModelToEntity } from "@/client/data/card/model/card_model";
import type {
  CustomCardPricingEntity,
  CreateCustomCardResultEntity,
} from "@/client/domain/custom-card/entity/custom_card_entity";

export interface CustomCardPricingApiModel {
  balance: number;
  createdCount: number;
  nextCost: number;
  canAfford: boolean;
  battlePointCap: number;
}

export interface CreateCustomCardResponseApiModel {
  card: CardApiModel;
  costPaid: number;
  remainingBalance: number;
}

export function mapPricingModelToEntity(
  model: CustomCardPricingApiModel
): CustomCardPricingEntity {
  return {
    balance: model.balance,
    createdCount: model.createdCount,
    nextCost: model.nextCost,
    canAfford: model.canAfford,
    battlePointCap: model.battlePointCap,
  };
}

export function mapCreateCustomCardResponseToEntity(
  model: CreateCustomCardResponseApiModel
): CreateCustomCardResultEntity {
  return {
    card: mapCardModelToEntity(model.card),
    costPaid: model.costPaid,
    remainingBalance: model.remainingBalance,
  };
}

