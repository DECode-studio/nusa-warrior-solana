import { inject, injectable } from "@needle-di/core";
import { SHOP_REPOSITORY_TOKEN } from "@/core/di/tokens";
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
import type { ShopRepository } from "../repository/shop_repository";

@injectable()
export class ShopUseCase {
  constructor(
    private readonly shopRepository: ShopRepository = inject(
      SHOP_REPOSITORY_TOKEN
    )
  ) {}

  public async getShopCatalog(): Promise<ShopCatalogEntity> {
    return this.shopRepository.getShopCatalog();
  }

  public async getPaymentMethods(): Promise<ShopPaymentMethodsEntity> {
    return this.shopRepository.getPaymentMethods();
  }

  public async getOrder(orderId: string): Promise<PaymentOrderEntity> {
    return this.shopRepository.getOrder(orderId);
  }

  public async getTransactionHistory(query: TransactionHistoryQuery): Promise<TransactionHistoryPageEntity> {
    return this.shopRepository.getTransactionHistory(query);
  }

  public async prepareFreeStarterPackMint(): Promise<{
    starterPackCode: string;
    cardSlugs: string[];
    serializedTransactions: string[];
  }> {
    return this.shopRepository.prepareFreeStarterPackMint();
  }

  public async claimFreeStarterPack(
    txSignatures?: string[]
  ): Promise<PaymentOrderEntity> {
    return this.shopRepository.claimFreeStarterPack(txSignatures);
  }

  public async checkout(
    request: CheckoutPaymentRequest
  ): Promise<PaymentOrderEntity> {
    return this.shopRepository.checkout(request);
  }

  public async prepareNusaBurnCheckout(starterPackCode: string): Promise<{
    serializedTransaction: string;
    amountNusa: number;
  }> {
    return this.shopRepository.prepareNusaBurnCheckout(starterPackCode);
  }

  public async confirmNusaBurnCheckout(input: {
    starterPackCode: string;
    txSignature: string;
    buyerName?: string;
    buyerEmail?: string;
  }): Promise<PaymentOrderEntity> {
    return this.shopRepository.confirmNusaBurnCheckout(input);
  }

  public async getTopupTiers(): Promise<TopupTiersResponseEntity> {
    return this.shopRepository.getTopupTiers();
  }

  public async checkoutTopup(
    request: TopupCheckoutRequest
  ): Promise<PaymentOrderEntity> {
    return this.shopRepository.checkoutTopup(request);
  }
}
