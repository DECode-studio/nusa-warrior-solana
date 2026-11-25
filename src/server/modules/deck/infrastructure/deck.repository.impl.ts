import "server-only";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredDeckCardRecord,
  type StoredDeckRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import type {
  CreateDeckInput,
  DeckRepository,
  EnrichedDeckDto,
} from "../domain/deck.repository";
import {
  assertBattleDataUnlocked,
  assertEmbeddedBattleDataUnlocked,
} from "@/server/modules/battle/infrastructure/battle-integrity.guard";

export class DeckRepositoryImpl implements DeckRepository {
  public async listDecks(userId: string | null): Promise<EnrichedDeckDto[]> {
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.deck.findMany({
        where: userId
          ? { OR: [{ isPreset: true }, { userId }] }
          : { OR: [{ isPreset: true }, { userId: null }] },
        include: {
          cards: {
            include: { card: true },
          },
        },
        orderBy: [{ isPreset: "desc" }, { createdAt: "desc" }],
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        kingdomFilter: "MIXED",
        isPreset: row.isPreset,
        userId: row.userId,
        characterSlugs: row.cards
          .filter((dc) => dc.card.cardType === "CHARACTER")
          .flatMap((dc) => Array.from({ length: dc.quantity }, () => dc.card.slug)),
        instrumentSlugs: row.cards
          .filter((dc) => dc.card.cardType === "INSTRUMENT")
          .flatMap((dc) => Array.from({ length: dc.quantity }, () => dc.card.slug)),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
    }

    const store = getEmbeddedStore();
    const cardById = new Map(store.cards.map((c) => [c.id, c]));

    return store.decks
      .filter((deck) => deck.isPreset || deck.userId === userId)
      .map((deck) => {
        const sortedCards = [...deck.cards].sort(
          (a, b) => a.position - b.position
        );
        const characterSlugs: string[] = [];
        const instrumentSlugs: string[] = [];

        for (const dc of sortedCards) {
          const card = cardById.get(dc.cardId);
          if (!card) continue;
          if (dc.slotType === "CHARACTER") {
            characterSlugs.push(card.slug);
          } else {
            instrumentSlugs.push(card.slug);
          }
        }

        return {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          kingdomFilter: deck.kingdomFilter,
          isPreset: deck.isPreset,
          userId: deck.userId,
          characterSlugs,
          instrumentSlugs,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        };
      });
  }

  public async createDeck(input: CreateDeckInput): Promise<EnrichedDeckDto> {
    if (isPrismaDriverEnabled()) {
      const allSlugs = [...input.characterSlugs, ...input.instrumentSlugs];
      const dbCards = await prisma.card.findMany({
        where: { slug: { in: allSlugs } },
      });
      const bySlug = new Map(dbCards.map((c) => [c.slug, c]));

      const createSlots: Array<{
        cardId: string;
        quantity: number;
      }> = [];

      const quantityBySlug = new Map<string, number>();
      for (const slug of allSlugs) {
        quantityBySlug.set(slug, (quantityBySlug.get(slug) ?? 0) + 1);
      }

      for (const [slug, quantity] of quantityBySlug) {
        const c = bySlug.get(slug);
        if (c) {
          createSlots.push({
            cardId: c.id,
            quantity,
          });
        }
      }

      const created = await prisma.$transaction(async (tx) => {
        if (input.userId) await assertBattleDataUnlocked(tx, [input.userId]);
        return tx.deck.create({
          data: {
            name: input.name,
            description: input.description ?? "",
            isPreset: false,
            userId: input.userId,
            cards: {
              create: createSlots,
            },
          },
        });
      });

      return {
        id: created.id,
        name: created.name,
        description: created.description,
        kingdomFilter: input.kingdomFilter,
        isPreset: false,
        userId: created.userId,
        characterSlugs: [...input.characterSlugs],
        instrumentSlugs: [...input.instrumentSlugs],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    const store = getEmbeddedStore();
    if (input.userId) assertEmbeddedBattleDataUnlocked([input.userId]);
    const nowIso = new Date().toISOString();
    const deckId = `dck-custom-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const cardBySlug = new Map(store.cards.map((c) => [c.slug, c]));

    const deckCards: StoredDeckCardRecord[] = [];
    input.characterSlugs.forEach((slug, idx) => {
      const card = cardBySlug.get(slug);
      if (card) {
        deckCards.push({
          id: `${deckId}-char-${idx + 1}`,
          deckId,
          cardId: card.id,
          slotType: "CHARACTER",
          position: idx,
        });
      }
    });

    input.instrumentSlugs.forEach((slug, idx) => {
      const card = cardBySlug.get(slug);
      if (card) {
        deckCards.push({
          id: `${deckId}-inst-${idx + 1}`,
          deckId,
          cardId: card.id,
          slotType: "INSTRUMENT",
          position: idx,
        });
      }
    });

    const newDeck: StoredDeckRecord = {
      id: deckId,
      name: input.name,
      description: input.description,
      kingdomFilter: input.kingdomFilter,
      isPreset: false,
      userId: input.userId,
      cards: deckCards,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.decks.unshift(newDeck);
    persistEmbeddedStore(store);

    return {
      id: newDeck.id,
      name: newDeck.name,
      description: newDeck.description,
      kingdomFilter: newDeck.kingdomFilter,
      isPreset: newDeck.isPreset,
      userId: newDeck.userId,
      characterSlugs: [...input.characterSlugs],
      instrumentSlugs: [...input.instrumentSlugs],
      createdAt: newDeck.createdAt,
      updatedAt: newDeck.updatedAt,
    };
  }

  public async updateDeck(deckId: string, input: CreateDeckInput): Promise<EnrichedDeckDto> {
    if (!input.userId) throw AppError.forbidden("Deck hanya dapat diperbarui oleh pemilik akun.");

    if (isPrismaDriverEnabled()) {
      const allSlugs = [...input.characterSlugs, ...input.instrumentSlugs];
      const dbCards = await prisma.card.findMany({ where: { slug: { in: allSlugs } } });
      const bySlug = new Map(dbCards.map((card) => [card.slug, card]));
      const quantityBySlug = new Map<string, number>();
      for (const slug of allSlugs) {
        quantityBySlug.set(slug, (quantityBySlug.get(slug) ?? 0) + 1);
      }
      const deckCards = [...quantityBySlug].flatMap(([slug, quantity]) => {
        const card = bySlug.get(slug);
        return card ? [{ cardId: card.id, quantity }] : [];
      });

      const updated = await prisma.$transaction(async (tx) => {
        await assertBattleDataUnlocked(tx, [input.userId!]);
        const existing = await tx.deck.findUnique({ where: { id: deckId } });
        if (!existing) throw AppError.notFound("Deck tidak ditemukan.");
        if (existing.isPreset || existing.userId !== input.userId) {
          throw AppError.forbidden("Deck ini tidak dapat diperbarui oleh akun Anda.");
        }
        await tx.deckCard.deleteMany({ where: { deckId } });
        const row = await tx.deck.update({
          where: { id: deckId },
          data: {
            name: input.name,
            description: input.description ?? "",
          },
        });
        if (deckCards.length > 0) {
          await tx.deckCard.createMany({
            data: deckCards.map((card) => ({ ...card, deckId })),
          });
        }
        return row;
      });

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        kingdomFilter: input.kingdomFilter,
        isPreset: false,
        userId: updated.userId,
        characterSlugs: [...input.characterSlugs],
        instrumentSlugs: [...input.instrumentSlugs],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    const store = getEmbeddedStore();
    assertEmbeddedBattleDataUnlocked([input.userId]);
    const deck = store.decks.find((item) => item.id === deckId);
    if (!deck) throw AppError.notFound("Deck tidak ditemukan.");
    if (deck.isPreset || deck.userId !== input.userId) {
      throw AppError.forbidden("Deck ini tidak dapat diperbarui oleh akun Anda.");
    }
    const cardBySlug = new Map(store.cards.map((card) => [card.slug, card]));
    const deckCards: StoredDeckCardRecord[] = [];
    input.characterSlugs.forEach((slug, index) => {
      const card = cardBySlug.get(slug);
      if (card) deckCards.push({ id: `${deckId}-char-${index + 1}`, deckId, cardId: card.id, slotType: "CHARACTER", position: index });
    });
    input.instrumentSlugs.forEach((slug, index) => {
      const card = cardBySlug.get(slug);
      if (card) deckCards.push({ id: `${deckId}-inst-${index + 1}`, deckId, cardId: card.id, slotType: "INSTRUMENT", position: index });
    });
    deck.name = input.name;
    deck.description = input.description;
    deck.kingdomFilter = input.kingdomFilter;
    deck.cards = deckCards;
    deck.updatedAt = new Date().toISOString();
    persistEmbeddedStore(store);

    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      kingdomFilter: deck.kingdomFilter,
      isPreset: deck.isPreset,
      userId: deck.userId,
      characterSlugs: [...input.characterSlugs],
      instrumentSlugs: [...input.instrumentSlugs],
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    };
  }

  public async deleteDeck(deckId: string, userId: string): Promise<void> {
    if (isPrismaDriverEnabled()) {
      await prisma.$transaction(async (tx) => {
        await assertBattleDataUnlocked(tx, [userId]);
        const deck = await tx.deck.findUnique({ where: { id: deckId } });
        if (!deck) {
          throw AppError.notFound("Deck tidak ditemukan.");
        }
        if (deck.isPreset || deck.userId !== userId) {
          throw AppError.forbidden("Deck ini tidak dapat dihapus oleh akun Anda.");
        }
        await tx.deck.delete({ where: { id: deckId } });
      });
      return;
    }

    assertEmbeddedBattleDataUnlocked([userId]);
    const store = getEmbeddedStore();
    const index = store.decks.findIndex((d) => d.id === deckId && d.userId === userId);
    if (index === -1) {
      throw AppError.notFound("Deck tidak ditemukan atau bukan milik Anda.");
    }
    if (store.decks[index].isPreset) {
      throw AppError.forbidden("Deck bawaan (preset) tidak dapat dihapus.");
    }
    store.decks.splice(index, 1);
    persistEmbeddedStore(store);
  }
}

export const deckRepository: DeckRepository = new DeckRepositoryImpl();

