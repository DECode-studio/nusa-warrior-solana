import { injectable } from "@needle-di/core";
import type {
  GoogleSsoConfigEntity,
  LoginCredentialsRequest,
  UpdateAdminUserRoleRequest,
  UpdateCardCurationRequest,
  UpdateReportStatusRequest,
} from "@/client/domain/auth/entity/user_entity";
import type {
  CardApiModel,
  CorrectionReportApiModel,
} from "@/client/data/card/model/card_model";
import type { PaginatedResult } from "@/client/domain/card/entity/card_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { apiClient } from "@/core/http-client/api-client";
import type { AdminUserApiModel, UserApiModel } from "../model/auth_model";
import type { DeckApiModel } from "@/client/data/deck/model/deck_model";

export interface AdminUserDetailApiModel {
  user: AdminUserApiModel;
  ownedCards: Array<CardApiModel & { quantity: number }>;
  decks: DeckApiModel[];
}

@injectable()
export class AuthRemoteDataSource {
  public async getCurrentUser(): Promise<UserApiModel | null> {
    return apiClient.get<UserApiModel | null>(API_ROUTES.AUTH.ME);
  }

  public async getGoogleSsoConfig(): Promise<GoogleSsoConfigEntity> {
    return apiClient.get<GoogleSsoConfigEntity>(API_ROUTES.AUTH.LOGIN);
  }

  public async loginAsGuest(): Promise<UserApiModel> {
    return apiClient.post<UserApiModel>(API_ROUTES.AUTH.GUEST);
  }

  public async loginWithCredentials(
    request: LoginCredentialsRequest
  ): Promise<UserApiModel> {
    return apiClient.post<UserApiModel, LoginCredentialsRequest>(
      API_ROUTES.AUTH.LOGIN,
      request
    );
  }

  public async logout(): Promise<void> {
    await apiClient.post<{ loggedOut: boolean }>(API_ROUTES.AUTH.LOGOUT);
  }

  public async getAdminCards(): Promise<CardApiModel[]> {
    return apiClient.get<CardApiModel[]>(API_ROUTES.ADMIN.CARDS);
  }

  public async getAdminCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<CardApiModel>> {
    return apiClient.get<PaginatedResult<CardApiModel>>(API_ROUTES.ADMIN.CARDS, {
      page: filter?.page ?? 1,
      limit: filter?.limit ?? 10,
      search: filter?.search,
    });
  }

  public async updateCardCuration(
    request: UpdateCardCurationRequest
  ): Promise<CardApiModel> {
    return apiClient.patch<CardApiModel, UpdateCardCurationRequest>(
      API_ROUTES.ADMIN.CARDS,
      request
    );
  }

  public async getAdminReports(): Promise<CorrectionReportApiModel[]> {
    return apiClient.get<CorrectionReportApiModel[]>(API_ROUTES.ADMIN.REPORTS);
  }

  public async updateReportStatus(
    request: UpdateReportStatusRequest
  ): Promise<CorrectionReportApiModel> {
    return apiClient.patch<
      CorrectionReportApiModel,
      UpdateReportStatusRequest
    >(API_ROUTES.ADMIN.REPORTS, request);
  }

  public async getAdminUsers(): Promise<AdminUserApiModel[]> {
    return apiClient.get<AdminUserApiModel[]>(API_ROUTES.ADMIN.USERS);
  }

  public async getAdminUsersPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<AdminUserApiModel>> {
    return apiClient.get<PaginatedResult<AdminUserApiModel>>(API_ROUTES.ADMIN.USERS, {
      page: filter?.page ?? 1,
      limit: filter?.limit ?? 10,
      search: filter?.search,
    });
  }

  public async getAdminUserDetail(userId: string): Promise<AdminUserDetailApiModel> {
    return apiClient.get<AdminUserDetailApiModel>(`${API_ROUTES.ADMIN.USERS}/${encodeURIComponent(userId)}`);
  }

  public async updateAdminUserRole(
    request: UpdateAdminUserRoleRequest
  ): Promise<AdminUserApiModel> {
    return apiClient.patch<AdminUserApiModel, UpdateAdminUserRoleRequest>(
      API_ROUTES.ADMIN.USERS,
      request
    );
  }
}
