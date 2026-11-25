export type PaymentGatewayMode = "DEV" | "PROD";

export interface PaymentGatewayUserEntity {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly paymentModeOverride: PaymentGatewayMode | null;
}

export interface PaymentGatewaySettingsEntity {
  readonly globalMode: PaymentGatewayMode;
  readonly updatedByUserId: string | null;
  readonly updatedAt: string;
  readonly users: readonly PaymentGatewayUserEntity[];
  readonly totalUsers: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface PaymentGatewayUserQueryFilter {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
}

export interface UpdatePaymentGatewayGlobalRequest {
  readonly scope: "global";
  readonly mode: PaymentGatewayMode;
}

export interface UpdatePaymentGatewayUserRequest {
  readonly scope: "user";
  readonly userId: string;
  readonly mode: PaymentGatewayMode | null;
}

export type UpdatePaymentGatewayRequest =
  | UpdatePaymentGatewayGlobalRequest
  | UpdatePaymentGatewayUserRequest;
