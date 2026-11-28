import "server-only";
import { randomUUID } from "node:crypto";
import type { CardType, CharacterRole, Kingdom } from "@prisma/client";
import { AppError } from "@/server/shared/errors/app-error";
import { prisma } from "@/server/shared/db/prisma";
import { listOwnedCards } from "@/server/modules/collection/infrastructure/collection.repository";
import { getWalletTokenBalances } from "@/server/modules/solana/nusa-token.service";
import {
  buildCancelAuctionTransaction,
  buildCreateAuctionTransaction,
  buildPlaceBidTransaction,
  buildUpdateAuctionTransaction,
  buildUserRefundBidTransaction,
  buildUserSettleAuctionTransaction,
  refundLosingBidOnChainBySettler,
  settleAuctionOnChainBySettler,
  verifyAuctionProgramTransaction,
} from "@/server/modules/solana/nusa-auction.service";
import { deriveAuctionPda } from "@/server/modules/solana/solana-config";
import { AUCTION_MESSAGE_KEYS } from "../domain/auction.messages";
import {
  AUCTION_POLICY,
  calculateAuctionFeeSplit,
  computeAntiSnipeExtension,
  computeMinNextBid,
  type AuctionDetailDto,
  type AuctionListResponseDto,
  type AuctionListingDto,
  type FrozenAuctionItemDto,
  type SellableCardOptionDto,
} from "../domain/auction.types";
import {
  countActiveAuctionsBySeller,
  createAuctionRecord,
  findAuctionById,
  findAuctions,
  findExpiredActiveAuctions,
  getUserCardDeckUsageMap,
  getUserHeldBidsOnActiveAuctions,
  markAuctionCancelled,
  markAuctionSettled,
  markBidderRefunded,
  recordBidTransaction,
  updateAuctionRecord,
  type AuctionWithRelations,
} from "../infrastructure/auction.repository";

async function resolvePlayerWallet(
  userId: string,
  sessionWallet?: string | null
): Promise<string> {
  if (sessionWallet) return sessionWallet;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true },
  });
  if (!user?.walletAddress) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.WALLET_REQUIRED);
  }
  return user.walletAddress;
}

function getUserHeldAmountOnAuction(
  auction: AuctionWithRelations,
  userId: string
): number {
  let maxHeld = 0;
  for (const bid of auction.bids) {
    if (bid.bidderId === userId && bid.status === "HELD" && bid.amount > maxHeld) {
      maxHeld = bid.amount;
    }
  }
  return maxHeld;
}

function toListingDto(
  auction: AuctionWithRelations,
  viewerUserId: string,
  nowMs: number = Date.now()
): AuctionListingDto {
  const isSeller = auction.sellerId === viewerUserId;
  const isEnded = nowMs >= auction.endsAt.getTime();
  const isActive = auction.status === "ACTIVE";
  const myHeldAmount = getUserHeldAmountOnAuction(auction, viewerUserId);
  const myRefundPending =
    myHeldAmount > 0 &&
    auction.highestBidderId !== viewerUserId &&
    (isEnded || auction.status !== "ACTIVE");

  return {
    id: auction.id,
    auctionPda: auction.auctionPda,
    sellerId: auction.sellerId,
    sellerName: auction.seller.name,
    sellerWallet: auction.sellerWallet,
    card: {
      id: auction.card.id,
      slug: auction.card.slug,
      name: auction.card.name,
      cardType: auction.card.cardType,
      kingdom: auction.card.kingdom,
      role: auction.card.role,
      baseAttack: auction.card.baseAttack,
      baseDefense: auction.card.baseDefense,
      imagePath: auction.card.imagePath,
      isCustom: auction.card.isCustom,
      isRareEdition: auction.card.isRareEdition,
      tokenStandard: auction.card.tokenStandard,
    },
    cardMintOrAsset: auction.cardMintOrAsset,
    tokenStandard: auction.tokenStandard,
    startingPrice: auction.startingPrice,
    currentHighestBid: auction.currentHighestBid,
    minNextBid: computeMinNextBid(
      auction.startingPrice,
      auction.currentHighestBid,
      auction.bidCount,
      auction.bidIncrement
    ),
    highestBidderId: auction.highestBidderId,
    highestBidderName: auction.highestBidder?.name ?? null,
    highestBidderWallet: auction.highestBidderWallet,
    bidIncrement: auction.bidIncrement,
    feeBps: auction.feeBps,
    feeAmount: auction.feeAmount,
    sellerPayout: auction.sellerPayout,
    bidCount: auction.bidCount,
    durationMinutes: auction.durationMinutes,
    status: auction.status,
    startsAt: auction.startsAt.toISOString(),
    originalEndsAt: auction.originalEndsAt.toISOString(),
    endsAt: auction.endsAt.toISOString(),
    extendedSecs: auction.extendedSecs,
    createTxSignature: auction.createTxSignature,
    cancelTxSignature: auction.cancelTxSignature,
    settleTxSignature: auction.settleTxSignature,
    settledAt: auction.settledAt?.toISOString() ?? null,
    myHeldAmount,
    myRefundPending,
    canEdit: isSeller && isActive && !isEnded && auction.bidCount === 0,
    canCancel: isSeller && isActive && !isEnded && auction.bidCount === 0,
    canBid:
      !isSeller &&
      isActive &&
      !isEnded &&
      auction.highestBidderId !== viewerUserId,
    canSettle: isActive && isEnded,
    createdAt: auction.createdAt.toISOString(),
  };
}

function toDetailDto(
  auction: AuctionWithRelations,
  viewerUserId: string
): AuctionDetailDto {
  const base = toListingDto(auction, viewerUserId);
  return {
    ...base,
    bids: auction.bids.map((bid) => ({
      id: bid.id,
      auctionId: bid.auctionId,
      bidderId: bid.bidderId,
      bidderName: bid.bidder.name,
      bidderWallet: bid.bidderWallet,
      amount: bid.amount,
      deltaAmount: bid.deltaAmount,
      status: bid.status,
      txSignature: bid.txSignature,
      refundTxSignature: bid.refundTxSignature,
      createdAt: bid.createdAt.toISOString(),
    })),
  };
}

async function tryAutoSettleAuction(
  auction: AuctionWithRelations
): Promise<AuctionWithRelations> {
  if (auction.status !== "ACTIVE" || Date.now() < auction.endsAt.getTime()) {
    return auction;
  }

  const hasWinner = auction.bidCount > 0 && Boolean(auction.highestBidderWallet);
  const recipientWallet = hasWinner
    ? auction.highestBidderWallet!
    : auction.sellerWallet;

  try {
    const settleTxSignature = await settleAuctionOnChainBySettler({
      auctionId: auction.id,
      sellerWallet: auction.sellerWallet,
      recipientWallet,
      cardMintOrAsset: auction.cardMintOrAsset,
      tokenStandard: auction.tokenStandard,
      collectionAddress: auction.collectionAddress,
      hasWinner,
    });

    const { feeAmount, sellerPayout } = hasWinner
      ? calculateAuctionFeeSplit(auction.currentHighestBid, auction.feeBps)
      : { feeAmount: 0, sellerPayout: 0 };

    const settled = await markAuctionSettled({
      auctionId: auction.id,
      status: hasWinner ? "SETTLED" : "EXPIRED",
      feeAmount,
      sellerPayout,
      settleTxSignature,
      winnerId: hasWinner ? auction.highestBidderId : null,
    });

    if (hasWinner) {
      const losingBidders = new Map<string, string>();
      for (const bid of auction.bids) {
        if (
          bid.status === "HELD" &&
          bid.bidderId !== auction.highestBidderId &&
          !losingBidders.has(bid.bidderId)
        ) {
          losingBidders.set(bid.bidderId, bid.bidderWallet);
        }
      }
      for (const [bidderId, bidderWallet] of losingBidders.entries()) {
        try {
          const refundSig = await refundLosingBidOnChainBySettler({
            auctionId: auction.id,
            bidderWallet,
          });
          await markBidderRefunded({
            auctionId: auction.id,
            bidderId,
            refundTxSignature: refundSig,
          });
        } catch {
          // Losing bidder can still claim manually via refund endpoint.
        }
      }
    }

    return settled;
  } catch {
    return auction;
  }
}

export async function sweepExpiredAuctionsUseCase(): Promise<{
  checked: number;
  settled: number;
}> {
  const expired = await findExpiredActiveAuctions();
  let settledCount = 0;
  for (const auction of expired) {
    const updated = await tryAutoSettleAuction(auction);
    if (updated.status !== "ACTIVE") {
      settledCount += 1;
    }
  }
  return { checked: expired.length, settled: settledCount };
}

export async function listAuctionsUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  tab: "explore" | "selling" | "bidding" | "history";
  kingdom?: Kingdom;
  cardType?: CardType;
  search?: string;
  sort?: "ending_soon" | "price_asc" | "price_desc" | "most_bids" | "newest";
  page?: number;
  pageSize?: number;
}): Promise<AuctionListResponseDto> {
  await sweepExpiredAuctionsUseCase().catch(() => undefined);

  const safePage = Math.max(1, Math.trunc(input.page ?? 1));
  const safePageSize = Math.min(
    AUCTION_POLICY.maxPageSize,
    Math.max(1, Math.trunc(input.pageSize ?? AUCTION_POLICY.defaultPageSize))
  );

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { walletAddress: true },
  });
  const walletAddress = input.sessionWallet ?? user?.walletAddress ?? null;

  const [
    paginated,
    heldAuctions,
    activeSellingCount,
    deckUsageMap,
    ownedCards,
    tokenBalances,
  ] = await Promise.all([
    findAuctions({
      tab: input.tab,
      userId: input.userId,
      kingdom: input.kingdom,
      cardType: input.cardType,
      search: input.search,
      sort: input.sort,
      page: safePage,
      pageSize: safePageSize,
    }),
    getUserHeldBidsOnActiveAuctions(input.userId),
    countActiveAuctionsBySeller(input.userId),
    getUserCardDeckUsageMap(input.userId),
    listOwnedCards(input.userId),
    walletAddress
      ? getWalletTokenBalances(walletAddress).catch(() => null)
      : Promise.resolve(null),
  ]);

  const nowMs = Date.now();
  const frozenAuctions: FrozenAuctionItemDto[] = [];
  let frozenNusaTotal = 0;

  for (const auction of heldAuctions) {
    const heldAmount = getUserHeldAmountOnAuction(auction, input.userId);
    if (heldAmount <= 0) continue;
    frozenNusaTotal += heldAmount;
    const isEnded = nowMs >= auction.endsAt.getTime();
    frozenAuctions.push({
      auctionId: auction.id,
      cardName: auction.card.name,
      cardImagePath: auction.card.imagePath,
      heldAmount,
      isHighestBidder: auction.highestBidderId === input.userId,
      status: auction.status,
      endsAt: auction.endsAt.toISOString(),
      refundPending:
        auction.highestBidderId !== input.userId &&
        (isEnded || auction.status !== "ACTIVE"),
    });
  }

  const sellableCards: SellableCardOptionDto[] = ownedCards.map((owned) => {
    const walletQty = owned.walletQuantity ?? owned.quantity;
    const inDeckQty = deckUsageMap.get(owned.card.id) ?? 0;
    const available = Math.max(0, walletQty - inDeckQty);
    const mintOrAssetAddress =
      owned.mintOrAssetAddresses?.[0] ?? owned.card.mintAddress ?? null;

    let blockedReason: string | null = null;
    if (owned.card.publicationStatus !== "ACTIVE") {
      blockedReason = AUCTION_MESSAGE_KEYS.CARD_INACTIVE;
    } else if (owned.card.isCustom && owned.card.customStatus !== "APPROVED") {
      blockedReason = AUCTION_MESSAGE_KEYS.CUSTOM_CARD_NOT_APPROVED;
    } else if (!mintOrAssetAddress) {
      blockedReason = AUCTION_MESSAGE_KEYS.CARD_NO_ONCHAIN_MINT;
    } else if (walletQty <= 0) {
      blockedReason = AUCTION_MESSAGE_KEYS.CARD_IN_OTHER_VAULT;
    } else if (available <= 0) {
      blockedReason = AUCTION_MESSAGE_KEYS.CARD_IN_DECK;
    }

    return {
      card: {
        id: owned.card.id,
        slug: owned.card.slug,
        name: owned.card.name,
        cardType: owned.card.cardType as CardType,
        kingdom: owned.card.kingdom as Kingdom,
        role: owned.card.role as CharacterRole,
        baseAttack: owned.card.baseAttack,
        baseDefense: owned.card.baseDefense,
        imagePath: owned.card.imagePath,
        isCustom: Boolean(owned.card.isCustom),
        isRareEdition: Boolean(owned.card.isRareEdition),
        tokenStandard:
          owned.tokenStandard ??
          (owned.card.tokenStandard === "MPL_CORE" ? "MPL_CORE" : "TOKEN_2022"),
      },
      walletQuantity: walletQty,
      inDeckQuantity: inDeckQty,
      availableForAuction: available,
      mintOrAssetAddress: mintOrAssetAddress ?? "",
      collectionAddress: owned.card.collectionAddress ?? "",
      blockedReason,
    };
  });

  return {
    auctions: paginated.items.map((item) => toListingDto(item, input.userId, nowMs)),
    pagination: {
      page: paginated.page,
      pageSize: paginated.pageSize,
      totalItems: paginated.totalItems,
      totalPages: paginated.totalPages,
    },
    walletAddress,
    walletNusaBalance: tokenBalances ? Math.floor(tokenBalances.nusa) : 0,
    frozenNusaTotal,
    frozenAuctions,
    activeSellingCount,
    maxActiveListings: AUCTION_POLICY.maxActiveListingsPerUser,
    sellableCards,
  };
}

export async function getAuctionDetailUseCase(input: {
  auctionId: string;
  userId: string;
}): Promise<AuctionDetailDto> {
  const existing = await findAuctionById(input.auctionId);
  if (!existing) {
    throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  }
  const latest = await tryAutoSettleAuction(existing);
  return toDetailDto(latest, input.userId);
}

export async function prepareCreateAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  cardId: string;
  startingPrice: number;
  durationMinutes: number;
}) {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );

  if (
    !Number.isInteger(input.startingPrice) ||
    input.startingPrice < AUCTION_POLICY.minStartingPriceNusa
  ) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INVALID_STARTING_PRICE);
  }
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < AUCTION_POLICY.minDurationMinutes ||
    input.durationMinutes > AUCTION_POLICY.maxDurationMinutes
  ) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INVALID_DURATION);
  }

  const activeCount = await countActiveAuctionsBySeller(input.userId);
  if (activeCount >= AUCTION_POLICY.maxActiveListingsPerUser) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.MAX_ACTIVE_LISTINGS);
  }

  const [ownedCards, deckUsageMap] = await Promise.all([
    listOwnedCards(input.userId, { bypassCache: true }),
    getUserCardDeckUsageMap(input.userId),
  ]);

  const owned = ownedCards.find((item) => item.card.id === input.cardId);
  if (!owned) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.CARD_NOT_OWNED);
  }
  if (owned.card.publicationStatus !== "ACTIVE") {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.CARD_INACTIVE);
  }
  if (owned.card.isCustom && owned.card.customStatus !== "APPROVED") {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.CUSTOM_CARD_NOT_APPROVED);
  }

  const walletQty = owned.walletQuantity ?? owned.quantity;
  const inDeckQty = deckUsageMap.get(owned.card.id) ?? 0;
  if (walletQty <= inDeckQty) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.CARD_IN_DECK);
  }

  const cardMintOrAsset =
    owned.mintOrAssetAddresses?.[0] ?? owned.card.mintAddress ?? null;
  if (!cardMintOrAsset) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.CARD_NO_ONCHAIN_MINT);
  }

  const tokenStandard =
    owned.tokenStandard ??
    (owned.card.tokenStandard === "MPL_CORE" ? "MPL_CORE" : "TOKEN_2022");
  const auctionId = `auc_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const durationSecs = input.durationMinutes * 60;

  const txData = await buildCreateAuctionTransaction({
    auctionId,
    sellerWallet,
    cardMintOrAsset,
    tokenStandard,
    collectionAddress: owned.card.collectionAddress,
    startingPriceNusa: input.startingPrice,
    durationSecs,
  });

  return {
    auctionId,
    auctionPda: txData.auctionPda,
    cardId: owned.card.id,
    cardMintOrAsset,
    tokenStandard,
    collectionAddress: owned.card.collectionAddress ?? "",
    startingPrice: input.startingPrice,
    durationMinutes: input.durationMinutes,
    serializedTransaction: txData.serializedTransaction,
    recentBlockhash: txData.recentBlockhash,
  };
}

export async function confirmCreateAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  cardId: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
  startingPrice: number;
  durationMinutes: number;
  txSignature: string;
}): Promise<AuctionListingDto> {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const [auctionPda] = await deriveAuctionPda(input.auctionId);

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: sellerWallet,
    expectedAuctionPda: auctionPda.toBase58(),
  });

  const startsAt = new Date();
  const endsAt = new Date(
    startsAt.getTime() + input.durationMinutes * 60 * 1000
  );

  const created = await createAuctionRecord({
    id: input.auctionId,
    sellerId: input.userId,
    sellerWallet,
    cardId: input.cardId,
    cardMintOrAsset: input.cardMintOrAsset,
    tokenStandard: input.tokenStandard,
    collectionAddress: input.collectionAddress?.trim() || null,
    auctionPda: auctionPda.toBase58(),
    startingPrice: input.startingPrice,
    bidIncrement: AUCTION_POLICY.minBidIncrementNusa,
    feeBps: AUCTION_POLICY.feeBps,
    durationMinutes: input.durationMinutes,
    startsAt,
    endsAt,
    createTxSignature: input.txSignature,
  });

  return toListingDto(created, input.userId);
}

export async function prepareUpdateAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  startingPrice: number;
  durationMinutes: number;
}) {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden(AUCTION_MESSAGE_KEYS.SELLER_ONLY_EDIT);
  }
  if (auction.status !== "ACTIVE" || Date.now() >= auction.endsAt.getTime()) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.AUCTION_NOT_ACTIVE);
  }
  if (auction.bidCount > 0) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.LOCKED_EDIT_HAS_BIDS);
  }
  if (
    !Number.isInteger(input.startingPrice) ||
    input.startingPrice < AUCTION_POLICY.minStartingPriceNusa
  ) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INVALID_STARTING_PRICE);
  }
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < AUCTION_POLICY.minDurationMinutes ||
    input.durationMinutes > AUCTION_POLICY.maxDurationMinutes
  ) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INVALID_DURATION);
  }

  const newEndsAtMs =
    auction.startsAt.getTime() + input.durationMinutes * 60 * 1000;
  if (newEndsAtMs <= Date.now()) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INVALID_END_TIME);
  }

  const txData = await buildUpdateAuctionTransaction({
    auctionId: auction.id,
    sellerWallet,
    newStartingPriceNusa: input.startingPrice,
    newDurationSecs: input.durationMinutes * 60,
  });

  return {
    auctionId: auction.id,
    startingPrice: input.startingPrice,
    durationMinutes: input.durationMinutes,
    ...txData,
  };
}

export async function confirmUpdateAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  startingPrice: number;
  durationMinutes: number;
  txSignature: string;
}): Promise<AuctionListingDto> {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden(AUCTION_MESSAGE_KEYS.SELLER_ONLY_EDIT);
  }
  if (auction.bidCount > 0) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.LOCKED_EDIT_HAS_BIDS);
  }

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: sellerWallet,
    expectedAuctionPda: auction.auctionPda,
  });

  const newEndsAt = new Date(
    auction.startsAt.getTime() + input.durationMinutes * 60 * 1000
  );
  const updated = await updateAuctionRecord({
    auctionId: auction.id,
    startingPrice: input.startingPrice,
    durationMinutes: input.durationMinutes,
    endsAt: newEndsAt,
  });

  return toListingDto(updated, input.userId);
}

export async function prepareCancelAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
}) {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden(AUCTION_MESSAGE_KEYS.SELLER_ONLY_CANCEL);
  }
  if (auction.status !== "ACTIVE") {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.AUCTION_NOT_ACTIVE);
  }
  if (auction.bidCount > 0) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.LOCKED_CANCEL_HAS_BIDS);
  }

  const txData = await buildCancelAuctionTransaction({
    auctionId: auction.id,
    sellerWallet,
    cardMintOrAsset: auction.cardMintOrAsset,
    tokenStandard: auction.tokenStandard,
    collectionAddress: auction.collectionAddress,
  });

  return {
    auctionId: auction.id,
    ...txData,
  };
}

export async function confirmCancelAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  txSignature: string;
}): Promise<AuctionListingDto> {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden(AUCTION_MESSAGE_KEYS.SELLER_ONLY_CANCEL);
  }

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: sellerWallet,
    expectedAuctionPda: auction.auctionPda,
  });

  const cancelled = await markAuctionCancelled({
    auctionId: auction.id,
    cancelTxSignature: input.txSignature,
  });

  return toListingDto(cancelled, input.userId);
}

export async function preparePlaceBidUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  amount: number;
}) {
  const bidderWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  if (auction.status !== "ACTIVE" || Date.now() >= auction.endsAt.getTime()) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.AUCTION_ENDED);
  }
  if (auction.sellerId === input.userId) {
    throw AppError.forbidden(AUCTION_MESSAGE_KEYS.SELLER_CANNOT_BID);
  }
  if (auction.highestBidderId === input.userId) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.ALREADY_HIGHEST_BIDDER);
  }
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INVALID_BID_AMOUNT);
  }

  const minRequired = computeMinNextBid(
    auction.startingPrice,
    auction.currentHighestBid,
    auction.bidCount,
    auction.bidIncrement
  );
  if (input.amount < minRequired) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.BID_TOO_LOW);
  }

  const alreadyHeld = getUserHeldAmountOnAuction(auction, input.userId);
  const deltaAmount = input.amount - alreadyHeld;
  if (deltaAmount <= 0) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.BID_BELOW_HELD);
  }

  const balances = await getWalletTokenBalances(bidderWallet);
  if (balances.nusa < deltaAmount) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.INSUFFICIENT_NUSA_BALANCE);
  }

  const txData = await buildPlaceBidTransaction({
    auctionId: auction.id,
    bidderWallet,
    newBidAmountNusa: input.amount,
  });

  return {
    auctionId: auction.id,
    amount: input.amount,
    deltaAmount,
    alreadyHeld,
    bidEscrowPda: txData.bidEscrowPda,
    serializedTransaction: txData.serializedTransaction,
    recentBlockhash: txData.recentBlockhash,
  };
}

export async function confirmPlaceBidUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  amount: number;
  deltaAmount: number;
  bidEscrowPda: string;
  txSignature: string;
}): Promise<AuctionDetailDto> {
  const bidderWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: bidderWallet,
    expectedAuctionPda: auction.auctionPda,
  });

  const nowMs = Date.now();
  const { nextEndsAtMs, nextExtendedSecs } = computeAntiSnipeExtension({
    nowMs,
    endsAtMs: auction.endsAt.getTime(),
    extendedSecs: auction.extendedSecs,
  });

  const updated = await recordBidTransaction({
    auctionId: auction.id,
    bidderId: input.userId,
    bidderWallet,
    amount: input.amount,
    deltaAmount: input.deltaAmount,
    bidEscrowPda: input.bidEscrowPda,
    txSignature: input.txSignature,
    nextEndsAt: new Date(nextEndsAtMs),
    nextExtendedSecs,
  });

  return toDetailDto(updated, input.userId);
}

export async function prepareSettleAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
}) {
  const payerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  if (auction.status !== "ACTIVE") {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.ALREADY_SETTLED);
  }
  if (Date.now() < auction.endsAt.getTime()) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.STILL_RUNNING_SETTLE);
  }

  const hasWinner = auction.bidCount > 0 && Boolean(auction.highestBidderWallet);
  const recipientWallet = hasWinner
    ? auction.highestBidderWallet!
    : auction.sellerWallet;

  const txData = await buildUserSettleAuctionTransaction({
    payerWallet,
    auctionId: auction.id,
    sellerWallet: auction.sellerWallet,
    recipientWallet,
    cardMintOrAsset: auction.cardMintOrAsset,
    tokenStandard: auction.tokenStandard,
    collectionAddress: auction.collectionAddress,
    hasWinner,
  });

  return {
    auctionId: auction.id,
    hasWinner,
    ...txData,
  };
}

export async function confirmSettleAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  txSignature: string;
}): Promise<AuctionDetailDto> {
  const payerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: payerWallet,
    expectedAuctionPda: auction.auctionPda,
  });

  const hasWinner = auction.bidCount > 0 && Boolean(auction.highestBidderId);
  const { feeAmount, sellerPayout } = hasWinner
    ? calculateAuctionFeeSplit(auction.currentHighestBid, auction.feeBps)
    : { feeAmount: 0, sellerPayout: 0 };

  const settled = await markAuctionSettled({
    auctionId: auction.id,
    status: hasWinner ? "SETTLED" : "EXPIRED",
    feeAmount,
    sellerPayout,
    settleTxSignature: input.txSignature,
    winnerId: hasWinner ? auction.highestBidderId : null,
  });

  return toDetailDto(settled, input.userId);
}

export async function prepareRefundBidUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
}) {
  const bidderWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);

  const isEnded =
    auction.status !== "ACTIVE" || Date.now() >= auction.endsAt.getTime();
  if (!isEnded) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.STILL_RUNNING_REFUND);
  }
  if (auction.highestBidderId === input.userId) {
    throw AppError.conflict(AUCTION_MESSAGE_KEYS.WINNER_CANNOT_REFUND);
  }

  const held = getUserHeldAmountOnAuction(auction, input.userId);
  if (held <= 0) {
    throw AppError.badRequest(AUCTION_MESSAGE_KEYS.NOTHING_TO_REFUND);
  }

  const txData = await buildUserRefundBidTransaction({
    payerWallet: bidderWallet,
    auctionId: auction.id,
    bidderWallet,
  });

  return {
    auctionId: auction.id,
    refundAmount: held,
    ...txData,
  };
}

export async function confirmRefundBidUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  txSignature: string;
}): Promise<AuctionDetailDto> {
  const bidderWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: bidderWallet,
    expectedAuctionPda: auction.auctionPda,
  });

  await markBidderRefunded({
    auctionId: auction.id,
    bidderId: input.userId,
    refundTxSignature: input.txSignature,
  });

  const refreshed = await findAuctionById(auction.id);
  if (!refreshed) throw AppError.notFound(AUCTION_MESSAGE_KEYS.NOT_FOUND);
  return toDetailDto(refreshed, input.userId);
}
