import { injectable } from "@needle-di/core";
import type { CheckoutPaymentRequest } from "@/client/domain/shop/entity/shop_entity";
import type { TransactionHistoryQuery } from "@/client/domain/shop/entity/shop_entity";
import type { ShopPaymentMethodsEntity } from "@/client/domain/shop/entity/shop_entity";
import type {
  TopupCheckoutRequest,
  TopupTiersResponseEntity,
} from "@/client/domain/shop/entity/shop_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  PaymentOrderApiModel,
  ShopCatalogApiModel,
  TransactionHistoryPageApiModel,
} from "../model/shop_model";

@injectable()
export class ShopRemoteDataSource {
  public async getShopCatalog(): Promise<ShopCatalogApiModel> {
    return apiClient.get<ShopCatalogApiModel>(API_ROUTES.SHOP.DECKS);
  }

  public async getPaymentMethods(): Promise<ShopPaymentMethodsEntity> {
    return apiClient.get<ShopPaymentMethodsEntity>(API_ROUTES.SHOP.PAYMENT_METHODS);
  }

  public async prepareFreeStarterPackMint(): Promise<{
    starterPackCode: string;
    cardSlugs: string[];
    serializedTransactions: string[];
  }> {
    return apiClient.post<
      {
        starterPackCode: string;
        cardSlugs: string[];
        serializedTransactions: string[];
      },
      Record<string, never>
    >("/api/v1/shop/claim-starter/prepare", {});
  }

  public async claimFreeStarterPack(
    txSignatures?: string[]
  ): Promise<PaymentOrderApiModel> {
    return apiClient.post<PaymentOrderApiModel, { txSignatures?: string[] }>(
      API_ROUTES.SHOP.CLAIM_STARTER,
      txSignatures?.length ? { txSignatures } : {}
    );
  }

  public async checkout(
    request: CheckoutPaymentRequest
  ): Promise<PaymentOrderApiModel> {
    return apiClient.post<PaymentOrderApiModel, CheckoutPaymentRequest>(
      API_ROUTES.SHOP.CHECKOUT,
      request
    );
  }

  public async prepareNusaBurnCheckout(starterPackCode: string): Promise<{
    serializedTransaction: string;
    amountNusa: number;
  }> {
    return apiClient.post<
      { serializedTransaction: string; amountNusa: number },
      { starterPackCode: string }
    >(API_ROUTES.SHOP.CHECKOUT_PREPARE, { starterPackCode });
  }

  public async confirmNusaBurnCheckout(input: {
    starterPackCode: string;
    txSignature: string;
    buyerName?: string;
    buyerEmail?: string;
  }): Promise<PaymentOrderApiModel> {
    return apiClient.post<PaymentOrderApiModel, typeof input>(
      API_ROUTES.SHOP.CHECKOUT,
      input
    );
  }

  public async getOrder(orderId: string): Promise<PaymentOrderApiModel> {
    return apiClient.get<PaymentOrderApiModel>(API_ROUTES.SHOP.ORDER(orderId));
  }

  public async getTransactionHistory(query: TransactionHistoryQuery): Promise<TransactionHistoryPageApiModel> {
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      search: query.search,
    });
    return apiClient.get<TransactionHistoryPageApiModel>(`${API_ROUTES.SHOP.TRANSACTIONS}?${params.toString()}`);
  }

  public async getTopupTiers(): Promise<TopupTiersResponseEntity> {
    return apiClient.get<TopupTiersResponseEntity>(API_ROUTES.SHOP.TOPUP_TIERS);
  }

  public async checkoutTopup(
    request: TopupCheckoutRequest
  ): Promise<PaymentOrderApiModel> {
    return apiClient.post<PaymentOrderApiModel, TopupCheckoutRequest>(
      API_ROUTES.SHOP.TOPUP_CHECKOUT,
      request
    );
  }
}
