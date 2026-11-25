import { injectable } from "@needle-di/core";
import type {
  CardFilterQuery,
  CreateReportRequest,
  PaginatedResult,
} from "@/client/domain/card/entity/card_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type {
  CardApiModel,
  CorrectionReportApiModel,
} from "../model/card_model";

type OwnedCardsPaginatedApiResult = PaginatedResult<CardApiModel & { quantity: number; copyNumber: number }> & {
  totalOwnedQuantity: number;
};

@injectable()
export class CardRemoteDataSource {
  public async getCards(filter?: CardFilterQuery): Promise<CardApiModel[]> {
    return apiClient.get<CardApiModel[]>(API_ROUTES.CARDS.LIST, {
      cardType: filter?.cardType,
      kingdom: filter?.kingdom,
      role: filter?.role,
      verificationStatus: filter?.verificationStatus,
      publicationStatus: filter?.publicationStatus,
      includeWithdrawn: filter?.includeWithdrawn,
      search: filter?.search,
      page: filter?.page,
      limit: filter?.limit,
    });
  }

  public async getCardsPaginated(
    filter?: CardFilterQuery
  ): Promise<PaginatedResult<CardApiModel>> {
    return apiClient.get<PaginatedResult<CardApiModel>>(API_ROUTES.CARDS.LIST, {
      cardType: filter?.cardType,
      kingdom: filter?.kingdom,
      role: filter?.role,
      verificationStatus: filter?.verificationStatus,
      publicationStatus: filter?.publicationStatus,
      includeWithdrawn: filter?.includeWithdrawn,
      search: filter?.search,
      page: filter?.page ?? 1,
      limit: filter?.limit ?? 12,
    });
  }

  public async getCardBySlug(slug: string): Promise<CardApiModel> {
    return apiClient.get<CardApiModel>(API_ROUTES.CARDS.DETAIL(slug));
  }

  public async getOwnedCards(): Promise<Array<CardApiModel & { quantity: number }>> {
    return apiClient.get<Array<CardApiModel & { quantity: number }>>(
      API_ROUTES.COLLECTION.list
    );
  }

  public async getOwnedCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    cardType?: string;
    kingdom?: string;
  }): Promise<OwnedCardsPaginatedApiResult> {
    return apiClient.get<OwnedCardsPaginatedApiResult>(
      API_ROUTES.COLLECTION.list,
      {
        page: filter?.page ?? 1,
        limit: filter?.limit ?? 12,
        cardType: filter?.cardType,
        kingdom: filter?.kingdom,
      }
    );
  }

  public async submitCorrectionReport(
    request: CreateReportRequest
  ): Promise<CorrectionReportApiModel> {
    return apiClient.post<
      CorrectionReportApiModel,
      Omit<CreateReportRequest, "cardSlug">
    >(API_ROUTES.CARDS.REPORTS(request.cardSlug), {
      reporterName: request.reporterName,
      reporterEmail: request.reporterEmail,
      category: request.category,
      description: request.description,
      referenceUrl: request.referenceUrl,
    });
  }
}

