import type {
  DrawnCardSummary,
  PaymentMode,
  PaymentOrderEntity,
  ShopPaymentMethodsEntity,
  ShopPaymentMethod,
  ShopPaymentStatus,
  ShopCatalogEntity,
  TransactionHistoryPageEntity,
  StarterPackEntity,
} from "@/client/domain/shop/entity/shop_entity";
import type { KingdomValue } from "@/core/constants/cards-catalog";

export interface StarterPackApiModel {
  id: string;
  code: string;
  nameId: string;
  nameEn: string;
  nameZh: string;
  descriptionId: string;
  descriptionEn: string;
  descriptionZh: string;
  kingdomTheme: KingdomValue;
  priceIdr: number;
  cardSlugs: string[];
  isFairPlaySafe: boolean;
  imagePath?: string;
  packType?: "STARTER" | "BOOSTER";
  isStarter?: boolean;
  cardCount?: number;
  isFree?: boolean;
}

export interface DrawnCardSummaryApiModel {
  slug: string;
  name: string;
  cardType: "CHARACTER" | "INSTRUMENT";
  kingdom: KingdomValue;
  isHighEnd: boolean;
  imagePath: string;
  baseAttack?: number;
  baseDefense?: number;
  effectName?: string | null;
}

export interface PaymentOrderApiModel {
  id: string;
  orderNumber: string;
  userId: string | null;
  buyerName: string;
  buyerEmail: string;
  starterPackId: string;
  starterPackCode: string;
  starterPackName: string;
  amountIdr: number;
  originalAmountIdr?: number;
  pointsSpent?: number;
  paymentMethod: ShopPaymentMethod | string;
  paymentStatus: ShopPaymentStatus;
  paymentProvider?: string;
  paymentMode?: PaymentMode;
  gatewayReference?: string | null;
  paymentUrl?: string | null;
  paymentInstructions?: Record<string, unknown> | null;
  expiresAt?: string | null;
  drawnCardSlugs?: string[];
  drawnCards?: DrawnCardSummaryApiModel[];
  createdAt: string;
  paidAt: string | null;
  orderType?: "STARTER_PACK" | "TOPUP";
  pointsAwarded?: number;
  feeIdr?: number;
}

export interface ShopCatalogApiModel {
  packs: StarterPackApiModel[];
  recentOrders: PaymentOrderApiModel[];
  hasClaimedStarterPack?: boolean;
  nusaPointBalance?: number;
}

export interface TransactionHistoryPageApiModel {
  items: PaymentOrderApiModel[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ShopPaymentMethodsApiModel extends ShopPaymentMethodsEntity {}

export function mapStarterPackModelToEntity(
  model: StarterPackApiModel
): StarterPackEntity {
  return {
    id: model.id,
    code: model.code,
    nameId: model.nameId,
    nameEn: model.nameEn,
    nameZh: model.nameZh,
    descriptionId: model.descriptionId,
    descriptionEn: model.descriptionEn,
    descriptionZh: model.descriptionZh,
    kingdomTheme: model.kingdomTheme,
    priceIdr: model.priceIdr,
    cardSlugs: [...model.cardSlugs],
    isFairPlaySafe: model.isFairPlaySafe,
    imagePath: model.imagePath,
    packType: model.packType,
    isStarter: model.isStarter,
    cardCount: model.cardCount,
    isFree: model.isFree,
  };
}

export function mapPaymentOrderModelToEntity(
  model: PaymentOrderApiModel
): PaymentOrderEntity {
  const drawnCards: DrawnCardSummary[] | undefined = model.drawnCards?.map(
    (c) => ({
      slug: c.slug,
      name: c.name,
      cardType: c.cardType,
      kingdom: c.kingdom,
      isHighEnd: c.isHighEnd,
      imagePath: c.imagePath,
      baseAttack: c.baseAttack,
      baseDefense: c.baseDefense,
      effectName: c.effectName,
    })
  );

  return {
    id: model.id,
    orderNumber: model.orderNumber,
    userId: model.userId,
    buyerName: model.buyerName,
    buyerEmail: model.buyerEmail,
    starterPackId: model.starterPackId,
    starterPackCode: model.starterPackCode,
    starterPackName: model.starterPackName,
    amountIdr: model.amountIdr,
    originalAmountIdr: model.originalAmountIdr,
    pointsSpent: model.pointsSpent,
    paymentMethod: model.paymentMethod,
    paymentStatus: model.paymentStatus,
    paymentProvider: model.paymentProvider,
    paymentMode: model.paymentMode,
    gatewayReference: model.gatewayReference,
    paymentUrl: model.paymentUrl,
    paymentInstructions: model.paymentInstructions,
    expiresAt: model.expiresAt,
    drawnCardSlugs: model.drawnCardSlugs ? [...model.drawnCardSlugs] : undefined,
    drawnCards,
    createdAt: model.createdAt,
    paidAt: model.paidAt,
    orderType: model.orderType ?? (model.starterPackCode === "TOPUP_NUSA_POINT" ? "TOPUP" : "STARTER_PACK"),
    pointsAwarded: model.pointsAwarded,
    feeIdr: model.feeIdr,
  };
}

export function mapShopCatalogModelToEntity(
  model: ShopCatalogApiModel
): ShopCatalogEntity {
  return {
    packs: model.packs.map(mapStarterPackModelToEntity),
    recentOrders: model.recentOrders.map(mapPaymentOrderModelToEntity),
    hasClaimedStarterPack: model.hasClaimedStarterPack,
    nusaPointBalance: model.nusaPointBalance,
  };
}

export function mapTransactionHistoryModelToEntity(
  model: TransactionHistoryPageApiModel
): TransactionHistoryPageEntity {
  return {
    items: model.items.map(mapPaymentOrderModelToEntity),
    page: model.page,
    pageSize: model.pageSize,
    total: model.total,
    totalPages: model.totalPages,
  };
}
