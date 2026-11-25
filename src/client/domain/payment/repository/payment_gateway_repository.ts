import type {
  PaymentGatewayMode,
  PaymentGatewaySettingsEntity,
  PaymentGatewayUserEntity,
  PaymentGatewayUserQueryFilter,
} from "../entity/payment_gateway_entity";

export interface PaymentGatewayRepository {
  getSettings(
    filter?: PaymentGatewayUserQueryFilter
  ): Promise<PaymentGatewaySettingsEntity>;
  updateGlobalMode(
    mode: PaymentGatewayMode
  ): Promise<PaymentGatewaySettingsEntity>;
  updateUserOverride(
    userId: string,
    mode: PaymentGatewayMode | null
  ): Promise<PaymentGatewayUserEntity>;
}
