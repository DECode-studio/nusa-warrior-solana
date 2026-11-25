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
  email: string;
  name: string;
  role: UserRole;
  isGuest?: boolean;
  hasClaimedStarterPack?: boolean;
  avatarUrl?: string | null;
  nusaPoints?: number;
}

export interface AdminUserRecordEntity {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isGuest?: boolean;
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

export interface GoogleSsoConfigEntity {
  provider: "GOOGLE_SSO";
  loginUrl: string;
  callbackUrl: string;
  isConfigured: boolean;
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
