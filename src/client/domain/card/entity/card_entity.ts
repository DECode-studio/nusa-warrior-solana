import type {
  ApprovalStatusValue,
  CardTypeValue,
  EffectTypeValue,
  GenderValue,
  KingdomValue,
  PublicationStatusValue,
  RoleValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";

export interface CardAssetEntity {
  id: string;
  cardId: string;
  creator: string;
  rightsHolder: string;
  sourceOrigin: string;
  licenseType: string;
  commercialAllowed: boolean;
  creditText: string;
  approvalStatus: ApprovalStatusValue;
}

export interface CardEntity {
  id: string;
  code: string;
  slug: string;
  name: string;
  cardType: CardTypeValue;
  kingdom: KingdomValue;
  role: RoleValue;
  secondaryRoles: RoleValue[];
  gender: GenderValue;
  baseAttack: number;
  baseDefense: number;
  effectName: string | null;
  effectType: EffectTypeValue | null;
  effectDescriptionId: string | null;
  effectDescriptionEn: string | null;
  effectDescriptionZh: string | null;
  attackMod: number;
  strikeAttackBonus: number;
  defenseMod: number;
  enemyAttackMod: number;
  ignoreDefenseAmount: number;
  affinityRole: RoleValue | null;
  affinityGender: GenderValue;
  affinityBonusAtk: number;
  affinityBonusDef: number;
  historicalSummaryId: string;
  historicalSummaryEn: string;
  historicalSummaryZh: string;
  illustrationNote: string;
  sourceCitation: string;
  sourceUrl: string | null;
  verificationStatus: VerificationStatusValue;
  publicationStatus: PublicationStatusValue;
  isCustom?: boolean;
  customStatus?: string | null;
  rejectionReason?: string | null;
  imagePath: string;
  asset: CardAssetEntity | null;
}

export interface OwnedCardEntity extends CardEntity {
  quantity: number;
  copyNumber?: number;
}

export type CorrectionCategory =
  | "HISTORICAL_SOURCE"
  | "VISUAL_INTERPRETATION"
  | "TERMINOLOGY_TRANSLATION"
  | "CULTURAL_SENSITIVITY";

export type CorrectionReportStatus =
  | "OPEN"
  | "REVIEWED"
  | "RESOLVED"
  | "DISMISSED";

export interface CorrectionReportEntity {
  id: string;
  cardId: string;
  cardSlug: string;
  cardName: string;
  reporterName: string;
  reporterEmail: string | null;
  category: CorrectionCategory;
  description: string;
  referenceUrl: string | null;
  status: CorrectionReportStatus;
  resolutionNote: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface OwnedCardsPaginatedResult extends PaginatedResult<OwnedCardEntity> {
  readonly totalOwnedQuantity: number;
}

export interface CardFilterQuery {
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

export interface CreateReportRequest {
  cardSlug: string;
  reporterName: string;
  reporterEmail: string | null;
  category: CorrectionCategory;
  description: string;
  referenceUrl: string | null;
}

