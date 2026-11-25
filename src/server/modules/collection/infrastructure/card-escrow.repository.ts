import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { assertBattleDataUnlocked } from "@/server/modules/battle/infrastructure/battle-integrity.guard";

export interface EscrowCardInput {
  cardSlug: string;
  quantity: number;
}

export interface CardEscrowReceipt {
  id: string;
  ownerUserId: string;
  referenceType: string;
  referenceId: string;
  status: "OPEN" | "SETTLED" | "RELEASED";
  items: Array<{ cardSlug: string; quantity: number }>;
}

function requirePrisma(): void {
  if (!isPrismaDriverEnabled()) {
    throw AppError.internal("Card escrow membutuhkan storage PostgreSQL.");
  }
}

function validateEscrowItems(items: EscrowCardInput[]): EscrowCardInput[] {
  if (items.length === 0 || items.length > 20) {
    throw AppError.validation("Escrow harus berisi 1 sampai 20 jenis kartu.");
  }
  const grouped = new Map<string, number>();
  for (const item of items) {
    if (!item.cardSlug || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw AppError.validation("Jumlah kartu escrow tidak valid.");
    }
    grouped.set(item.cardSlug, (grouped.get(item.cardSlug) ?? 0) + item.quantity);
  }
  if ([...grouped.values()].some((quantity) => !Number.isSafeInteger(quantity))) {
    throw AppError.validation("Jumlah kartu escrow terlalu besar.");
  }
  return [...grouped.entries()].map(([cardSlug, quantity]) => ({ cardSlug, quantity }));
}

export async function reserveCardsInEscrow(input: {
  ownerUserId: string;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  items: EscrowCardInput[];
  expiresAt?: Date;
}): Promise<CardEscrowReceipt> {
  requirePrisma();
  const items = validateEscrowItems(input.items);
  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw AppError.validation("Waktu kedaluwarsa escrow harus di masa depan.");
  }
  if (!/^[a-zA-Z0-9:_-]{8,180}$/.test(input.idempotencyKey)) {
    throw AppError.validation("Kunci idempotensi escrow tidak valid.");
  }
  if (!/^[A-Z_]{2,40}$/.test(input.referenceType) || input.referenceId.length < 1 || input.referenceId.length > 180) {
    throw AppError.validation("Referensi escrow tidak valid.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.cardEscrow.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: { include: { card: { select: { slug: true } } } } },
    });
    if (existing) {
      if (
        existing.ownerUserId !== input.ownerUserId ||
        existing.referenceType !== input.referenceType ||
        existing.referenceId !== input.referenceId
      ) {
        throw AppError.conflict("Kunci idempotensi escrow sudah digunakan.");
      }
      return toReceipt(existing);
    }

    await assertBattleDataUnlocked(tx, [input.ownerUserId]);

    const cards = await tx.card.findMany({
      where: { slug: { in: items.map((item) => item.cardSlug) }, publicationStatus: "ACTIVE" },
      select: { id: true, slug: true },
    });
    const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
    if (cardsBySlug.size !== items.length) {
      throw AppError.validation("Salah satu kartu escrow tidak tersedia.");
    }

    const transactionId = randomUUID();
    const escrowId = randomUUID();
    const ledgerTransaction = await tx.cardLedgerTransaction.create({
      data: {
        id: transactionId,
        idempotencyKey: `escrow-reserve:${input.idempotencyKey}`,
        type: "ESCROW_RESERVE",
        referenceId: input.referenceId,
        actorUserId: input.ownerUserId,
      },
    });
    const escrow = await tx.cardEscrow.create({
      data: {
        id: escrowId,
        ownerUserId: input.ownerUserId,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        idempotencyKey: input.idempotencyKey,
        reserveTransactionId: ledgerTransaction.id,
        expiresAt: input.expiresAt,
        items: {
          create: items.map((item) => ({
            cardId: cardsBySlug.get(item.cardSlug)!.id,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { card: { select: { slug: true } } } } },
    });

    const entries: Array<{
      id: string;
      transactionId: string;
      cardId: string;
      accountType: string;
      accountId: string;
      quantity: number;
    }> = [];
    const debitValues = items.map((item) => {
      const card = cardsBySlug.get(item.cardSlug)!;
      entries.push(
        {
          id: randomUUID(), transactionId, cardId: card.id,
          accountType: "USER", accountId: input.ownerUserId, quantity: -item.quantity,
        },
        {
          id: randomUUID(), transactionId, cardId: card.id,
          accountType: "ESCROW", accountId: escrowId, quantity: item.quantity,
        }
      );
      return Prisma.sql`(${input.ownerUserId}, ${card.id}, ${item.quantity})`;
    });
    const changed = await tx.$queryRaw<Array<{ cardId: string }>>(Prisma.sql`
      UPDATE "user_cards" AS owned
      SET "quantity" = owned."quantity" - requested."quantity",
          "updatedAt" = clock_timestamp()
      FROM (VALUES ${Prisma.join(debitValues)}) AS requested("userId", "cardId", "quantity")
      WHERE owned."userId" = requested."userId"
        AND owned."cardId" = requested."cardId"
        AND owned."quantity" >= requested."quantity"
      RETURNING owned."cardId" AS "cardId"
    `);
    if (changed.length !== items.length) {
      throw AppError.conflict("Jumlah kartu tidak cukup untuk membuat escrow.");
    }
    await tx.cardLedgerEntry.createMany({ data: entries });
    return toReceipt(escrow);
  }).catch(async (error: unknown) => {
    const replay = await prisma.cardEscrow.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: { include: { card: { select: { slug: true } } } } },
    });
    if (replay) {
      if (
        replay.ownerUserId !== input.ownerUserId ||
        replay.referenceType !== input.referenceType ||
        replay.referenceId !== input.referenceId
      ) throw AppError.conflict("Kunci idempotensi escrow sudah digunakan.");
      return toReceipt(replay);
    }
    throw error;
  });
}

/** Call only after a trusted server-side match result has been finalized. */
export async function settleCardEscrow(input: {
  escrowId: string;
  recipientUserId: string;
  idempotencyKey: string;
}): Promise<CardEscrowReceipt> {
  return finalizeEscrow({ ...input, status: "SETTLED", transactionType: "ESCROW_SETTLE" });
}

/** Return a hold to its original owner; never expose this as a client-selected action. */
export async function releaseCardEscrow(input: {
  escrowId: string;
  idempotencyKey: string;
}): Promise<CardEscrowReceipt> {
  requirePrisma();
  const escrow = await prisma.cardEscrow.findUnique({ where: { id: input.escrowId } });
  if (!escrow) throw AppError.notFound("Escrow kartu tidak ditemukan.");
  return finalizeEscrow({
    escrowId: escrow.id,
    recipientUserId: escrow.ownerUserId,
    idempotencyKey: input.idempotencyKey,
    status: "RELEASED",
    transactionType: "ESCROW_RELEASE",
  });
}

export async function releaseExpiredCardEscrows(now = new Date()): Promise<number> {
  requirePrisma();
  const expired = await prisma.cardEscrow.findMany({
    where: { status: "OPEN", expiresAt: { lte: now } },
    select: { id: true },
    take: 100,
  });
  let released = 0;
  for (const escrow of expired) {
    await releaseCardEscrow({
      escrowId: escrow.id,
      idempotencyKey: `expiry:${escrow.id}`,
    });
    released += 1;
  }
  return released;
}

export async function auditCardLedger(): Promise<{
  balanced: boolean;
  checkedAccounts: number;
  discrepancies: string[];
}> {
  requirePrisma();
  const [entries, holdings, escrowItems, openEscrows] = await Promise.all([
    prisma.cardLedgerEntry.groupBy({
      by: ["cardId", "accountType", "accountId"],
      _sum: { quantity: true },
    }),
    prisma.userCard.findMany({ select: { userId: true, cardId: true, quantity: true } }),
    prisma.cardEscrowItem.findMany({
      where: { escrow: { status: "OPEN" } },
      select: { escrowId: true, cardId: true, quantity: true },
    }),
    prisma.cardEscrow.findMany({ where: { status: "OPEN" }, select: { id: true } }),
  ]);
  const discrepancies: string[] = [];
  const amountByAccount = new Map<string, number>();
  const totalByCard = new Map<string, number>();
  const key = (cardId: string, accountType: string, accountId: string) =>
    `${cardId}\u0000${accountType}\u0000${accountId}`;
  for (const entry of entries) {
    const amount = entry._sum.quantity ?? 0;
    amountByAccount.set(key(entry.cardId, entry.accountType, entry.accountId), amount);
    totalByCard.set(entry.cardId, (totalByCard.get(entry.cardId) ?? 0) + amount);
  }
  for (const [cardId, total] of totalByCard) {
    if (total !== 0) discrepancies.push(`CARD_LEDGER_UNBALANCED:${cardId}`);
  }
  for (const holding of holdings) {
    const balance = amountByAccount.get(key(holding.cardId, "USER", holding.userId)) ?? 0;
    if (balance !== holding.quantity) {
      discrepancies.push(`USER_HOLDING_MISMATCH:${holding.userId}:${holding.cardId}`);
    }
  }
  for (const item of escrowItems) {
    const balance = amountByAccount.get(key(item.cardId, "ESCROW", item.escrowId)) ?? 0;
    if (balance !== item.quantity) discrepancies.push(`ESCROW_HOLDING_MISMATCH:${item.escrowId}:${item.cardId}`);
  }
  for (const entry of entries) {
    if (entry.accountType === "USER" && !holdings.some(
      (holding) => holding.cardId === entry.cardId && holding.userId === entry.accountId
    )) {
      discrepancies.push(`LEDGER_USER_ACCOUNT_MISSING:${entry.accountId}:${entry.cardId}`);
    }
    if (entry.accountType === "ESCROW" && !openEscrows.some((escrow) => escrow.id === entry.accountId)) {
      if ((entry._sum.quantity ?? 0) !== 0) {
        discrepancies.push(`LEDGER_ESCROW_ACCOUNT_MISSING:${entry.accountId}:${entry.cardId}`);
      }
    }
  }
  return {
    balanced: discrepancies.length === 0,
    checkedAccounts: entries.length,
    discrepancies,
  };
}

async function finalizeEscrow(input: {
  escrowId: string;
  recipientUserId: string;
  idempotencyKey: string;
  status: "SETTLED" | "RELEASED";
  transactionType: "ESCROW_SETTLE" | "ESCROW_RELEASE";
}): Promise<CardEscrowReceipt> {
  requirePrisma();
  return prisma.$transaction(async (tx) => {
    const ledgerKey = `${input.transactionType.toLowerCase()}:${input.escrowId}:${input.idempotencyKey}`;
    const priorTransaction = await tx.cardLedgerTransaction.findUnique({ where: { idempotencyKey: ledgerKey } });
    const escrow = await tx.cardEscrow.findUnique({
      where: { id: input.escrowId },
      include: { items: { include: { card: { select: { slug: true } } } } },
    });
    if (!escrow) throw AppError.notFound("Escrow kartu tidak ditemukan.");
    if (priorTransaction) return toReceipt(escrow);
    if (escrow.status !== "OPEN") throw AppError.conflict("Escrow sudah diselesaikan.");

    await assertBattleDataUnlocked(tx, [escrow.ownerUserId, input.recipientUserId]);

    const changed = await tx.cardEscrow.updateMany({
      where: { id: escrow.id, status: "OPEN" },
      data: { status: input.status },
    });
    if (changed.count !== 1) throw AppError.conflict("Escrow sedang diselesaikan oleh request lain.");

    const transactionId = randomUUID();
    await tx.cardLedgerTransaction.create({
      data: {
        id: transactionId,
        idempotencyKey: ledgerKey,
        type: input.transactionType,
        referenceId: escrow.referenceId,
        actorUserId: input.recipientUserId,
      },
    });
    const entries: Array<{
      id: string;
      transactionId: string;
      cardId: string;
      accountType: string;
      accountId: string;
      quantity: number;
    }> = [];
    for (const item of escrow.items) {
      entries.push(
        {
          id: randomUUID(), transactionId, cardId: item.cardId,
          accountType: "ESCROW", accountId: escrow.id, quantity: -item.quantity,
        },
        {
          id: randomUUID(), transactionId, cardId: item.cardId,
          accountType: "USER", accountId: input.recipientUserId, quantity: item.quantity,
        }
      );
    }
    const now = new Date();
    const userCardValues = escrow.items.map((item) => Prisma.sql`(
      ${randomUUID()}, ${input.recipientUserId}, ${item.cardId}, ${item.quantity},
      ${input.transactionType}, ${now}, ${now}
    )`);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "user_cards" (
        "id", "userId", "cardId", "quantity", "source", "createdAt", "updatedAt"
      )
      VALUES ${Prisma.join(userCardValues)}
      ON CONFLICT ("userId", "cardId") DO UPDATE SET
        "quantity" = "user_cards"."quantity" + EXCLUDED."quantity",
        "source" = EXCLUDED."source",
        "updatedAt" = EXCLUDED."updatedAt"
    `);
    await tx.cardLedgerEntry.createMany({ data: entries });
    const finalEscrow = await tx.cardEscrow.findUniqueOrThrow({
      where: { id: escrow.id },
      include: { items: { include: { card: { select: { slug: true } } } } },
    });
    return toReceipt(finalEscrow);
  });
}

function toReceipt(
  escrow: Prisma.CardEscrowGetPayload<{ include: { items: { include: { card: { select: { slug: true } } } } } }>
): CardEscrowReceipt {
  return {
    id: escrow.id,
    ownerUserId: escrow.ownerUserId,
    referenceType: escrow.referenceType,
    referenceId: escrow.referenceId,
    status: escrow.status as CardEscrowReceipt["status"],
    items: escrow.items.map((item) => ({ cardSlug: item.card.slug, quantity: item.quantity })),
  };
}
