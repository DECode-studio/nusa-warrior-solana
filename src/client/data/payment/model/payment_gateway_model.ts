import type {
  PaymentGatewayMode,
  PaymentGatewaySettingsEntity,
  PaymentGatewayUserEntity,
} from "@/client/domain/payment/entity/payment_gateway_entity";

export interface PaymentGatewayUserApiModel {
  userId: string;
  name: string;
  walletAddress: string | null;
  role: string;
  paymentModeOverride: PaymentGatewayMode | null;
}

export interface PaymentGatewaySettingsApiModel {
  globalMode: PaymentGatewayMode;
  updatedByUserId: string | null;
  updatedAt: string;
  users: PaymentGatewayUserApiModel[];
  totalUsers: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function toPaymentGatewayUserEntity(
  model: PaymentGatewayUserApiModel
): PaymentGatewayUserEntity {
  return {
    userId: model.userId,
    name: model.name,
    walletAddress: model.walletAddress ?? null,
    role: model.role,
    paymentModeOverride: model.paymentModeOverride,
  };
}

export function toPaymentGatewaySettingsEntity(
  model: PaymentGatewaySettingsApiModel
): PaymentGatewaySettingsEntity {
  return {
    globalMode: model.globalMode,
    updatedByUserId: model.updatedByUserId ?? null,
    updatedAt: model.updatedAt,
    users: model.users.map(toPaymentGatewayUserEntity),
    totalUsers: model.totalUsers ?? model.users.length,
    page: model.page ?? 1,
    limit: model.limit ?? 10,
    totalPages: model.totalPages ?? 1,
  };
}
