import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type {
  CustomCardPricingEntity,
  CreateCustomCardParams,
  CreateCustomCardResultEntity,
} from "../entity/custom_card_entity";

export interface CustomCardRepository {
  getPricing(): Promise<CustomCardPricingEntity>;
  prepareBurn(): Promise<{
    requiresBurn: boolean;
    serializedTransaction: string | null;
  }>;
  createCustomCard(params: CreateCustomCardParams): Promise<CreateCustomCardResultEntity>;
  listUserCustomCards(): Promise<CardEntity[]>;
}

