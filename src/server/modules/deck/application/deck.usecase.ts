import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import type {
  CreateDeckInput,
  EnrichedDeckDto,
} from "../domain/deck.repository";
import { deckRepository } from "../infrastructure/deck.repository.impl";
import { listOwnedCards } from "@/server/modules/collection/infrastructure/collection.repository";

async function validateDeckInput(input: CreateDeckInput): Promise<void> {
  if (input.characterSlugs.length === 0 || input.characterSlugs.length > 10) {
    throw AppError.validation(
      "Deck wajib memiliki maksimal 10 kartu Karakter (minimal 1).",
      { characterSlugs: ["Jumlah kartu Karakter harus antara 1 hingga 10."] },
    );
  }

  if (input.instrumentSlugs.length > 10) {
    throw AppError.validation(
      "Deck maksimal memiliki 10 kartu Waditra (Instrumen).",
      { instrumentSlugs: ["Jumlah kartu Waditra maksimal 10."] },
    );
  }

  if (input.characterSlugs.length + input.instrumentSlugs.length > 20) {
    throw AppError.validation(
      "Total kartu dalam satu deck maksimal 20 kartu.",
      { total: ["Total kartu Karakter dan Instrumen tidak boleh melebihi 20."] },
    );
  }

  const activeCards = await cardRepository.findMany({ includeWithdrawn: false });
  const bySlug = new Map(activeCards.map((card) => [card.slug, card]));
  for (const slug of input.characterSlugs) {
    const found = bySlug.get(slug);
    if (!found || found.cardType !== "CHARACTER") {
      throw AppError.validation(`Kartu karakter '${slug}' tidak aktif atau tidak ditemukan.`);
    }
  }
  for (const slug of input.instrumentSlugs) {
    const found = bySlug.get(slug);
    if (!found || found.cardType !== "INSTRUMENT") {
      throw AppError.validation(`Kartu instrumen '${slug}' tidak aktif atau tidak ditemukan.`);
    }
  }

  if (input.userId) {
    const ownedQuantities = new Map(
      (await listOwnedCards(input.userId)).map(({ card, quantity }) => [card.slug, quantity]),
    );
    const requestedQuantities = new Map<string, number>();
    for (const slug of [...input.characterSlugs, ...input.instrumentSlugs]) {
      requestedQuantities.set(slug, (requestedQuantities.get(slug) ?? 0) + 1);
    }
    const exceedsOwnership = [...requestedQuantities].some(([slug, requested]) =>
      requested > (ownedQuantities.get(slug) ?? 0),
    );
    if (exceedsOwnership) {
      throw AppError.forbidden("Deck tidak dapat memakai salinan kartu melebihi jumlah yang dimiliki akun.");
    }
  }
}

export async function listDecksUseCase(
  userId: string | null
): Promise<EnrichedDeckDto[]> {
  const decks = await deckRepository.listDecks(userId);
  if (!userId) return decks.filter((deck) => deck.isPreset);
  const accountDecks = decks.filter((deck) => !deck.isPreset && deck.userId === userId);
  const ownedCards = await listOwnedCards(userId);
  const ownedQuantities = new Map(ownedCards.map(({ card, quantity }) => [card.slug, quantity]));
  const retainOwnedCopies = (slugs: string[], available: Map<string, number>): string[] =>
    slugs.filter((slug) => {
      const remaining = available.get(slug) ?? 0;
      if (remaining <= 0) return false;
      available.set(slug, remaining - 1);
      return true;
    });
  const playableDecks = accountDecks.map((deck) => {
    const available = new Map(ownedQuantities);
    return {
      ...deck,
      characterSlugs: retainOwnedCopies(deck.characterSlugs, available),
      instrumentSlugs: retainOwnedCopies(deck.instrumentSlugs, available),
    };
  }).filter((deck) => deck.characterSlugs.length > 0);
  if (playableDecks.length > 0) return playableDecks;

  const getRecoveryCopies = (cardType: "CHARACTER" | "INSTRUMENT"): string[] => {
    const copies: string[] = [];
    for (const { card, quantity } of ownedCards) {
      if (card.cardType !== cardType) continue;
      for (let count = 0; count < quantity && copies.length < 10; count += 1) {
        copies.push(card.slug);
      }
      if (copies.length >= 10) break;
    }
    return copies;
  };
  const recoveryCharacters = getRecoveryCopies("CHARACTER");
  if (recoveryCharacters.length === 0) return [];
  return [{
    id: `recovery-${userId}`,
    name: "Deck Pemulihan",
    description: "Deck sementara dari karakter yang masih Anda miliki.",
    kingdomFilter: "MIXED",
    isPreset: false,
    isTemporary: true,
    userId,
    characterSlugs: recoveryCharacters,
    instrumentSlugs: getRecoveryCopies("INSTRUMENT"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }];
}

export async function createDeckUseCase(
  input: CreateDeckInput
): Promise<EnrichedDeckDto> {
  await validateDeckInput(input);
  return deckRepository.createDeck(input);
}

export async function updateDeckUseCase(
  deckId: string,
  input: Omit<CreateDeckInput, "userId">,
  userId: string,
): Promise<EnrichedDeckDto> {
  const updateInput: CreateDeckInput = { ...input, userId };
  await validateDeckInput(updateInput);
  return deckRepository.updateDeck(deckId, updateInput);
}

export async function deleteDeckUseCase(deckId: string, userId: string): Promise<void> {
  await deckRepository.deleteDeck(deckId, userId);
}

