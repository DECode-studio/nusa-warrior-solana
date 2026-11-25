import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import type {
  StoredCardRecord,
  StoredCorrectionReportRecord,
} from "@/server/shared/db/embedded-store";
import type {
  CardQueryFilter,
  CreateCorrectionReportInput,
} from "../domain/card.repository";
import { cardRepository } from "../infrastructure/card.repository.impl";

export async function listCardsUseCase(
  filter: CardQueryFilter = {}
): Promise<StoredCardRecord[]> {
  return cardRepository.findMany(filter);
}

export async function listCardsPaginatedUseCase(
  filter: CardQueryFilter
): Promise<{
  items: StoredCardRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return cardRepository.findPaginated(filter);
}

export async function getCardDetailUseCase(
  slug: string
): Promise<StoredCardRecord> {
  const card = await cardRepository.findBySlug(slug);
  if (!card) {
    throw AppError.notFound(`Kartu dengan slug '${slug}' tidak ditemukan.`);
  }
  return card;
}

export async function createCardReportUseCase(
  input: CreateCorrectionReportInput
): Promise<StoredCorrectionReportRecord> {
  return cardRepository.createCorrectionReport(input);
}

