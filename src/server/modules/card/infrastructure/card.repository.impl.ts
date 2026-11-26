import "server-only";
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
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredCardRecord,
  type StoredCorrectionReportRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import type {
  CardQueryFilter,
  CardRepository,
  CreateCorrectionReportInput,
} from "../domain/card.repository";

export class CardRepositoryImpl implements CardRepository {
  public async findMany(
    filter: CardQueryFilter = {}
  ): Promise<StoredCardRecord[]> {
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.card.findMany({
        include: { assets: true },
        orderBy: { code: "asc" },
      });
      const mapped: StoredCardRecord[] = rows.map((row) => {
        const firstAsset = row.assets[0] ?? null;
        return {
          id: row.id,
          code: row.code,
          slug: row.slug,
          name: row.name,
          cardType: row.cardType as CardTypeValue,
          kingdom: row.kingdom as KingdomValue,
          role: row.role as RoleValue,
          secondaryRoles: row.secondaryRoles as RoleValue[],
          gender: (row.gender as GenderValue) ?? null,
          baseAttack: row.baseAttack,
          baseDefense: row.baseDefense,
          effectName: row.effectName,
          effectType: (row.effectType as EffectTypeValue | null) ?? null,
          effectDescriptionId: row.effectDescriptionId,
          effectDescriptionEn: row.effectDescriptionEn,
          effectDescriptionZh: row.effectDescriptionZh,
          attackMod: row.attackMod,
          strikeAttackBonus: row.strikeAttackBonus ?? 0,
          defenseMod: row.defenseMod,
          enemyAttackMod: row.enemyAttackMod,
          ignoreDefenseAmount: row.ignoreDefenseAmount,
          affinityRole: (row.affinityRole as RoleValue | null) ?? null,
          affinityGender: (row.affinityGender as GenderValue) ?? null,
          affinityBonusAtk: row.affinityBonusAtk,
          affinityBonusDef: row.affinityBonusDef,
          historicalSummaryId: row.historicalSummaryId,
          historicalSummaryEn: row.historicalSummaryEn,
          historicalSummaryZh: row.historicalSummaryZh,
          illustrationNote: row.illustrationNote,
          sourceCitation: row.sourceCitation,
          sourceUrl: row.sourceUrl,
          verificationStatus:
            row.verificationStatus as VerificationStatusValue,
          publicationStatus: row.publicationStatus as PublicationStatusValue,
          isCustom: row.isCustom,
          customStatus: row.customStatus,
          creatorId: row.creatorId,
          rejectionReason: row.rejectionReason,
          imagePath: row.imagePath,
          tokenStandard: row.tokenStandard,
          mintAddress: row.mintAddress,
          collectionAddress: row.collectionAddress,
          metadataUri: row.metadataUri,
          isRareEdition: row.isRareEdition,
          asset: firstAsset
            ? {
                id: firstAsset.id,
                cardId: firstAsset.cardId,
                creator: firstAsset.creator,
                rightsHolder: firstAsset.rightsHolder,
                sourceOrigin: firstAsset.sourceOrigin,
                licenseType: firstAsset.licenseType,
                commercialAllowed: firstAsset.commercialAllowed,
                creditText: firstAsset.creditText,
                approvalStatus:
                  firstAsset.approvalStatus as ApprovalStatusValue,
              }
            : null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      });
      return this.applyFilter(mapped, filter);
    }

    const store = getEmbeddedStore();
    return this.applyFilter(store.cards, filter);
  }

  public async findPaginated(filter: CardQueryFilter): Promise<{
    items: StoredCardRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.max(1, filter.limit ?? 12);
    // Get full filtered list without slicing
    const unpagedFilter = { ...filter, page: undefined, limit: undefined };
    const allFiltered = await this.findMany(unpagedFilter);
    const total = allFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const items = allFiltered.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async findBySlug(slug: string): Promise<StoredCardRecord | null> {
    const all = await this.findMany({ includeWithdrawn: true });
    return all.find((card) => card.slug === slug) ?? null;
  }

  public async createCorrectionReport(
    input: CreateCorrectionReportInput
  ): Promise<StoredCorrectionReportRecord> {
    const card = await this.findBySlug(input.cardSlug);
    if (!card) {
      throw AppError.notFound(`Kartu '${input.cardSlug}' tidak ditemukan.`);
    }

    if (isPrismaDriverEnabled()) {
      const created = await prisma.cardCorrectionReport.create({
        data: {
          cardId: card.id,
          reporterName: input.reporterName,
          reporterEmail: input.reporterEmail ?? "",
          issueType: input.category,
          description: input.description,
          suggestedSource: input.referenceUrl,
          status: "OPEN",
        },
      });
      return {
        id: created.id,
        cardId: card.id,
        cardSlug: card.slug,
        cardName: card.name,
        reporterName: created.reporterName,
        reporterEmail: created.reporterEmail || null,
        category: created.issueType,
        description: created.description,
        referenceUrl: created.suggestedSource,
        status:
          created.status === "REJECTED"
            ? "DISMISSED"
            : (created.status as StoredCorrectionReportRecord["status"]),
        resolutionNote: created.reviewerNote,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    const store = getEmbeddedStore();
    const nowIso = new Date().toISOString();
    const report: StoredCorrectionReportRecord = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cardId: card.id,
      cardSlug: card.slug,
      cardName: card.name,
      reporterName: input.reporterName,
      reporterEmail: input.reporterEmail,
      category: input.category,
      description: input.description,
      referenceUrl: input.referenceUrl,
      status: "OPEN",
      resolutionNote: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.correctionReports.unshift(report);
    persistEmbeddedStore(store);
    return report;
  }

  private applyFilter(
    cards: StoredCardRecord[],
    filter: CardQueryFilter = {}
  ): StoredCardRecord[] {
    const filtered = cards.filter((card) => {
      if (!filter.includeWithdrawn && card.publicationStatus === "WITHDRAWN") {
        return false;
      }
      if (filter.cardType && card.cardType !== filter.cardType) {
        return false;
      }
      if (filter.kingdom && card.kingdom !== filter.kingdom) {
        return false;
      }
      if (
        filter.role &&
        card.role !== filter.role &&
        !card.secondaryRoles.includes(filter.role)
      ) {
        return false;
      }
      if (
        filter.verificationStatus &&
        card.verificationStatus !== filter.verificationStatus
      ) {
        return false;
      }
      if (
        filter.publicationStatus &&
        card.publicationStatus !== filter.publicationStatus
      ) {
        return false;
      }
      if (filter.search && filter.search.trim().length > 0) {
        const q = filter.search.trim().toLowerCase();
        const hay = [
          card.name,
          card.code,
          card.slug,
          card.historicalSummaryId,
          card.historicalSummaryEn,
          card.sourceCitation,
          card.effectName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (filter.page && filter.limit) {
      const startIndex = Math.max(0, (filter.page - 1) * filter.limit);
      return filtered.slice(startIndex, startIndex + filter.limit);
    }

    return filtered;
  }
}

export const cardRepository: CardRepository = new CardRepositoryImpl();

