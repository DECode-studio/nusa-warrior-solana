export type AuctionTab = "explore" | "selling" | "bidding" | "history";
export type AuctionSort =
  | "ending_soon"
  | "price_asc"
  | "price_desc"
  | "most_bids"
  | "newest";
export type AuctionStatusValue =
  | "ACTIVE"
  | "SETTLED"
  | "EXPIRED"
  | "CANCELLED";
export type AuctionBidStatusValue = "HELD" | "WON" | "REFUNDED";
export type AuctionTokenStandard = "TOKEN_2022" | "MPL_CORE";

export interface AuctionCardEntity {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly cardType: "CHARACTER" | "INSTRUMENT";
  readonly kingdom: string;
  readonly role: string;
  readonly baseAttack: number;
  readonly baseDefense: number;
  readonly imagePath: string;
  readonly isCustom: boolean;
  readonly isRareEdition: boolean;
  readonly tokenStandard: AuctionTokenStandard;
}

export interface AuctionBidEntity {
  readonly id: string;
  readonly auctionId: string;
  readonly bidderId: string;
  readonly bidderName: string;
  readonly bidderWallet: string;
  readonly amount: number;
  readonly deltaAmount: number;
  readonly status: AuctionBidStatusValue;
  readonly txSignature: string;
  readonly refundTxSignature: string | null;
  readonly createdAt: string;
}

export interface AuctionListingEntity {
  readonly id: string;
  readonly auctionPda: string;
  readonly sellerId: string;
  readonly sellerName: string;
  readonly sellerWallet: string;
  readonly card: AuctionCardEntity;
  readonly cardMintOrAsset: string;
  readonly tokenStandard: AuctionTokenStandard;
  readonly startingPrice: number;
  readonly currentHighestBid: number;
  readonly minNextBid: number;
  readonly highestBidderId: string | null;
  readonly highestBidderName: string | null;
  readonly highestBidderWallet: string | null;
  readonly bidIncrement: number;
  readonly feeBps: number;
  readonly feeAmount: number;
  readonly sellerPayout: number;
  readonly bidCount: number;
  readonly durationHours: number;
  readonly status: AuctionStatusValue;
  readonly startsAt: string;
  readonly originalEndsAt: string;
  readonly endsAt: string;
  readonly extendedSecs: number;
  readonly createTxSignature: string;
  readonly cancelTxSignature: string | null;
  readonly settleTxSignature: string | null;
  readonly settledAt: string | null;
  readonly myHeldAmount: number;
  readonly myRefundPending: boolean;
  readonly canEdit: boolean;
  readonly canCancel: boolean;
  readonly canBid: boolean;
  readonly canSettle: boolean;
  readonly createdAt: string;
}

export interface AuctionDetailEntity extends AuctionListingEntity {
  readonly bids: AuctionBidEntity[];
}

export interface FrozenAuctionItemEntity {
  readonly auctionId: string;
  readonly cardName: string;
  readonly cardImagePath: string;
  readonly heldAmount: number;
  readonly isHighestBidder: boolean;
  readonly status: AuctionStatusValue;
  readonly endsAt: string;
  readonly refundPending: boolean;
}

export interface SellableCardOptionEntity {
  readonly card: AuctionCardEntity;
  readonly walletQuantity: number;
  readonly inDeckQuantity: number;
  readonly availableForAuction: number;
  readonly mintOrAssetAddress: string;
  readonly collectionAddress: string;
  readonly blockedReason: string | null;
}

export interface AuctionPaginationEntity {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface AuctionListEntity {
  readonly auctions: AuctionListingEntity[];
  readonly pagination: AuctionPaginationEntity;
  readonly walletAddress: string | null;
  readonly walletNusaBalance: number;
  readonly frozenNusaTotal: number;
  readonly frozenAuctions: FrozenAuctionItemEntity[];
  readonly activeSellingCount: number;
  readonly maxActiveListings: number;
  readonly sellableCards: SellableCardOptionEntity[];
}

export interface PreparedCreateAuctionEntity {
  readonly auctionId: string;
  readonly auctionPda: string;
  readonly cardId: string;
  readonly cardMintOrAsset: string;
  readonly tokenStandard: AuctionTokenStandard;
  readonly collectionAddress: string;
  readonly startingPrice: number;
  readonly durationHours: number;
  readonly serializedTransaction: string;
  readonly recentBlockhash: string;
}

export interface PreparedManageAuctionEntity {
  readonly auctionId: string;
  readonly serializedTransaction: string;
  readonly recentBlockhash: string;
  readonly startingPrice?: number;
  readonly durationHours?: number;
}

export interface PreparedBidEntity {
  readonly auctionId: string;
  readonly amount: number;
  readonly deltaAmount: number;
  readonly alreadyHeld: number;
  readonly bidEscrowPda: string;
  readonly serializedTransaction: string;
  readonly recentBlockhash: string;
}

export interface PreparedFinalizeEntity {
  readonly auctionId: string;
  readonly serializedTransaction: string;
  readonly recentBlockhash: string;
  readonly refundAmount?: number;
}
