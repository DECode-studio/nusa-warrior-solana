import { inject, injectable } from "@needle-di/core";
import type {
  CheckoutPaymentRequest,
  PaymentOrderEntity,
  ShopPaymentMethodsEntity,
  ShopCatalogEntity,
  TransactionHistoryPageEntity,
  TransactionHistoryQuery,
  TopupTiersResponseEntity,
  TopupCheckoutRequest,
} from "@/client/domain/shop/entity/shop_entity";
import type { ShopRepository } from "@/client/domain/shop/repository/shop_repository";
import { ShopRemoteDataSource } from "../datasource/shop_remote_datasource";
import {
  mapPaymentOrderModelToEntity,
  mapShopCatalogModelToEntity,
  mapTransactionHistoryModelToEntity,
} from "../model/shop_model";

@injectable()
export class ShopRepositoryImpl implements ShopRepository {
  constructor(
    private readonly remoteDataSource: ShopRemoteDataSource = inject(
      ShopRemoteDataSource
    )
  ) {}

  public async getShopCatalog(): Promise<ShopCatalogEntity> {
    const model = await this.remoteDataSource.getShopCatalog();
    return mapShopCatalogModelToEntity(model);
  }

  public async getPaymentMethods(): Promise<ShopPaymentMethodsEntity> {
    return this.remoteDataSource.getPaymentMethods();
  }

  public async prepareFreeStarterPackMint(): Promise<{
    starterPackCode: string;
    cardSlugs: string[];
    serializedTransactions: string[];
  }> {
    return this.remoteDataSource.prepareFreeStarterPackMint();
  }

  public async claimFreeStarterPack(
    txSignatures?: string[]
  ): Promise<PaymentOrderEntity> {
    const model = await this.remoteDataSource.claimFreeStarterPack(txSignatures);
    return mapPaymentOrderModelToEntity(model);
  }

  public async getOrder(orderId: string): Promise<PaymentOrderEntity> {
    const model = await this.remoteDataSource.getOrder(orderId);
    return mapPaymentOrderModelToEntity(model);
  }

  public async getTransactionHistory(query: TransactionHistoryQuery): Promise<TransactionHistoryPageEntity> {
    const model = await this.remoteDataSource.getTransactionHistory(query);
    return mapTransactionHistoryModelToEntity(model);
  }

  public async checkout(
    request: CheckoutPaymentRequest
  ): Promise<PaymentOrderEntity> {
    const model = await this.remoteDataSource.checkout(request);
    return mapPaymentOrderModelToEntity(model);
  }

  public async getTopupTiers(): Promise<TopupTiersResponseEntity> {
    return this.remoteDataSource.getTopupTiers();
  }

  public async checkoutTopup(
    request: TopupCheckoutRequest
  ): Promise<PaymentOrderEntity> {
    const model = await this.remoteDataSource.checkoutTopup(request);
    return mapPaymentOrderModelToEntity(model);
  }
}
