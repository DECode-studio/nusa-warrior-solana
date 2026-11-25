import type {
  CheckoutPaymentRequest,
  PaymentOrderEntity,
  ShopPaymentMethodsEntity,
  ShopCatalogEntity,
  TransactionHistoryPageEntity,
  TransactionHistoryQuery,
  TopupTiersResponseEntity,
  TopupCheckoutRequest,
} from "../entity/shop_entity";

export interface ShopRepository {
  getShopCatalog(): Promise<ShopCatalogEntity>;
  getPaymentMethods(): Promise<ShopPaymentMethodsEntity>;
  getOrder(orderId: string): Promise<PaymentOrderEntity>;
  getTransactionHistory(query: TransactionHistoryQuery): Promise<TransactionHistoryPageEntity>;
  claimFreeStarterPack(): Promise<PaymentOrderEntity>;
  checkout(request: CheckoutPaymentRequest): Promise<PaymentOrderEntity>;
  getTopupTiers(): Promise<TopupTiersResponseEntity>;
  checkoutTopup(request: TopupCheckoutRequest): Promise<PaymentOrderEntity>;
}
