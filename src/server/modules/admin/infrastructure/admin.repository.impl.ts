import "server-only";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredCardRecord,
  type StoredCorrectionReportRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import type {
  AdminCardQueryFilter,
  AdminRepository,
  AdminUserQueryFilter,
  AdminUserSummaryRecord,
  AdminUserDetailRecord,
  UpdateAdminUserRoleInput,
  UpdateCardCurationInput,
  UpdateReportStatusInput,
} from "../domain/admin.repository";
import type { UserRoleValue } from "@/server/shared/auth/session";

export class AdminRepositoryImpl implements AdminRepository {
  public async getUserDetail(userId: string): Promise<AdminUserDetailRecord> {
    const cards = await cardRepository.findMany({ includeWithdrawn: true });
    const cardsById = new Map(cards.map((card) => [card.id, card]));

    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw AppError.notFound("Pengguna tidak ditemukan.");
      const [holdings, deckRows] = await Promise.all([
        prisma.userCard.findMany({ where: { userId, quantity: { gt: 0 } } }),
        prisma.deck.findMany({
          where: { userId, isPreset: false },
          include: { cards: { include: { card: true } } },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role as UserRoleValue, createdAt: user.createdAt.toISOString() },
        ownedCards: holdings.flatMap((holding) => {
          const card = cardsById.get(holding.cardId);
          return card ? [{ card, quantity: holding.quantity }] : [];
        }),
        decks: deckRows.map((deck) => ({
          id: deck.id,
          name: deck.name,
          description: deck.description,
          kingdomFilter: "MIXED",
          isPreset: deck.isPreset,
          userId: deck.userId,
          characterSlugs: deck.cards
            .filter((slot) => slot.card.cardType === "CHARACTER")
            .flatMap((slot) => Array.from({ length: slot.quantity }, () => slot.card.slug)),
          instrumentSlugs: deck.cards
            .filter((slot) => slot.card.cardType === "INSTRUMENT")
            .flatMap((slot) => Array.from({ length: slot.quantity }, () => slot.card.slug)),
          createdAt: deck.createdAt.toISOString(),
          updatedAt: deck.updatedAt.toISOString(),
        })),
      };
    }

    const store = getEmbeddedStore();
    const user = store.users.find((item) => item.id === userId);
    if (!user) throw AppError.notFound("Pengguna tidak ditemukan.");
    const ownedCards = store.userCards
      .filter((item) => item.userId === userId && item.quantity > 0)
      .flatMap((holding) => {
        const card = cardsById.get(holding.cardId);
        return card ? [{ card, quantity: holding.quantity }] : [];
      });
    const decks = store.decks
      .filter((deck) => deck.userId === userId && !deck.isPreset)
      .map((deck) => {
        const slots = [...deck.cards].sort((a, b) => a.position - b.position);
        const slugs = slots.flatMap((slot) => {
          const card = cardsById.get(slot.cardId);
          return card ? [{ slug: card.slug, type: card.cardType }] : [];
        });
        return {
          id: deck.id,
          name: deck.name,
          description: deck.description,
          kingdomFilter: deck.kingdomFilter,
          isPreset: deck.isPreset,
          userId: deck.userId,
          characterSlugs: slugs.filter((card) => card.type === "CHARACTER").map((card) => card.slug),
          instrumentSlugs: slugs.filter((card) => card.type === "INSTRUMENT").map((card) => card.slug),
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        };
      });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
      ownedCards,
      decks,
    };
  }

  public async listAllCardsForAdmin(): Promise<StoredCardRecord[]> {
    return cardRepository.findMany({ includeWithdrawn: true });
  }

  public async listPaginatedCardsForAdmin(
    filter: AdminCardQueryFilter
  ): Promise<{
    items: StoredCardRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return cardRepository.findPaginated({
      includeWithdrawn: true,
      search: filter.search,
      page: filter.page,
      limit: filter.limit,
    });
  }

  public async updateCardCuration(
    input: UpdateCardCurationInput
  ): Promise<StoredCardRecord> {
    if (isPrismaDriverEnabled()) {
      const existing = await prisma.card.findUnique({
        where: { slug: input.cardSlug },
        include: { assets: true },
      });
      if (!existing) {
        throw AppError.notFound(`Kartu '${input.cardSlug}' tidak ditemukan.`);
      }

      const prismaVerStatus =
        input.verificationStatus === "PENDING_REVIEW"
          ? "NEEDS_REVIEW"
          : input.verificationStatus;

      await prisma.card.update({
        where: { slug: input.cardSlug },
        data: {
          ...(prismaVerStatus ? { verificationStatus: prismaVerStatus } : {}),
          ...(input.publicationStatus
            ? { publicationStatus: input.publicationStatus }
            : {}),
          ...(input.sourceCitation !== undefined
            ? { sourceCitation: input.sourceCitation }
            : {}),
          ...(input.sourceUrl !== undefined
            ? { sourceUrl: input.sourceUrl }
            : {}),
          ...(input.historicalSummaryId !== undefined
            ? { historicalSummaryId: input.historicalSummaryId }
            : {}),
          ...(input.historicalSummaryEn !== undefined
            ? { historicalSummaryEn: input.historicalSummaryEn }
            : {}),
          ...(input.historicalSummaryZh !== undefined
            ? { historicalSummaryZh: input.historicalSummaryZh }
            : {}),
          ...(input.effectName !== undefined
            ? { effectName: input.effectName }
            : {}),
          ...(input.effectDescriptionId !== undefined
            ? { effectDescriptionId: input.effectDescriptionId }
            : {}),
          ...(input.effectDescriptionEn !== undefined
            ? { effectDescriptionEn: input.effectDescriptionEn }
            : {}),
          ...(input.effectDescriptionZh !== undefined
            ? { effectDescriptionZh: input.effectDescriptionZh }
            : {}),
        },
      });

      const firstAsset = existing.assets[0];
      if (
        firstAsset &&
        (input.creator || input.licenseType || input.approvalStatus)
      ) {
        const prismaApproval =
          input.approvalStatus === "PENDING"
            ? "NEEDS_PERMISSION"
            : input.approvalStatus;
        await prisma.cardAsset.update({
          where: { id: firstAsset.id },
          data: {
            ...(input.creator ? { creator: input.creator } : {}),
            ...(input.licenseType ? { licenseType: input.licenseType } : {}),
            ...(prismaApproval ? { approvalStatus: prismaApproval } : {}),
          },
        });
      }

      const updated = await cardRepository.findBySlug(input.cardSlug);
      if (!updated) {
        throw AppError.internal("Gagal memuat kartu setelah pembaruan.");
      }
      return updated;
    }

    const store = getEmbeddedStore();
    const card = store.cards.find((c) => c.slug === input.cardSlug);
    if (!card) {
      throw AppError.notFound(`Kartu '${input.cardSlug}' tidak ditemukan.`);
    }

    if (input.verificationStatus) {
      card.verificationStatus = input.verificationStatus;
    }
    if (input.publicationStatus) {
      card.publicationStatus = input.publicationStatus;
    }
    if (input.sourceCitation !== undefined) {
      card.sourceCitation = input.sourceCitation;
    }
    if (input.sourceUrl !== undefined) {
      card.sourceUrl = input.sourceUrl;
    }
    if (input.historicalSummaryId !== undefined) {
      card.historicalSummaryId = input.historicalSummaryId;
    }
    if (input.historicalSummaryEn !== undefined) {
      card.historicalSummaryEn = input.historicalSummaryEn;
    }
    if (input.historicalSummaryZh !== undefined) {
      card.historicalSummaryZh = input.historicalSummaryZh;
    }
    if (input.effectName !== undefined) {
      card.effectName = input.effectName;
    }
    if (input.effectDescriptionId !== undefined) {
      card.effectDescriptionId = input.effectDescriptionId;
    }
    if (input.effectDescriptionEn !== undefined) {
      card.effectDescriptionEn = input.effectDescriptionEn;
    }
    if (input.effectDescriptionZh !== undefined) {
      card.effectDescriptionZh = input.effectDescriptionZh;
    }
    if (card.asset) {
      if (input.creator) card.asset.creator = input.creator;
      if (input.licenseType) card.asset.licenseType = input.licenseType;
      if (input.approvalStatus)
        card.asset.approvalStatus = input.approvalStatus;
    }
    card.updatedAt = new Date().toISOString();
    persistEmbeddedStore(store);
    return card;
  }

  public async listAllReports(): Promise<StoredCorrectionReportRecord[]> {
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.cardCorrectionReport.findMany({
        include: { card: true },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        cardId: r.cardId,
        cardSlug: r.card.slug,
        cardName: r.card.name,
        reporterName: r.reporterName,
        reporterEmail: r.reporterEmail || null,
        category: r.issueType,
        description: r.description,
        referenceUrl: r.suggestedSource,
        status:
          r.status === "REJECTED"
            ? "DISMISSED"
            : (r.status as StoredCorrectionReportRecord["status"]),
        resolutionNote: r.reviewerNote,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }

    const store = getEmbeddedStore();
    return store.correctionReports;
  }

  public async updateReportStatus(
    input: UpdateReportStatusInput
  ): Promise<StoredCorrectionReportRecord> {
    if (isPrismaDriverEnabled()) {
      const prismaStatus =
        input.status === "DISMISSED" ? "REJECTED" : input.status;
      const updated = await prisma.cardCorrectionReport.update({
        where: { id: input.reportId },
        data: {
          status: prismaStatus,
          reviewerNote: input.resolutionNote,
        },
        include: { card: true },
      });
      return {
        id: updated.id,
        cardId: updated.cardId,
        cardSlug: updated.card.slug,
        cardName: updated.card.name,
        reporterName: updated.reporterName,
        reporterEmail: updated.reporterEmail || null,
        category: updated.issueType,
        description: updated.description,
        referenceUrl: updated.suggestedSource,
        status: input.status,
        resolutionNote: updated.reviewerNote,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    const store = getEmbeddedStore();
    const report = store.correctionReports.find((r) => r.id === input.reportId);
    if (!report) {
      throw AppError.notFound("Laporan koreksi tidak ditemukan.");
    }
    report.status = input.status;
    report.resolutionNote = input.resolutionNote;
    report.updatedAt = new Date().toISOString();
    persistEmbeddedStore(store);
    return report;
  }

  public async listAllUsers(): Promise<AdminUserSummaryRecord[]> {
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });
      return rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as UserRoleValue,
        createdAt: u.createdAt.toISOString(),
      }));
    }

    const store = getEmbeddedStore();
    return store.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  public async listPaginatedUsers(
    filter: AdminUserQueryFilter
  ): Promise<{
    items: AdminUserSummaryRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.max(1, Math.min(100, filter.limit ?? 10));

    if (isPrismaDriverEnabled()) {
      const search = filter.search?.trim();
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));
      return {
        items: rows.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as UserRoleValue,
          createdAt: u.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
      };
    }

    const store = getEmbeddedStore();
    let users = store.users;
    const search = filter.search?.trim().toLowerCase();
    if (search) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.role.toLowerCase().includes(search)
      );
    }

    const total = users.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const sliced = users.slice(start, start + limit);

    return {
      items: sliced.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async updateUserRole(
    input: UpdateAdminUserRoleInput
  ): Promise<AdminUserSummaryRecord> {
    if (isPrismaDriverEnabled()) {
      const updated = await prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role as UserRoleValue,
        createdAt: updated.createdAt.toISOString(),
      };
    }

    const store = getEmbeddedStore();
    const user = store.users.find((u) => u.id === input.userId);
    if (!user) {
      throw AppError.notFound("Pengguna tidak ditemukan.");
    }
    user.role = input.role;
    persistEmbeddedStore(store);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export const adminRepository: AdminRepository = new AdminRepositoryImpl();

