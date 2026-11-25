import "server-only";
import type {
  CardTypeValue,
  KingdomValue,
  PublicationStatusValue,
  RoleValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";
import type {
  StoredCardRecord,
  StoredCorrectionReportRecord,
} from "@/server/shared/db/embedded-store";

export interface CardQueryFilter {
  cardType?: CardTypeValue;
  kingdom?: KingdomValue;
  role?: RoleValue;
  verificationStatus?: VerificationStatusValue;
  publicationStatus?: PublicationStatusValue;
  includeWithdrawn?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCorrectionReportInput {
  cardSlug: string;
  reporterName: string;
  reporterEmail: string | null;
  category: string;
  description: string;
  referenceUrl: string | null;
}

export interface CardRepository {
  findMany(filter?: CardQueryFilter): Promise<StoredCardRecord[]>;
  findPaginated(filter: CardQueryFilter): Promise<{
    items: StoredCardRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findBySlug(slug: string): Promise<StoredCardRecord | null>;
  createCorrectionReport(
    input: CreateCorrectionReportInput
  ): Promise<StoredCorrectionReportRecord>;
}

