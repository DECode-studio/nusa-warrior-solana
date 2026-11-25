import type {
  ApprovalStatusValue,
  PublicationStatusValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";
import type {
  CorrectionReportStatus,
  OwnedCardEntity,
} from "@/client/domain/card/entity/card_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";

export type UserRole = "PLAYER" | "CURATOR" | "ADMIN";
export type UserRoleValue = UserRole;

export interface UserEntity {
  userId: string;
  walletAddress: string | null;
  name: string;
  role: UserRole;
  hasClaimedStarterPack?: boolean;
  avatarUrl?: string | null;
  nusaPoints?: number;
}

export interface AdminUserRecordEntity {
  id: string;
  walletAddress: string | null;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AdminUserDetailEntity {
  user: AdminUserRecordEntity;
  ownedCards: OwnedCardEntity[];
  decks: DeckEntity[];
}

export interface LoginCredentialsRequest {
  mode: "ADMIN";
  username?: string;
  password?: string;
}

export interface UpdateAdminUserRoleRequest {
  userId: string;
  role: UserRole;
}

export interface SolanaNonceResponse {
  walletAddress: string;
  nonce: string;
  message: string;
}

export interface SolanaVerifyRequest {
  walletAddress: string;
  signature: string;
}

export type SolanaVerifyResultEntity =
  | {
      status: "AUTHENTICATED";
      user: UserEntity;
    }
  | {
      status: "NEEDS_NICKNAME";
      walletAddress: string;
    };

export interface SolanaRegisterRequest {
  nickname: string;
}

export interface UpdateCardCurationRequest {
  cardSlug: string;
  verificationStatus?: VerificationStatusValue;
  publicationStatus?: PublicationStatusValue;
  sourceCitation?: string;
  sourceUrl?: string | null;
  creator?: string;
  licenseType?: string;
  approvalStatus?: ApprovalStatusValue;
  historicalSummaryId?: string;
  historicalSummaryEn?: string;
  historicalSummaryZh?: string;
  effectName?: string | null;
  effectDescriptionId?: string | null;
  effectDescriptionEn?: string | null;
  effectDescriptionZh?: string | null;
}

export interface UpdateReportStatusRequest {
  reportId: string;
  status: CorrectionReportStatus;
  resolutionNote: string | null;
}
