import type {
  CardEntity,
  CorrectionReportEntity,
  PaginatedResult,
} from "@/client/domain/card/entity/card_entity";
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
} from "../entity/user_entity";

export interface AuthRepository {
  getCurrentUser(): Promise<UserEntity | null>;
  requestSolanaNonce(walletAddress: string): Promise<SolanaNonceResponse>;
  verifySolanaSignature(
    request: SolanaVerifyRequest
  ): Promise<SolanaVerifyResultEntity>;
  completeSolanaRegistration(
    request: SolanaRegisterRequest
  ): Promise<UserEntity>;
  loginWithCredentials(request: LoginCredentialsRequest): Promise<UserEntity>;
  logout(): Promise<void>;
  getAdminCards(): Promise<CardEntity[]>;
  getAdminCardsPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<CardEntity>>;
  updateCardCuration(request: UpdateCardCurationRequest): Promise<CardEntity>;
  getAdminReports(): Promise<CorrectionReportEntity[]>;
  updateReportStatus(
    request: UpdateReportStatusRequest
  ): Promise<CorrectionReportEntity>;
  getAdminUsers(): Promise<AdminUserRecordEntity[]>;
  getAdminUsersPaginated(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<AdminUserRecordEntity>>;
  getAdminUserDetail(userId: string): Promise<AdminUserDetailEntity>;
  updateAdminUserRole(
    request: UpdateAdminUserRoleRequest
  ): Promise<AdminUserRecordEntity>;
}
