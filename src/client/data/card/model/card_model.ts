import type {
  CardAssetEntity,
  CardEntity,
  CorrectionCategory,
  CorrectionReportEntity,
  CorrectionReportStatus,
} from "@/client/domain/card/entity/card_entity";
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

export interface CardAssetApiModel {
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

export interface CardApiModel {
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
  imagePath: string;
  asset: CardAssetApiModel | null;
}

export interface CorrectionReportApiModel {
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

export function mapCardModelToEntity(model: CardApiModel): CardEntity {
  const assetEntity: CardAssetEntity | null = model.asset
    ? {
        id: model.asset.id,
        cardId: model.asset.cardId,
        creator: model.asset.creator,
        rightsHolder: model.asset.rightsHolder,
        sourceOrigin: model.asset.sourceOrigin,
        licenseType: model.asset.licenseType,
        commercialAllowed: model.asset.commercialAllowed,
        creditText: model.asset.creditText,
        approvalStatus: model.asset.approvalStatus,
      }
    : null;

  return {
    id: model.id,
    code: model.code,
    slug: model.slug,
    name: model.name,
    cardType: model.cardType,
    kingdom: model.kingdom,
    role: model.role,
    secondaryRoles: [...model.secondaryRoles],
    gender: model.gender,
    baseAttack: model.baseAttack,
    baseDefense: model.baseDefense,
    effectName: model.effectName,
    effectType: model.effectType,
    effectDescriptionId: model.effectDescriptionId,
    effectDescriptionEn: model.effectDescriptionEn,
    effectDescriptionZh: model.effectDescriptionZh,
    attackMod: model.attackMod,
    strikeAttackBonus: model.strikeAttackBonus ?? 0,
    defenseMod: model.defenseMod,
    enemyAttackMod: model.enemyAttackMod,
    ignoreDefenseAmount: model.ignoreDefenseAmount,
    affinityRole: model.affinityRole,
    affinityGender: model.affinityGender,
    affinityBonusAtk: model.affinityBonusAtk,
    affinityBonusDef: model.affinityBonusDef,
    historicalSummaryId: model.historicalSummaryId,
    historicalSummaryEn: model.historicalSummaryEn,
    historicalSummaryZh: model.historicalSummaryZh,
    illustrationNote: model.illustrationNote,
    sourceCitation: model.sourceCitation,
    sourceUrl: model.sourceUrl,
    verificationStatus: model.verificationStatus,
    publicationStatus: model.publicationStatus,
    imagePath: model.imagePath,
    asset: assetEntity,
  };
}

export function mapCorrectionReportModelToEntity(
  model: CorrectionReportApiModel
): CorrectionReportEntity {
  return {
    id: model.id,
    cardId: model.cardId,
    cardSlug: model.cardSlug,
    cardName: model.cardName,
    reporterName: model.reporterName,
    reporterEmail: model.reporterEmail,
    category: model.category,
    description: model.description,
    referenceUrl: model.referenceUrl,
    status: model.status,
    resolutionNote: model.resolutionNote,
    createdAt: model.createdAt,
  };
}

