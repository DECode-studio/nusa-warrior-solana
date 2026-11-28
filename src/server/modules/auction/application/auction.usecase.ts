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
    throw AppError.badRequest(
      "Hubungkan dompet Solana terlebih dahulu untuk menggunakan fitur Lelang."
    );
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
    durationHours: auction.durationHours,
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

    // Refund losing bidders sequentially after settlement.
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
}): Promise<AuctionListResponseDto> {
  // Best-effort lazy settlement of expired listings.
  await sweepExpiredAuctionsUseCase().catch(() => undefined);

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { walletAddress: true },
  });
  const walletAddress = input.sessionWallet ?? user?.walletAddress ?? null;

  const [
    rawAuctions,
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
      blockedReason = "Kartu tidak aktif.";
    } else if (owned.card.isCustom && owned.card.customStatus !== "APPROVED") {
      blockedReason = "Kartu kustom belum disetujui admin.";
    } else if (!mintOrAssetAddress) {
      blockedReason = "Kartu belum memiliki aset on-chain di Solana.";
    } else if (walletQty <= 0) {
      blockedReason = "Kartu sedang terkunci di vault lain.";
    } else if (available <= 0) {
      blockedReason =
        "Kartu sedang terpasang di Deck. Keluarkan dari Deck terlebih dahulu.";
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
      mintOrAssetAddress,
      collectionAddress: owned.card.collectionAddress ?? null,
      blockedReason,
    };
  });

  return {
    auctions: rawAuctions.map((item) => toListingDto(item, input.userId, nowMs)),
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
    throw AppError.notFound("Lelang tidak ditemukan.");
  }
  const latest = await tryAutoSettleAuction(existing);
  return toDetailDto(latest, input.userId);
}

export async function prepareCreateAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  cardId: string;
  startingPrice: number;
  durationHours: number;
}) {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );

  if (
    !Number.isInteger(input.startingPrice) ||
    input.startingPrice < AUCTION_POLICY.minStartingPriceNusa
  ) {
    throw AppError.badRequest(
      `Harga awal minimal ${AUCTION_POLICY.minStartingPriceNusa} NUSA (bilangan bulat).`
    );
  }
  if (
    !Number.isInteger(input.durationHours) ||
    input.durationHours < AUCTION_POLICY.minDurationHours ||
    input.durationHours > AUCTION_POLICY.maxDurationHours
  ) {
    throw AppError.badRequest(
      `Durasi lelang harus antara ${AUCTION_POLICY.minDurationHours} hingga ${AUCTION_POLICY.maxDurationHours} jam.`
    );
  }

  const activeCount = await countActiveAuctionsBySeller(input.userId);
  if (activeCount >= AUCTION_POLICY.maxActiveListingsPerUser) {
    throw AppError.conflict(
      `Maksimal ${AUCTION_POLICY.maxActiveListingsPerUser} lelang aktif secara bersamaan.`
    );
  }

  const [ownedCards, deckUsageMap] = await Promise.all([
    listOwnedCards(input.userId, { bypassCache: true }),
    getUserCardDeckUsageMap(input.userId),
  ]);

  const owned = ownedCards.find((item) => item.card.id === input.cardId);
  if (!owned) {
    throw AppError.badRequest("Anda tidak memiliki kartu ini di dompet Solana.");
  }
  if (owned.card.publicationStatus !== "ACTIVE") {
    throw AppError.badRequest("Kartu ini tidak aktif dan tidak dapat dilelang.");
  }
  if (owned.card.isCustom && owned.card.customStatus !== "APPROVED") {
    throw AppError.badRequest(
      "Kartu kustom harus disetujui admin terlebih dahulu sebelum dilelang."
    );
  }

  const walletQty = owned.walletQuantity ?? owned.quantity;
  const inDeckQty = deckUsageMap.get(owned.card.id) ?? 0;
  if (walletQty <= inDeckQty) {
    throw AppError.conflict(
      "Kartu ini sedang dipakai di Deck Anda. Keluarkan kartu dari Deck terlebih dahulu sebelum melelang."
    );
  }

  const cardMintOrAsset =
    owned.mintOrAssetAddresses?.[0] ?? owned.card.mintAddress ?? null;
  if (!cardMintOrAsset) {
    throw AppError.badRequest(
      "Kartu belum memiliki mint/asset address on-chain di Solana."
    );
  }

  const tokenStandard =
    owned.tokenStandard ??
    (owned.card.tokenStandard === "MPL_CORE" ? "MPL_CORE" : "TOKEN_2022");
  const auctionId = `auc_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const durationSecs = input.durationHours * 3600;

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
    collectionAddress: owned.card.collectionAddress ?? null,
    startingPrice: input.startingPrice,
    durationHours: input.durationHours,
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
  durationHours: number;
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
    startsAt.getTime() + input.durationHours * 3600 * 1000
  );

  const created = await createAuctionRecord({
    id: input.auctionId,
    sellerId: input.userId,
    sellerWallet,
    cardId: input.cardId,
    cardMintOrAsset: input.cardMintOrAsset,
    tokenStandard: input.tokenStandard,
    collectionAddress: input.collectionAddress ?? null,
    auctionPda: auctionPda.toBase58(),
    startingPrice: input.startingPrice,
    bidIncrement: AUCTION_POLICY.minBidIncrementNusa,
    feeBps: AUCTION_POLICY.feeBps,
    durationHours: input.durationHours,
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
  durationHours: number;
}) {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden("Hanya pemilik lelang yang dapat mengedit lelang ini.");
  }
  if (auction.status !== "ACTIVE" || Date.now() >= auction.endsAt.getTime()) {
    throw AppError.conflict("Lelang sudah tidak aktif.");
  }
  if (auction.bidCount > 0) {
    throw AppError.conflict(
      "Lelang tidak dapat diedit karena sudah ada peserta yang melakukan bid."
    );
  }
  if (
    !Number.isInteger(input.startingPrice) ||
    input.startingPrice < AUCTION_POLICY.minStartingPriceNusa
  ) {
    throw AppError.badRequest(
      `Harga awal minimal ${AUCTION_POLICY.minStartingPriceNusa} NUSA.`
    );
  }
  if (
    !Number.isInteger(input.durationHours) ||
    input.durationHours < AUCTION_POLICY.minDurationHours ||
    input.durationHours > AUCTION_POLICY.maxDurationHours
  ) {
    throw AppError.badRequest(
      `Durasi lelang harus antara ${AUCTION_POLICY.minDurationHours} hingga ${AUCTION_POLICY.maxDurationHours} jam.`
    );
  }

  const newEndsAtMs =
    auction.startsAt.getTime() + input.durationHours * 3600 * 1000;
  if (newEndsAtMs <= Date.now()) {
    throw AppError.badRequest(
      "Durasi baru harus menghasilkan waktu akhir di masa depan."
    );
  }

  const txData = await buildUpdateAuctionTransaction({
    auctionId: auction.id,
    sellerWallet,
    newStartingPriceNusa: input.startingPrice,
    newDurationSecs: input.durationHours * 3600,
  });

  return {
    auctionId: auction.id,
    startingPrice: input.startingPrice,
    durationHours: input.durationHours,
    ...txData,
  };
}

export async function confirmUpdateAuctionUseCase(input: {
  userId: string;
  sessionWallet?: string | null;
  auctionId: string;
  startingPrice: number;
  durationHours: number;
  txSignature: string;
}): Promise<AuctionListingDto> {
  const sellerWallet = await resolvePlayerWallet(
    input.userId,
    input.sessionWallet
  );
  const auction = await findAuctionById(input.auctionId);
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden("Hanya pemilik lelang yang dapat mengedit lelang ini.");
  }
  if (auction.bidCount > 0) {
    throw AppError.conflict("Lelang sudah memiliki penawar.");
  }

  await verifyAuctionProgramTransaction({
    txSignature: input.txSignature,
    expectedSignerWallet: sellerWallet,
    expectedAuctionPda: auction.auctionPda,
  });

  const newEndsAt = new Date(
    auction.startsAt.getTime() + input.durationHours * 3600 * 1000
  );
  const updated = await updateAuctionRecord({
    auctionId: auction.id,
    startingPrice: input.startingPrice,
    durationHours: input.durationHours,
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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden("Hanya pemilik lelang yang dapat membatalkan lelang.");
  }
  if (auction.status !== "ACTIVE") {
    throw AppError.conflict("Lelang sudah tidak aktif.");
  }
  if (auction.bidCount > 0) {
    throw AppError.conflict(
      "Lelang tidak dapat dihapus karena sudah ada peserta yang melakukan bid."
    );
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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");
  if (auction.sellerId !== input.userId) {
    throw AppError.forbidden("Hanya pemilik lelang yang dapat membatalkan lelang.");
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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");
  if (auction.status !== "ACTIVE" || Date.now() >= auction.endsAt.getTime()) {
    throw AppError.conflict("Lelang sudah berakhir atau tidak aktif.");
  }
  if (auction.sellerId === input.userId) {
    throw AppError.forbidden("Pemilik lelang tidak dapat menawar kartunya sendiri.");
  }
  if (auction.highestBidderId === input.userId) {
    throw AppError.conflict(
      "Anda sudah menjadi penawar tertinggi saat ini. Tunggu penawar lain sebelum menaikkan bid."
    );
  }
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw AppError.badRequest("Nominal bid harus berupa bilangan bulat NUSA.");
  }

  const minRequired = computeMinNextBid(
    auction.startingPrice,
    auction.currentHighestBid,
    auction.bidCount,
    auction.bidIncrement
  );
  if (input.amount < minRequired) {
    throw AppError.badRequest(
      `Nominal bid minimal adalah ${minRequired} NUSA (+${auction.bidIncrement} NUSA).`
    );
  }

  const alreadyHeld = getUserHeldAmountOnAuction(auction, input.userId);
  const deltaAmount = input.amount - alreadyHeld;
  if (deltaAmount <= 0) {
    throw AppError.badRequest("Nominal bid harus lebih besar dari saldo yang sudah Anda tahan.");
  }

  // Verify bidder has sufficient NUSA balance on-chain before preparing tx.
  const balances = await getWalletTokenBalances(bidderWallet);
  if (balances.nusa < deltaAmount) {
    throw AppError.badRequest(
      `Saldo NUSA Anda tidak mencukupi. Dibutuhkan ${deltaAmount} NUSA untuk dibekukan, saldo tersedia ${Math.floor(balances.nusa)} NUSA.`
    );
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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");

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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");
  if (auction.status !== "ACTIVE") {
    throw AppError.conflict("Lelang sudah diselesaikan.");
  }
  if (Date.now() < auction.endsAt.getTime()) {
    throw AppError.badRequest("Lelang masih berjalan dan belum dapat diselesaikan.");
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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");

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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");

  const isEnded =
    auction.status !== "ACTIVE" || Date.now() >= auction.endsAt.getTime();
  if (!isEnded) {
    throw AppError.badRequest(
      "Dana yang dibekukan baru dapat dikembalikan setelah lelang berakhir."
    );
  }
  if (auction.highestBidderId === input.userId) {
    throw AppError.conflict("Pemenang lelang tidak dapat mengklaim refund bid.");
  }

  const held = getUserHeldAmountOnAuction(auction, input.userId);
  if (held <= 0) {
    throw AppError.badRequest("Tidak ada saldo NUSA dibekukan yang perlu dikembalikan.");
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
  if (!auction) throw AppError.notFound("Lelang tidak ditemukan.");

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
  if (!refreshed) throw AppError.notFound("Lelang tidak ditemukan.");
  return toDetailDto(refreshed, input.userId);
}
