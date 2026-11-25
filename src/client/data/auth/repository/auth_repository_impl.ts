import { inject, injectable } from "@needle-di/core";
import type {
  AdminUserRecordEntity,
  AdminUserDetailEntity,
  LoginCredentialsRequest,
  SolanaNonceResponse,
  SolanaRegisterRequest,
  SolanaVerifyRequest,
  SolanaVerifyResultEntity,
  UpdateAdminUserRoleRequest,
  UpdateCardCurationRequest,
  UpdateReportStatusRequest,
  UserEntity,
} from "@/client/domain/auth/entity/user_entity";
import type { AuthRepository } from "@/client/domain/auth/repository/auth_repository";
import type {
  CardEntity,
  CorrectionReportEntity,
  PaginatedResult,
} from "@/client/domain/card/entity/card_entity";
import {
  mapCardModelToEntity,
  mapCorrectionReportModelToEntity,
} from "@/client/data/card/model/card_model";
import { AuthRemoteDataSource } from "../datasource/auth_remote_datasource";
import {
  mapAdminUserModelToEntity,
  mapUserModelToEntity,
} from "../model/auth_model";
import { mapDeckModelToEntity } from "@/client/data/deck/model/deck_model";

@injectable()
export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly remoteDataSource: AuthRemoteDataSource = inject(
      AuthRemoteDataSource
    )
  ) {}

  public async getCurrentUser(): Promise<UserEntity | null> {
    const model = await this.remoteDataSource.getCurrentUser();
    if (!model) return null;
    return mapUserModelToEntity(model);
  }

  public async requestSolanaNonce(
    walletAddress: string
  ): Promise<SolanaNonceResponse> {
    return this.remoteDataSource.requestSolanaNonce(walletAddress);
  }

  public async verifySolanaSignature(
    request: SolanaVerifyRequest
  ): Promise<SolanaVerifyResultEntity> {
    const res = await this.remoteDataSource.verifySolanaSignature(request);
    if (res.status === "NEEDS_NICKNAME") {
      return res;
    }
    return {
      status: "AUTHENTICATED",
      user: mapUserModelToEntity(res.user),
    };
  }

  public async completeSolanaRegistration(
    request: SolanaRegisterRequest
  ): Promise<UserEntity> {
    const res = await this.remoteDataSource.completeSolanaRegistration(request);
    return mapUserModelToEntity(res.user);
  }

  public async loginWithCredentials(
    request: LoginCredentialsRequest
  ): Promise<UserEntity> {
    const model = await this.remoteDataSource.loginWithCredentials(request);
    return mapUserModelToEntity(model);
  }

  public async logout(): Promise<void> {
    await this.remoteDataSource.logout();
  }

  public async getAdminCards(): Promise<CardEntity[]> {
    const models = await this.remoteDataSource.getAdminCards();
    return models.map(mapCardModelToEntity);
  }

  public async getAdminCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<CardEntity>> {
    const res = await this.remoteDataSource.getAdminCardsPaginated(filter);
    return {
      ...res,
      items: res.items.map(mapCardModelToEntity),
    };
  }

  public async updateCardCuration(
    request: UpdateCardCurationRequest
  ): Promise<CardEntity> {
    const model = await this.remoteDataSource.updateCardCuration(request);
    return mapCardModelToEntity(model);
  }

  public async getAdminReports(): Promise<CorrectionReportEntity[]> {
    const models = await this.remoteDataSource.getAdminReports();
    return models.map(mapCorrectionReportModelToEntity);
  }

  public async updateReportStatus(
    request: UpdateReportStatusRequest
  ): Promise<CorrectionReportEntity> {
    const model = await this.remoteDataSource.updateReportStatus(request);
    return mapCorrectionReportModelToEntity(model);
  }

  public async getAdminUsers(): Promise<AdminUserRecordEntity[]> {
    const models = await this.remoteDataSource.getAdminUsers();
    return models.map(mapAdminUserModelToEntity);
  }

  public async getAdminUsersPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<AdminUserRecordEntity>> {
    const res = await this.remoteDataSource.getAdminUsersPaginated(filter);
    return {
      ...res,
      items: res.items.map(mapAdminUserModelToEntity),
    };
  }

  public async getAdminUserDetail(userId: string): Promise<AdminUserDetailEntity> {
    const detail = await this.remoteDataSource.getAdminUserDetail(userId);
    return {
      user: mapAdminUserModelToEntity(detail.user),
      ownedCards: detail.ownedCards.map((item) => ({
        ...mapCardModelToEntity(item),
        quantity: item.quantity,
      })),
      decks: detail.decks.map(mapDeckModelToEntity),
    };
  }

  public async updateAdminUserRole(
    request: UpdateAdminUserRoleRequest
  ): Promise<AdminUserRecordEntity> {
    const model = await this.remoteDataSource.updateAdminUserRole(request);
    return mapAdminUserModelToEntity(model);
  }
}
