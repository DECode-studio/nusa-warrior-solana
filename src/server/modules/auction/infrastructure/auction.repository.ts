import "server-only";
import { Prisma, type AuctionStatus, type CardType, type Kingdom } from "@prisma/client";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";

function requirePrisma(): void {
  if (!isPrismaDriverEnabled()) {
    throw AppError.internal(
      "Fitur Auction membutuhkan driver database PostgreSQL (Prisma)."
    );
  }
}

export const auctionInclude = {
  seller: { select: { id: true, name: true, walletAddress: true } },
  highestBidder: { select: { id: true, name: true, walletAddress: true } },
  card: {
    select: {
      id: true,
      slug: true,
      name: true,
      cardType: true,
      kingdom: true,
      role: true,
      baseAttack: true,
      baseDefense: true,
      imagePath: true,
      isCustom: true,
      isRareEdition: true,
      tokenStandard: true,
    },
  },
  bids: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    include: {
      bidder: { select: { id: true, name: true, walletAddress: true } },
    },
  },
} satisfies Prisma.AuctionListingInclude;

export type AuctionWithRelations = Prisma.AuctionListingGetPayload<{
  include: typeof auctionInclude;
}>;

export interface PaginatedAuctionsResult {
  items: AuctionWithRelations[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function findAuctions(input: {
  tab: "explore" | "selling" | "bidding" | "history";
  userId: string;
  kingdom?: Kingdom;
  cardType?: CardType;
  search?: string;
  sort?: "ending_soon" | "price_asc" | "price_desc" | "most_bids" | "newest";
  page?: number;
  pageSize?: number;
}): Promise<PaginatedAuctionsResult> {
  requirePrisma();

  const pageSize = Math.min(10, Math.max(1, Math.trunc(input.pageSize ?? 10)));
  const requestedPage = Math.max(1, Math.trunc(input.page ?? 1));

  const where: Prisma.AuctionListingWhereInput = { deletedAt: null };
  if (input.tab === "explore") {
    where.status = "ACTIVE";
  } else if (input.tab === "selling") {
    where.sellerId = input.userId;
  } else if (input.tab === "bidding") {
    where.bids = { some: { bidderId: input.userId, deletedAt: null } };
  } else if (input.tab === "history") {
    where.status = { in: ["SETTLED", "EXPIRED", "CANCELLED"] };
  }

  const cardWhere: Prisma.CardWhereInput = {};
  if (input.kingdom) cardWhere.kingdom = input.kingdom;
  if (input.cardType) cardWhere.cardType = input.cardType;
  if (input.search?.trim()) {
    cardWhere.name = { contains: input.search.trim(), mode: "insensitive" };
  }
  if (Object.keys(cardWhere).length > 0) {
    where.card = cardWhere;
  }

  let orderBy: Prisma.AuctionListingOrderByWithRelationInput[] = [
    { endsAt: "asc" },
  ];
  if (input.sort === "price_asc") {
    orderBy = [{ currentHighestBid: "asc" }, { startingPrice: "asc" }];
  } else if (input.sort === "price_desc") {
    orderBy = [{ currentHighestBid: "desc" }, { startingPrice: "desc" }];
  } else if (input.sort === "most_bids") {
    orderBy = [{ bidCount: "desc" }, { endsAt: "asc" }];
  } else if (input.sort === "newest") {
    orderBy = [{ createdAt: "desc" }];
  }

  const totalItems = await prisma.auctionListing.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const items = await prisma.auctionListing.findMany({
    where,
    include: auctionInclude,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items,
    totalItems,
    page,
    pageSize,
    totalPages,
  };
}

export async function findAuctionById(
  auctionId: string
): Promise<AuctionWithRelations | null> {
  requirePrisma();
  return prisma.auctionListing.findFirst({
    where: { id: auctionId, deletedAt: null },
    include: auctionInclude,
  });
}

export async function findExpiredActiveAuctions(
  now: Date = new Date()
): Promise<AuctionWithRelations[]> {
  requirePrisma();
  return prisma.auctionListing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      endsAt: { lte: now },
    },
    include: auctionInclude,
    take: 25,
  });
}

export async function countActiveAuctionsBySeller(
  sellerId: string
): Promise<number> {
  requirePrisma();
  return prisma.auctionListing.count({
    where: { sellerId, status: "ACTIVE", deletedAt: null },
  });
}

export async function getUserCardDeckUsageMap(
  userId: string
): Promise<Map<string, number>> {
  requirePrisma();
  const decks = await prisma.deck.findMany({
    where: { userId, isPreset: false },
    select: {
      cards: {
        select: { cardId: true, quantity: true },
      },
    },
  });

  const maxPerCard = new Map<string, number>();
  for (const deck of decks) {
    for (const entry of deck.cards) {
      const prev = maxPerCard.get(entry.cardId) ?? 0;
      if (entry.quantity > prev) {
        maxPerCard.set(entry.cardId, entry.quantity);
      }
    }
  }
  return maxPerCard;
}

export async function getUserHeldBidsOnActiveAuctions(userId: string) {
  requirePrisma();
  return prisma.auctionListing.findMany({
    where: {
      deletedAt: null,
      bids: {
        some: {
          bidderId: userId,
          status: "HELD",
          deletedAt: null,
        },
      },
    },
    include: auctionInclude,
    orderBy: { endsAt: "asc" },
  });
}

export async function createAuctionRecord(input: {
  id: string;
  sellerId: string;
  sellerWallet: string;
  cardId: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
  auctionPda: string;
  startingPrice: number;
  bidIncrement: number;
  feeBps: number;
  durationMinutes: number;
  startsAt: Date;
  endsAt: Date;
  createTxSignature: string;
}): Promise<AuctionWithRelations> {
  requirePrisma();
  return prisma.auctionListing.create({
    data: {
      id: input.id,
      sellerId: input.sellerId,
      sellerWallet: input.sellerWallet,
      cardId: input.cardId,
      cardMintOrAsset: input.cardMintOrAsset,
      tokenStandard: input.tokenStandard,
      collectionAddress: input.collectionAddress ?? null,
      auctionPda: input.auctionPda,
      startingPrice: input.startingPrice,
      bidIncrement: input.bidIncrement,
      feeBps: input.feeBps,
      durationHours: Math.max(1, Math.ceil(input.durationMinutes / 60)),
      durationMinutes: input.durationMinutes,
      startsAt: input.startsAt,
      originalEndsAt: input.endsAt,
      endsAt: input.endsAt,
      createTxSignature: input.createTxSignature,
    },
    include: auctionInclude,
  });
}

export async function updateAuctionRecord(input: {
  auctionId: string;
  startingPrice: number;
  durationMinutes: number;
  endsAt: Date;
}): Promise<AuctionWithRelations> {
  requirePrisma();
  return prisma.auctionListing.update({
    where: { id: input.auctionId },
    data: {
      startingPrice: input.startingPrice,
      durationHours: Math.max(1, Math.ceil(input.durationMinutes / 60)),
      durationMinutes: input.durationMinutes,
      originalEndsAt: input.endsAt,
      endsAt: input.endsAt,
    },
    include: auctionInclude,
  });
}

export async function markAuctionCancelled(input: {
  auctionId: string;
  cancelTxSignature: string;
}): Promise<AuctionWithRelations> {
  requirePrisma();
  const now = new Date();
  return prisma.auctionListing.update({
    where: { id: input.auctionId },
    data: {
      status: "CANCELLED",
      cancelTxSignature: input.cancelTxSignature,
      settledAt: now,
      deletedAt: now,
    },
    include: auctionInclude,
  });
}

export async function recordBidTransaction(input: {
  auctionId: string;
  bidderId: string;
  bidderWallet: string;
  amount: number;
  deltaAmount: number;
  bidEscrowPda: string;
  txSignature: string;
  nextEndsAt: Date;
  nextExtendedSecs: number;
}): Promise<AuctionWithRelations> {
  requirePrisma();
  return prisma.$transaction(async (tx) => {
    await tx.auctionBid.create({
      data: {
        auctionId: input.auctionId,
        bidderId: input.bidderId,
        bidderWallet: input.bidderWallet,
        amount: input.amount,
        deltaAmount: input.deltaAmount,
        status: "HELD",
        bidEscrowPda: input.bidEscrowPda,
        txSignature: input.txSignature,
      },
    });

    return tx.auctionListing.update({
      where: { id: input.auctionId },
      data: {
        currentHighestBid: input.amount,
        highestBidderId: input.bidderId,
        highestBidderWallet: input.bidderWallet,
        bidCount: { increment: 1 },
        endsAt: input.nextEndsAt,
        extendedSecs: input.nextExtendedSecs,
      },
      include: auctionInclude,
    });
  });
}

export async function markAuctionSettled(input: {
  auctionId: string;
  status: Extract<AuctionStatus, "SETTLED" | "EXPIRED">;
  feeAmount: number;
  sellerPayout: number;
  settleTxSignature: string;
  winnerId?: string | null;
}): Promise<AuctionWithRelations> {
  requirePrisma();
  return prisma.$transaction(async (tx) => {
    if (input.status === "SETTLED" && input.winnerId) {
      await tx.auctionBid.updateMany({
        where: {
          auctionId: input.auctionId,
          bidderId: input.winnerId,
          status: "HELD",
        },
        data: { status: "WON" },
      });
    }

    return tx.auctionListing.update({
      where: { id: input.auctionId },
      data: {
        status: input.status,
        feeAmount: input.feeAmount,
        sellerPayout: input.sellerPayout,
        settleTxSignature: input.settleTxSignature,
        settledAt: new Date(),
      },
      include: auctionInclude,
    });
  });
}

export async function markBidderRefunded(input: {
  auctionId: string;
  bidderId: string;
  refundTxSignature: string;
}): Promise<void> {
  requirePrisma();
  await prisma.auctionBid.updateMany({
    where: {
      auctionId: input.auctionId,
      bidderId: input.bidderId,
      status: "HELD",
    },
    data: {
      status: "REFUNDED",
      refundTxSignature: input.refundTxSignature,
      refundedAt: new Date(),
    },
  });
}
