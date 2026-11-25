import { injectable } from "@needle-di/core";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  CustomCardPricingApiModel,
  CreateCustomCardResponseApiModel,
} from "../model/custom_card_model";
import type { CardApiModel } from "@/client/data/card/model/card_model";

@injectable()
export class CustomCardRemoteDataSource {
  public async getPricing(): Promise<CustomCardPricingApiModel> {
    return apiClient.get<CustomCardPricingApiModel>(
      API_ROUTES.CUSTOM_CARDS.pricing
    );
  }

  public async createCustomCard(
    formData: FormData
  ): Promise<CreateCustomCardResponseApiModel> {
    return apiClient.postFormData<CreateCustomCardResponseApiModel>(
      API_ROUTES.CUSTOM_CARDS.cards,
      formData
    );
  }

  public async listUserCustomCards(): Promise<CardApiModel[]> {
    return apiClient.get<CardApiModel[]>(API_ROUTES.CUSTOM_CARDS.cards);
  }
}

