import type { KingdomValue } from "@/core/constants/cards-catalog";

export interface StarterPackEntity {
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

export type ShopPaymentMethod = "QRIS" | "VIRTUAL_ACCOUNT";
export type ShopPaymentStatus = "PAID" | "PENDING" | "FAILED" | "EXPIRED";
export type PaymentMode = "DEV" | "PROD";

export interface ShopPaymentChannel {
  code: string;
  name: string;
  paymentMethod: ShopPaymentMethod;
}

export interface ShopPaymentMethodsEntity {
  mode: PaymentMode;
  channels: ShopPaymentChannel[];
}

export interface DrawnCardSummary {
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

export interface PaymentOrderEntity {
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
  drawnCards?: DrawnCardSummary[];
  createdAt: string;
  paidAt: string | null;
  orderType?: "STARTER_PACK" | "TOPUP";
  pointsAwarded?: number;
  feeIdr?: number;
}

export interface ShopCatalogEntity {
  packs: StarterPackEntity[];
  recentOrders: PaymentOrderEntity[];
  hasClaimedStarterPack?: boolean;
  nusaPointBalance?: number;
}

export interface TransactionHistoryQuery {
  page: number;
  pageSize: number;
  search: string;
}

export interface TransactionHistoryPageEntity {
  items: PaymentOrderEntity[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CheckoutPaymentRequest {
  buyerName: string;
  buyerEmail: string;
  starterPackCode: string;
  paymentMethod?: ShopPaymentMethod;
  paymentChannel?: string;
  pointsToUse?: number;
}

export interface TopupTierEntity {
  amountIdr: number;
  feeIdr: number;
  pointsAwarded: number;
}

export interface TopupTiersResponseEntity {
  feeIdr: number;
  tiers: TopupTierEntity[];
}

export interface TopupCheckoutRequest {
  buyerName: string;
  buyerEmail: string;
  amountIdr: number;
  paymentMethod: ShopPaymentMethod;
  paymentChannel: string;
}


