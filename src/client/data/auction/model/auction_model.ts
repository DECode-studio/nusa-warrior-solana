import type {
  AuctionBidEntity,
  AuctionBidStatusValue,
  AuctionCardEntity,
  AuctionDetailEntity,
  AuctionListEntity,
  AuctionListingEntity,
  AuctionPaginationEntity,
  AuctionStatusValue,
  AuctionTokenStandard,
  FrozenAuctionItemEntity,
  PreparedBidEntity,
  PreparedCreateAuctionEntity,
  PreparedFinalizeEntity,
  PreparedManageAuctionEntity,
  SellableCardOptionEntity,
} from "@/client/domain/auction/entity/auction_entity";

export interface AuctionCardApiModel {
  id: string;
  slug: string;
  name: string;
  cardType: "CHARACTER" | "INSTRUMENT";
  kingdom: string;
  role: string;
  baseAttack: number;
  baseDefense: number;
  imagePath: string;
  isCustom: boolean;
  isRareEdition: boolean;
  tokenStandard: AuctionTokenStandard;
}

export interface AuctionBidApiModel {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  bidderWallet: string;
  amount: number;
  deltaAmount: number;
  status: AuctionBidStatusValue;
  txSignature: string;
  refundTxSignature: string | null;
  createdAt: string;
}

export interface AuctionListingApiModel {
  id: string;
  auctionPda: string;
  sellerId: string;
  sellerName: string;
  sellerWallet: string;
  card: AuctionCardApiModel;
  cardMintOrAsset: string;
  tokenStandard: AuctionTokenStandard;
  startingPrice: number;
  currentHighestBid: number;
  minNextBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  highestBidderWallet: string | null;
  bidIncrement: number;
  feeBps: number;
  feeAmount: number;
  sellerPayout: number;
  bidCount: number;
  durationHours: number;
  status: AuctionStatusValue;
  startsAt: string;
  originalEndsAt: string;
  endsAt: string;
  extendedSecs: number;
  createTxSignature: string;
  cancelTxSignature: string | null;
  settleTxSignature: string | null;
  settledAt: string | null;
  myHeldAmount: number;
  myRefundPending: boolean;
  canEdit: boolean;
  canCancel: boolean;
  canBid: boolean;
  canSettle: boolean;
  createdAt: string;
}

export interface AuctionDetailApiModel extends AuctionListingApiModel {
  bids: AuctionBidApiModel[];
}

export interface FrozenAuctionItemApiModel {
  auctionId: string;
  cardName: string;
  cardImagePath: string;
  heldAmount: number;
  isHighestBidder: boolean;
  status: AuctionStatusValue;
  endsAt: string;
  refundPending: boolean;
}

export interface SellableCardOptionApiModel {
  card: AuctionCardApiModel;
  walletQuantity: number;
  inDeckQuantity: number;
  availableForAuction: number;
  mintOrAssetAddress: string;
  collectionAddress: string;
  blockedReason: string | null;
}

export interface AuctionPaginationApiModel {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AuctionListApiModel {
  auctions: AuctionListingApiModel[];
  pagination: AuctionPaginationApiModel;
  walletAddress: string | null;
  walletNusaBalance: number;
  frozenNusaTotal: number;
  frozenAuctions: FrozenAuctionItemApiModel[];
  activeSellingCount: number;
  maxActiveListings: number;
  sellableCards: SellableCardOptionApiModel[];
}

export interface PreparedCreateAuctionApiModel {
  auctionId: string;
  auctionPda: string;
  cardId: string;
  cardMintOrAsset: string;
  tokenStandard: AuctionTokenStandard;
  collectionAddress: string;
  startingPrice: number;
  durationHours: number;
  serializedTransaction: string;
  recentBlockhash: string;
}

export interface PreparedManageAuctionApiModel {
  auctionId: string;
  serializedTransaction: string;
  recentBlockhash: string;
  startingPrice?: number;
  durationHours?: number;
}

export interface PreparedBidApiModel {
  auctionId: string;
  amount: number;
  deltaAmount: number;
  alreadyHeld: number;
  bidEscrowPda: string;
  serializedTransaction: string;
  recentBlockhash: string;
}

export interface PreparedFinalizeApiModel {
  auctionId: string;
  serializedTransaction: string;
  recentBlockhash: string;
  refundAmount?: number;
}

export function mapAuctionCardToEntity(
  raw: AuctionCardApiModel
): AuctionCardEntity {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    cardType: raw.cardType,
    kingdom: raw.kingdom,
    role: raw.role,
    baseAttack: raw.baseAttack,
    baseDefense: raw.baseDefense,
    imagePath: raw.imagePath,
    isCustom: raw.isCustom,
    isRareEdition: raw.isRareEdition,
    tokenStandard: raw.tokenStandard,
  };
}

export function mapAuctionBidToEntity(
  raw: AuctionBidApiModel
): AuctionBidEntity {
  return {
    id: raw.id,
    auctionId: raw.auctionId,
    bidderId: raw.bidderId,
    bidderName: raw.bidderName,
    bidderWallet: raw.bidderWallet,
    amount: raw.amount,
    deltaAmount: raw.deltaAmount,
    status: raw.status,
    txSignature: raw.txSignature,
    refundTxSignature: raw.refundTxSignature,
    createdAt: raw.createdAt,
  };
}

export function mapAuctionListingToEntity(
  raw: AuctionListingApiModel
): AuctionListingEntity {
  return {
    id: raw.id,
    auctionPda: raw.auctionPda,
    sellerId: raw.sellerId,
    sellerName: raw.sellerName,
    sellerWallet: raw.sellerWallet,
    card: mapAuctionCardToEntity(raw.card),
    cardMintOrAsset: raw.cardMintOrAsset,
    tokenStandard: raw.tokenStandard,
    startingPrice: raw.startingPrice,
    currentHighestBid: raw.currentHighestBid,
    minNextBid: raw.minNextBid,
    highestBidderId: raw.highestBidderId,
    highestBidderName: raw.highestBidderName,
    highestBidderWallet: raw.highestBidderWallet,
    bidIncrement: raw.bidIncrement,
    feeBps: raw.feeBps,
    feeAmount: raw.feeAmount,
    sellerPayout: raw.sellerPayout,
    bidCount: raw.bidCount,
    durationHours: raw.durationHours,
    status: raw.status,
    startsAt: raw.startsAt,
    originalEndsAt: raw.originalEndsAt,
    endsAt: raw.endsAt,
    extendedSecs: raw.extendedSecs,
    createTxSignature: raw.createTxSignature,
    cancelTxSignature: raw.cancelTxSignature,
    settleTxSignature: raw.settleTxSignature,
    settledAt: raw.settledAt,
    myHeldAmount: raw.myHeldAmount,
    myRefundPending: raw.myRefundPending,
    canEdit: raw.canEdit,
    canCancel: raw.canCancel,
    canBid: raw.canBid,
    canSettle: raw.canSettle,
    createdAt: raw.createdAt,
  };
}

export function mapAuctionDetailToEntity(
  raw: AuctionDetailApiModel
): AuctionDetailEntity {
  const listing = mapAuctionListingToEntity(raw);
  return {
    id: listing.id,
    auctionPda: listing.auctionPda,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    sellerWallet: listing.sellerWallet,
    card: listing.card,
    cardMintOrAsset: listing.cardMintOrAsset,
    tokenStandard: listing.tokenStandard,
    startingPrice: listing.startingPrice,
    currentHighestBid: listing.currentHighestBid,
    minNextBid: listing.minNextBid,
    highestBidderId: listing.highestBidderId,
    highestBidderName: listing.highestBidderName,
    highestBidderWallet: listing.highestBidderWallet,
    bidIncrement: listing.bidIncrement,
    feeBps: listing.feeBps,
    feeAmount: listing.feeAmount,
    sellerPayout: listing.sellerPayout,
    bidCount: listing.bidCount,
    durationHours: listing.durationHours,
    status: listing.status,
    startsAt: listing.startsAt,
    originalEndsAt: listing.originalEndsAt,
    endsAt: listing.endsAt,
    extendedSecs: listing.extendedSecs,
    createTxSignature: listing.createTxSignature,
    cancelTxSignature: listing.cancelTxSignature,
    settleTxSignature: listing.settleTxSignature,
    settledAt: listing.settledAt,
    myHeldAmount: listing.myHeldAmount,
    myRefundPending: listing.myRefundPending,
    canEdit: listing.canEdit,
    canCancel: listing.canCancel,
    canBid: listing.canBid,
    canSettle: listing.canSettle,
    createdAt: listing.createdAt,
    bids: raw.bids.map(mapAuctionBidToEntity),
  };
}

export function mapFrozenAuctionItemToEntity(
  raw: FrozenAuctionItemApiModel
): FrozenAuctionItemEntity {
  return {
    auctionId: raw.auctionId,
    cardName: raw.cardName,
    cardImagePath: raw.cardImagePath,
    heldAmount: raw.heldAmount,
    isHighestBidder: raw.isHighestBidder,
    status: raw.status,
    endsAt: raw.endsAt,
    refundPending: raw.refundPending,
  };
}

export function mapSellableCardOptionToEntity(
  raw: SellableCardOptionApiModel
): SellableCardOptionEntity {
  return {
    card: mapAuctionCardToEntity(raw.card),
    walletQuantity: raw.walletQuantity,
    inDeckQuantity: raw.inDeckQuantity,
    availableForAuction: raw.availableForAuction,
    mintOrAssetAddress: raw.mintOrAssetAddress,
    collectionAddress: raw.collectionAddress,
    blockedReason: raw.blockedReason,
  };
}

export function mapAuctionPaginationToEntity(
  raw: AuctionPaginationApiModel
): AuctionPaginationEntity {
  return {
    page: raw.page,
    pageSize: raw.pageSize,
    totalItems: raw.totalItems,
    totalPages: raw.totalPages,
  };
}

export function mapAuctionListToEntity(
  raw: AuctionListApiModel
): AuctionListEntity {
  return {
    auctions: raw.auctions.map(mapAuctionListingToEntity),
    pagination: mapAuctionPaginationToEntity(raw.pagination),
    walletAddress: raw.walletAddress,
    walletNusaBalance: raw.walletNusaBalance,
    frozenNusaTotal: raw.frozenNusaTotal,
    frozenAuctions: raw.frozenAuctions.map(mapFrozenAuctionItemToEntity),
    activeSellingCount: raw.activeSellingCount,
    maxActiveListings: raw.maxActiveListings,
    sellableCards: raw.sellableCards.map(mapSellableCardOptionToEntity),
  };
}

export function mapPreparedCreateAuctionToEntity(
  raw: PreparedCreateAuctionApiModel
): PreparedCreateAuctionEntity {
  return {
    auctionId: raw.auctionId,
    auctionPda: raw.auctionPda,
    cardId: raw.cardId,
    cardMintOrAsset: raw.cardMintOrAsset,
    tokenStandard: raw.tokenStandard,
    collectionAddress: raw.collectionAddress,
    startingPrice: raw.startingPrice,
    durationHours: raw.durationHours,
    serializedTransaction: raw.serializedTransaction,
    recentBlockhash: raw.recentBlockhash,
  };
}

export function mapPreparedManageAuctionToEntity(
  raw: PreparedManageAuctionApiModel
): PreparedManageAuctionEntity {
  return {
    auctionId: raw.auctionId,
    serializedTransaction: raw.serializedTransaction,
    recentBlockhash: raw.recentBlockhash,
    startingPrice: raw.startingPrice,
    durationHours: raw.durationHours,
  };
}

export function mapPreparedBidToEntity(
  raw: PreparedBidApiModel
): PreparedBidEntity {
  return {
    auctionId: raw.auctionId,
    amount: raw.amount,
    deltaAmount: raw.deltaAmount,
    alreadyHeld: raw.alreadyHeld,
    bidEscrowPda: raw.bidEscrowPda,
    serializedTransaction: raw.serializedTransaction,
    recentBlockhash: raw.recentBlockhash,
  };
}

export function mapPreparedFinalizeToEntity(
  raw: PreparedFinalizeApiModel
): PreparedFinalizeEntity {
  return {
    auctionId: raw.auctionId,
    serializedTransaction: raw.serializedTransaction,
    recentBlockhash: raw.recentBlockhash,
    refundAmount: raw.refundAmount,
  };
}
