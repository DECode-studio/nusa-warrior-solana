import { inject, injectable } from "@needle-di/core";
import type {
  PaymentGatewayMode,
  PaymentGatewaySettingsEntity,
  PaymentGatewayUserEntity,
  PaymentGatewayUserQueryFilter,
} from "@/client/domain/payment/entity/payment_gateway_entity";
import type { PaymentGatewayRepository } from "@/client/domain/payment/repository/payment_gateway_repository";
import { PaymentGatewayRemoteDataSource } from "../datasource/payment_gateway_remote_datasource";
import {
  toPaymentGatewaySettingsEntity,
  toPaymentGatewayUserEntity,
} from "../model/payment_gateway_model";

@injectable()
export class PaymentGatewayRepositoryImpl implements PaymentGatewayRepository {
  constructor(
    private readonly remoteDataSource: PaymentGatewayRemoteDataSource = inject(
      PaymentGatewayRemoteDataSource
    )
  ) {}

  public async getSettings(
    filter?: PaymentGatewayUserQueryFilter
  ): Promise<PaymentGatewaySettingsEntity> {
    const raw = await this.remoteDataSource.getSettings(filter);
    return toPaymentGatewaySettingsEntity(raw);
  }

  public async updateGlobalMode(
    mode: PaymentGatewayMode
  ): Promise<PaymentGatewaySettingsEntity> {
    const raw = await this.remoteDataSource.updateGlobalMode(mode);
    return toPaymentGatewaySettingsEntity(raw);
  }

  public async updateUserOverride(
    userId: string,
    mode: PaymentGatewayMode | null
  ): Promise<PaymentGatewayUserEntity> {
    const raw = await this.remoteDataSource.updateUserOverride(userId, mode);
    return toPaymentGatewayUserEntity(raw);
  }
}
