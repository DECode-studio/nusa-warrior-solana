import type {
  CardEntity,
  CardFilterQuery,
  CorrectionReportEntity,
  CreateReportRequest,
  OwnedCardEntity,
  OwnedCardsPaginatedResult,
  PaginatedResult,
} from "../entity/card_entity";

export interface CardRepository {
  getCards(filter?: CardFilterQuery): Promise<CardEntity[]>;
  getCardsPaginated(
    filter?: CardFilterQuery
  ): Promise<PaginatedResult<CardEntity>>;
  getOwnedCards(): Promise<OwnedCardEntity[]>;
  getOwnedCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    cardType?: string;
    kingdom?: string;
  }): Promise<OwnedCardsPaginatedResult>;
  getCardBySlug(slug: string): Promise<CardEntity>;
  submitCorrectionReport(
    request: CreateReportRequest
  ): Promise<CorrectionReportEntity>;
}

