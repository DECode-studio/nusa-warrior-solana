import { inject, injectable } from "@needle-di/core";
import { PAYMENT_GATEWAY_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type {
  PaymentGatewayMode,
  PaymentGatewaySettingsEntity,
  PaymentGatewayUserEntity,
  PaymentGatewayUserQueryFilter,
} from "../entity/payment_gateway_entity";
import type { PaymentGatewayRepository } from "../repository/payment_gateway_repository";

@injectable()
export class PaymentGatewayUseCase {
  constructor(
    private readonly paymentGatewayRepository: PaymentGatewayRepository = inject(
      PAYMENT_GATEWAY_REPOSITORY_TOKEN
    )
  ) {}

  public async getSettings(
    filter?: PaymentGatewayUserQueryFilter
  ): Promise<PaymentGatewaySettingsEntity> {
    return this.paymentGatewayRepository.getSettings(filter);
  }

  public async updateGlobalMode(
    mode: PaymentGatewayMode
  ): Promise<PaymentGatewaySettingsEntity> {
    return this.paymentGatewayRepository.updateGlobalMode(mode);
  }

  public async updateUserOverride(
    userId: string,
    mode: PaymentGatewayMode | null
  ): Promise<PaymentGatewayUserEntity> {
    return this.paymentGatewayRepository.updateUserOverride(userId, mode);
  }
}
