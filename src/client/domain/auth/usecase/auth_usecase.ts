import { inject, injectable } from "@needle-di/core";
import { AUTH_REPOSITORY_TOKEN } from "@/core/di/tokens";
import type {
  CardEntity,
  CorrectionReportEntity,
  PaginatedResult,
} from "@/client/domain/card/entity/card_entity";
import type {
  AdminUserRecordEntity,
  AdminUserDetailEntity,
  GoogleSsoConfigEntity,
  LoginCredentialsRequest,
  UpdateAdminUserRoleRequest,
  UpdateCardCurationRequest,
  UpdateReportStatusRequest,
  UserEntity,
} from "../entity/user_entity";
import type { AuthRepository } from "../repository/auth_repository";

@injectable()
export class AuthUseCase {
  constructor(
    private readonly authRepository: AuthRepository = inject(
      AUTH_REPOSITORY_TOKEN
    )
  ) {}

  public async getCurrentUser(): Promise<UserEntity | null> {
    return this.authRepository.getCurrentUser();
  }

  public async getGoogleSsoConfig(): Promise<GoogleSsoConfigEntity> {
    return this.authRepository.getGoogleSsoConfig();
  }

  public async loginAsGuest(): Promise<UserEntity> {
    return this.authRepository.loginAsGuest();
  }

  public async loginWithCredentials(
    request: LoginCredentialsRequest
  ): Promise<UserEntity> {
    return this.authRepository.loginWithCredentials(request);
  }

  public async logout(): Promise<void> {
    return this.authRepository.logout();
  }

  public async getAdminCards(): Promise<CardEntity[]> {
    return this.authRepository.getAdminCards();
  }

  public async getAdminCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<CardEntity>> {
    return this.authRepository.getAdminCardsPaginated(filter);
  }

  public async updateCardCuration(
    request: UpdateCardCurationRequest
  ): Promise<CardEntity> {
    return this.authRepository.updateCardCuration(request);
  }

  public async getAdminReports(): Promise<CorrectionReportEntity[]> {
    return this.authRepository.getAdminReports();
  }

  public async updateReportStatus(
    request: UpdateReportStatusRequest
  ): Promise<CorrectionReportEntity> {
    return this.authRepository.updateReportStatus(request);
  }

  public async getAdminUsers(): Promise<AdminUserRecordEntity[]> {
    return this.authRepository.getAdminUsers();
  }

  public async getAdminUsersPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<AdminUserRecordEntity>> {
    return this.authRepository.getAdminUsersPaginated(filter);
  }

  public async getAdminUserDetail(userId: string): Promise<AdminUserDetailEntity> {
    return this.authRepository.getAdminUserDetail(userId);
  }

  public async updateAdminUserRole(
    request: UpdateAdminUserRoleRequest
  ): Promise<AdminUserRecordEntity> {
    return this.authRepository.updateAdminUserRole(request);
  }
}
