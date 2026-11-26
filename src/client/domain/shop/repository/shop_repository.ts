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
  prepareFreeStarterPackMint(): Promise<{
    starterPackCode: string;
    cardSlugs: string[];
    serializedTransactions: string[];
  }>;
  claimFreeStarterPack(txSignatures?: string[]): Promise<PaymentOrderEntity>;
  checkout(request: CheckoutPaymentRequest): Promise<PaymentOrderEntity>;
  prepareNusaBurnCheckout(starterPackCode: string): Promise<{
    serializedTransaction: string;
    amountNusa: number;
  }>;
  confirmNusaBurnCheckout(input: {
    starterPackCode: string;
    txSignature: string;
    buyerName?: string;
    buyerEmail?: string;
  }): Promise<PaymentOrderEntity>;
  getTopupTiers(): Promise<TopupTiersResponseEntity>;
  checkoutTopup(request: TopupCheckoutRequest): Promise<PaymentOrderEntity>;
}
