import { inject, injectable } from "@needle-di/core";
import { CARD_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type {
  CardEntity,
  CardFilterQuery,
  CorrectionReportEntity,
  CreateReportRequest,
  OwnedCardEntity,
  OwnedCardsPaginatedResult,
  PaginatedResult,
} from "../entity/card_entity";
import type { CardRepository } from "../repository/card_repository";

@injectable()
export class CardUseCase {
  constructor(
    private readonly cardRepository: CardRepository = inject(
      CARD_REPOSITORY_TOKEN
    )
  ) {}

  public async getCards(filter?: CardFilterQuery): Promise<CardEntity[]> {
    return this.cardRepository.getCards(filter);
  }

  public async getCardsPaginated(
    filter?: CardFilterQuery
  ): Promise<PaginatedResult<CardEntity>> {
    return this.cardRepository.getCardsPaginated(filter);
  }

  public async getOwnedCards(): Promise<OwnedCardEntity[]> {
    return this.cardRepository.getOwnedCards();
  }

  public async getOwnedCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    cardType?: string;
    kingdom?: string;
  }): Promise<OwnedCardsPaginatedResult> {
    return this.cardRepository.getOwnedCardsPaginated(filter);
  }

  public async getCardBySlug(slug: string): Promise<CardEntity> {
    return this.cardRepository.getCardBySlug(slug);
  }

  public async submitCorrectionReport(
    request: CreateReportRequest
  ): Promise<CorrectionReportEntity> {
    return this.cardRepository.submitCorrectionReport(request);
  }
}

