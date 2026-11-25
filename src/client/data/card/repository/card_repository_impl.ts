import { inject, injectable } from "@needle-di/core";
import type {
  CardEntity,
  CardFilterQuery,
  CorrectionReportEntity,
  CreateReportRequest,
  OwnedCardEntity,
  OwnedCardsPaginatedResult,
  PaginatedResult,
} from "@/client/domain/card/entity/card_entity";
import type { CardRepository } from "@/client/domain/card/repository/card_repository";
import { CardRemoteDataSource } from "../datasource/card_remote_datasource";
import {
  mapCardModelToEntity,
  mapCorrectionReportModelToEntity,
} from "../model/card_model";

@injectable()
export class CardRepositoryImpl implements CardRepository {
  constructor(
    private readonly remoteDataSource: CardRemoteDataSource = inject(
      CardRemoteDataSource
    )
  ) {}

  public async getCards(filter?: CardFilterQuery): Promise<CardEntity[]> {
    const models = await this.remoteDataSource.getCards(filter);
    return models.map(mapCardModelToEntity);
  }

  public async getCardsPaginated(
    filter?: CardFilterQuery
  ): Promise<PaginatedResult<CardEntity>> {
    const res = await this.remoteDataSource.getCardsPaginated(filter);
    return {
      ...res,
      items: res.items.map(mapCardModelToEntity),
    };
  }

  public async getOwnedCards(): Promise<OwnedCardEntity[]> {
    const models = await this.remoteDataSource.getOwnedCards();
    return models.map(({ quantity, ...model }) => ({
      ...mapCardModelToEntity(model),
      quantity,
    }));
  }

  public async getOwnedCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    cardType?: string;
    kingdom?: string;
  }): Promise<OwnedCardsPaginatedResult> {
    const res = await this.remoteDataSource.getOwnedCardsPaginated(filter);
    return {
      ...res,
      items: res.items.map(({ quantity, copyNumber, ...model }) => ({
        ...mapCardModelToEntity(model),
        quantity,
        copyNumber,
      })),
    };
  }

  public async getCardBySlug(slug: string): Promise<CardEntity> {
    const model = await this.remoteDataSource.getCardBySlug(slug);
    return mapCardModelToEntity(model);
  }

  public async submitCorrectionReport(
    request: CreateReportRequest
  ): Promise<CorrectionReportEntity> {
    const model = await this.remoteDataSource.submitCorrectionReport(request);
    return mapCorrectionReportModelToEntity(model);
  }
}

