import { inject, injectable } from "@needle-di/core";
import { CUSTOM_CARD_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type { CustomCardRepository } from "../repository/custom_card_repository";
import type {
  CustomCardPricingEntity,
  CreateCustomCardParams,
  CreateCustomCardResultEntity,
} from "../entity/custom_card_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";

@injectable()
export class CustomCardUseCase {
  constructor(
    private readonly repository: CustomCardRepository = inject(
      CUSTOM_CARD_REPOSITORY_TOKEN
    )
  ) {}

  async getPricing(): Promise<CustomCardPricingEntity> {
    return this.repository.getPricing();
  }

  async prepareBurn(): Promise<{
    requiresBurn: boolean;
    serializedTransaction: string | null;
  }> {
    return this.repository.prepareBurn();
  }

  async createCustomCard(params: CreateCustomCardParams): Promise<CreateCustomCardResultEntity> {
    return this.repository.createCustomCard(params);
  }

  async listUserCustomCards(): Promise<CardEntity[]> {
    return this.repository.listUserCustomCards();
  }
}

