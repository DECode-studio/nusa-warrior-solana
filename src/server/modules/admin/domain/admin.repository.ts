import "server-only";
import type {
  ApprovalStatusValue,
  PublicationStatusValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";
import type { UserRoleValue } from "@/server/shared/auth/session";
import type {
  StoredCardRecord,
  StoredCorrectionReportRecord,
} from "@/server/shared/db/embedded-store";
import type { EnrichedDeckDto } from "@/server/modules/deck/domain/deck.repository";

export interface AdminUserSummaryRecord {
  id: string;
  walletAddress: string | null;
  name: string;
  role: UserRoleValue;
  createdAt: string;
}

export interface AdminUserDetailRecord {
  user: AdminUserSummaryRecord;
  ownedCards: Array<{ card: StoredCardRecord; quantity: number }>;
  decks: EnrichedDeckDto[];
}

export interface UpdateAdminUserRoleInput {
  userId: string;
  role: UserRoleValue;
}

export interface UpdateCardCurationInput {
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

export interface UpdateReportStatusInput {
  reportId: string;
  status: "OPEN" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
}

export interface AdminCardQueryFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminUserQueryFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminRepository {
  listAllCardsForAdmin(): Promise<StoredCardRecord[]>;
  listPaginatedCardsForAdmin(filter: AdminCardQueryFilter): Promise<{
    items: StoredCardRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  updateCardCuration(input: UpdateCardCurationInput): Promise<StoredCardRecord>;
  listAllReports(): Promise<StoredCorrectionReportRecord[]>;
  updateReportStatus(
    input: UpdateReportStatusInput
  ): Promise<StoredCorrectionReportRecord>;
  listAllUsers(): Promise<AdminUserSummaryRecord[]>;
  listPaginatedUsers(filter: AdminUserQueryFilter): Promise<{
    items: AdminUserSummaryRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getUserDetail(userId: string): Promise<AdminUserDetailRecord>;
  updateUserRole(
    input: UpdateAdminUserRoleInput
  ): Promise<AdminUserSummaryRecord>;
}
