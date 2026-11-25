import { injectable } from "@needle-di/core";
import type {
  PaymentGatewayMode,
  PaymentGatewayUserQueryFilter,
  UpdatePaymentGatewayGlobalRequest,
  UpdatePaymentGatewayUserRequest,
} from "@/client/domain/payment/entity/payment_gateway_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  PaymentGatewaySettingsApiModel,
  PaymentGatewayUserApiModel,
} from "../model/payment_gateway_model";

@injectable()
export class PaymentGatewayRemoteDataSource {
  public async getSettings(
    filter?: PaymentGatewayUserQueryFilter
  ): Promise<PaymentGatewaySettingsApiModel> {
    return apiClient.get<PaymentGatewaySettingsApiModel>(
      API_ROUTES.ADMIN.PAYMENT_GATEWAY,
      {
        page: filter?.page,
        limit: filter?.limit,
        search: filter?.search,
      }
    );
  }

  public async updateGlobalMode(
    mode: PaymentGatewayMode
  ): Promise<PaymentGatewaySettingsApiModel> {
    const payload: UpdatePaymentGatewayGlobalRequest = {
      scope: "global",
      mode,
    };
    return apiClient.patch<
      PaymentGatewaySettingsApiModel,
      UpdatePaymentGatewayGlobalRequest
    >(API_ROUTES.ADMIN.PAYMENT_GATEWAY, payload);
  }

  public async updateUserOverride(
    userId: string,
    mode: PaymentGatewayMode | null
  ): Promise<PaymentGatewayUserApiModel> {
    const payload: UpdatePaymentGatewayUserRequest = {
      scope: "user",
      userId,
      mode,
    };
    return apiClient.patch<
      PaymentGatewayUserApiModel,
      UpdatePaymentGatewayUserRequest
    >(API_ROUTES.ADMIN.PAYMENT_GATEWAY, payload);
  }
}
