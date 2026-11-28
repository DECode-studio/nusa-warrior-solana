import type {
  AuctionBidStatus,
  AuctionStatus,
  CardTokenStandard,
  CardType,
  CharacterRole,
  Kingdom,
} from "@prisma/client";

export const AUCTION_POLICY = {
  minStartingPriceNusa: 50,
  minBidIncrementNusa: 50,
  minDurationHours: 1,
  maxDurationHours: 24,
  feeBps: 1000,
  feePercent: 10,
  maxActiveListingsPerUser: 5,
  defaultPageSize: 10,
  maxPageSize: 10,
  antiSnipeWindowSecs: 300,
  antiSnipeExtensionSecs: 300,
  antiSnipeMaxExtensionSecs: 1800,
} as const;

export function calculateAuctionFeeSplit(
  winningBidNusa: number,
  feeBps: number = AUCTION_POLICY.feeBps
): { feeAmount: number; sellerPayout: number } {
  const feeAmount = Math.floor((winningBidNusa * feeBps) / 10_000);
  const sellerPayout = Math.max(0, winningBidNusa - feeAmount);
  return { feeAmount, sellerPayout };
}

export function computeMinNextBid(
  startingPrice: number,
  currentHighestBid: number,
  bidCount: number,
  increment: number = AUCTION_POLICY.minBidIncrementNusa
): number {
  return bidCount === 0
    ? startingPrice + increment
    : currentHighestBid + increment;
}

export function computeAntiSnipeExtension(input: {
  nowMs: number;
  endsAtMs: number;
  extendedSecs: number;
}): { nextEndsAtMs: number; nextExtendedSecs: number; wasExtended: boolean } {
  const remainingSecs = Math.max(
    0,
    Math.floor((input.endsAtMs - input.nowMs) / 1000)
  );
  if (
    remainingSecs <= AUCTION_POLICY.antiSnipeWindowSecs &&
    input.extendedSecs < AUCTION_POLICY.antiSnipeMaxExtensionSecs
  ) {
    const allowedExtra =
      AUCTION_POLICY.antiSnipeMaxExtensionSecs - input.extendedSecs;
    const extension = Math.min(
      AUCTION_POLICY.antiSnipeExtensionSecs,
      allowedExtra
    );
    return {
      nextEndsAtMs: input.endsAtMs + extension * 1000,
      nextExtendedSecs: input.extendedSecs + extension,
      wasExtended: true,
    };
  }
  return {
    nextEndsAtMs: input.endsAtMs,
    nextExtendedSecs: input.extendedSecs,
    wasExtended: false,
  };
}

export interface AuctionCardSummaryDto {
  id: string;
  slug: string;
  name: string;
  cardType: CardType;
  kingdom: Kingdom;
  role: CharacterRole;
  baseAttack: number;
  baseDefense: number;
  imagePath: string;
  isCustom: boolean;
  isRareEdition: boolean;
  tokenStandard: CardTokenStandard;
}

export interface AuctionBidDto {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  bidderWallet: string;
  amount: number;
  deltaAmount: number;
  status: AuctionBidStatus;
  txSignature: string;
  refundTxSignature: string | null;
  createdAt: string;
}

export interface AuctionListingDto {
  id: string;
  auctionPda: string;
  sellerId: string;
  sellerName: string;
  sellerWallet: string;
  card: AuctionCardSummaryDto;
  cardMintOrAsset: string;
  tokenStandard: CardTokenStandard;
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
  status: AuctionStatus;
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

export interface AuctionDetailDto extends AuctionListingDto {
  bids: AuctionBidDto[];
}

export interface FrozenAuctionItemDto {
  auctionId: string;
  cardName: string;
  cardImagePath: string;
  heldAmount: number;
  isHighestBidder: boolean;
  status: AuctionStatus;
  endsAt: string;
  refundPending: boolean;
}

export interface SellableCardOptionDto {
  card: AuctionCardSummaryDto;
  walletQuantity: number;
  inDeckQuantity: number;
  availableForAuction: number;
  mintOrAssetAddress: string;
  collectionAddress: string;
  blockedReason: string | null;
}

export interface AuctionPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AuctionListResponseDto {
  auctions: AuctionListingDto[];
  pagination: AuctionPaginationDto;
  walletAddress: string | null;
  walletNusaBalance: number;
  frozenNusaTotal: number;
  frozenAuctions: FrozenAuctionItemDto[];
  activeSellingCount: number;
  maxActiveListings: number;
  sellableCards: SellableCardOptionDto[];
}
