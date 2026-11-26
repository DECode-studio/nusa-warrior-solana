import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredUserCardRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import { getVerifiedWalletCards } from "@/server/modules/solana/wallet-asset-reader.service";

export interface OwnedCardDto {
  card: Awaited<ReturnType<typeof cardRepository.findMany>>[number];
  quantity: number;
  walletQuantity?: number;
  inVaultQuantity?: number;
  tokenStandard?: "TOKEN_2022" | "MPL_CORE";
  mintOrAssetAddresses?: string[];
}

export async function listOwnedCards(
  userId: string,
  options?: { bypassCache?: boolean }
): Promise<OwnedCardDto[]> {
  const cards = await cardRepository.findMany({ includeWithdrawn: false });
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  if (isPrismaDriverEnabled()) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    const hasOnChainRegistry =
      process.env.NUSA_STRICT_ONCHAIN_OWNERSHIP === "true" ||
      cards.some((card) => Boolean(card.mintAddress));

    if (user?.walletAddress && hasOnChainRegistry) {
      const verified = await getVerifiedWalletCards({
        userId,
        walletAddress: user.walletAddress,
        bypassCache: options?.bypassCache,
      });
      return verified.map((item) => ({
        card: item.card,
        quantity: item.quantity,
        walletQuantity: item.walletQuantity,
        inVaultQuantity: item.inVaultQuantity,
        tokenStandard: item.tokenStandard,
        mintOrAssetAddresses: item.mintOrAssetAddresses,
      }));
    }

    const owned = await prisma.userCard.findMany({ where: { userId, quantity: { gt: 0 } } });
    return owned.flatMap((item) => {
      const card = cardsById.get(item.cardId);
      return card ? [{ card, quantity: item.quantity }] : [];
    });
  }

  const store = getEmbeddedStore();
  return store.userCards
    .filter((item) => item.userId === userId)
    .filter((item) => item.quantity > 0)
    .flatMap((item) => {
      const card = cardsById.get(item.cardId);
      return card ? [{ card, quantity: item.quantity }] : [];
    });
}

export async function grantOwnedCards(
  userId: string,
  cardSlugs: string[],
  source: string,
  tx?: PrismaTypes.TransactionClient
): Promise<void> {
  const quantityBySlug = new Map<string, number>();
  for (const slug of cardSlugs) {
    quantityBySlug.set(slug, (quantityBySlug.get(slug) ?? 0) + 1);
  }
  const requestedSlugs = [...quantityBySlug.keys()];
  if (isPrismaDriverEnabled()) {
    const db = tx ?? (prisma as unknown as PrismaTypes.TransactionClient);
    const cards = await db.card.findMany({
      where: { slug: { in: requestedSlugs }, publicationStatus: "ACTIVE" },
      select: { id: true, slug: true },
    });
    if (cards.length === 0) return;
    const idempotencyKey = `grant:${source}`;
    if (await db.cardLedgerTransaction.findUnique({ where: { idempotencyKey } })) {
      return;
    }
    const transactionId = randomUUID();
    await db.cardLedgerTransaction.create({
      data: {
        id: transactionId,
        idempotencyKey,
        type: "CARD_GRANT",
        referenceId: source,
        actorUserId: userId,
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
    for (const card of cards) {
      const quantity = quantityBySlug.get(card.slug) ?? 0;
      entries.push(
        {
          id: randomUUID(), transactionId, cardId: card.id,
          accountType: "SYSTEM", accountId: "CARD_ISSUANCE", quantity: -quantity,
        },
        {
          id: randomUUID(), transactionId, cardId: card.id,
          accountType: "USER", accountId: userId, quantity,
        }
      );
    }

    const now = new Date();
    const userCardValues = cards.map((card) => {
      const quantity = quantityBySlug.get(card.slug) ?? 0;
      return Prisma.sql`(
        ${randomUUID()}, ${userId}, ${card.id}, ${quantity}, ${source}, ${now}, ${now}
      )`;
    });
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "user_cards" (
        "id", "userId", "cardId", "quantity", "source", "createdAt", "updatedAt"
      )
      VALUES ${Prisma.join(userCardValues)}
      ON CONFLICT ("userId", "cardId") DO UPDATE SET
        "quantity" = "user_cards"."quantity" + EXCLUDED."quantity",
        "source" = EXCLUDED."source",
        "updatedAt" = EXCLUDED."updatedAt"
    `);
    await db.cardLedgerEntry.createMany({ data: entries });
    return;
  }

  const store = getEmbeddedStore();
  const now = new Date().toISOString();
  const cardIds = new Map(
    store.cards
      .filter((card) => quantityBySlug.has(card.slug) && card.publicationStatus === "ACTIVE")
      .map((card) => [card.slug, card.id])
  );
  for (const [slug, quantity] of quantityBySlug) {
    const cardId = cardIds.get(slug);
    if (!cardId) continue;
    const existing = store.userCards.find(
      (item) => item.userId === userId && item.cardId === cardId
    );
    if (existing) {
      existing.quantity += quantity;
      existing.source = source;
    } else {
      const record: StoredUserCardRecord = {
        id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        cardId,
        quantity,
        source,
        createdAt: now,
      };
      store.userCards.push(record);
    }
  }
  persistEmbeddedStore(store);
}
