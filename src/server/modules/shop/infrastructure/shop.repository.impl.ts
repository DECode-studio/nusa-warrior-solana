import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import type { KingdomValue } from "@/core/constants/cards-catalog";
import { rollBoosterPackCards } from "@/core/constants/pack-tiers";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredPaymentOrderRecord,
  type StoredStarterPackRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import { grantOwnedCards } from "@/server/modules/collection/infrastructure/collection.repository";
import { getNusaPointBalance } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";
import type {
  CreatePaymentOrderInput,
  ShopRepository,
} from "../domain/shop.repository";

type PrismaShopOrderWithPack = PrismaTypes.ShopOrderGetPayload<{
  include: { starterPack: true };
}>;

function mapPrismaOrder(order: PrismaShopOrderWithPack): StoredPaymentOrderRecord {
  const instructions = order.paymentInstructions;
  return {
    id: order.id,
    orderNumber: order.referenceCode,
    userId: order.userId,
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
    starterPackId: order.starterPackId,
    starterPackCode: order.starterPack.code,
    starterPackName: order.starterPack.nameId,
    amountIdr: order.amountIdr,
    originalAmountIdr: order.originalAmountIdr,
    pointsSpent: order.pointsSpent,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentMode: order.paymentMode,
    gatewayReference: order.gatewayReference,
    paymentUrl: order.paymentUrl,
    paymentInstructions: instructions && typeof instructions === "object" && !Array.isArray(instructions)
      ? instructions as Record<string, unknown>
      : null,
    expiresAt: order.expiresAt?.toISOString() ?? null,
    drawnCardSlugs: order.drawnCardSlugs,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

function mapTopupToPaymentOrder(topup: {
  id: string;
  referenceCode?: string;
  orderNumber?: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: string;
  amountIdr: number;
  pointsAwarded: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  paymentProvider?: string;
  paymentMode?: "DEV" | "PROD";
  gatewayReference?: string | null;
  paymentUrl?: string | null;
  paymentInstructions?: unknown;
  expiresAt?: Date | string | null;
  paidAt?: Date | string | null;
  createdAt: Date | string;
}): StoredPaymentOrderRecord {
  const orderNumber = topup.referenceCode ?? topup.orderNumber ?? topup.id;
  const expiresAtStr = topup.expiresAt
    ? topup.expiresAt instanceof Date
      ? topup.expiresAt.toISOString()
      : topup.expiresAt
    : null;
  const paidAtStr = topup.paidAt
    ? topup.paidAt instanceof Date
      ? topup.paidAt.toISOString()
      : topup.paidAt
    : null;
  const createdAtStr =
    topup.createdAt instanceof Date
      ? topup.createdAt.toISOString()
      : topup.createdAt;

  return {
    id: topup.id,
    orderNumber,
    userId: topup.userId,
    buyerName: topup.buyerName,
    buyerEmail: topup.buyerEmail,
    starterPackId: `topup-${topup.id}`,
    starterPackCode: "TOPUP_NUSA_POINT",
    starterPackName: `Top Up ${topup.pointsAwarded.toLocaleString("id-ID")} Nusa Point`,
    paymentMethod: topup.paymentMethod,
    amountIdr: topup.amountIdr,
    originalAmountIdr: topup.amountIdr,
    pointsSpent: 0,
    paymentStatus: topup.paymentStatus,
    paymentProvider: topup.paymentProvider ?? "MENU_KITA",
    paymentMode: topup.paymentMode ?? "DEV",
    gatewayReference: topup.gatewayReference ?? null,
    paymentUrl: topup.paymentUrl ?? null,
    paymentInstructions:
      topup.paymentInstructions &&
      typeof topup.paymentInstructions === "object" &&
      !Array.isArray(topup.paymentInstructions)
        ? (topup.paymentInstructions as Record<string, unknown>)
        : null,
    expiresAt: expiresAtStr,
    drawnCardSlugs: [],
    createdAt: createdAtStr,
    paidAt: paidAtStr,
  };
}

export class ShopRepositoryImpl implements ShopRepository {
  public async getPointBalance(userId: string): Promise<number> {
    return getNusaPointBalance(userId);
  }

  public async hasUserClaimedStarter(userId: string): Promise<boolean> {
    if (!userId) return false;
    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (
        Boolean(
          (user as unknown as { hasClaimedStarterPack?: boolean })?.hasClaimedStarterPack
        )
      ) {
        return true;
      }
      const freeOrder = await prisma.shopOrder.findFirst({
        where: { userId, amountIdr: 0, paymentStatus: "PAID" },
      });
      return Boolean(freeOrder);
    }

    const store = getEmbeddedStore();
    const user = store.users.find((u) => u.id === userId);
    if (user?.hasClaimedStarterPack) return true;

    const hasFreeOrder = store.paymentOrders.some(
      (o) => o.userId === userId && o.amountIdr === 0 && o.paymentStatus === "PAID"
    );
    return hasFreeOrder;
  }

  public async listStarterPacks(userId?: string): Promise<StoredStarterPackRecord[]> {
    let hasClaimed = false;
    if (userId) {
      hasClaimed = await this.hasUserClaimedStarter(userId);
    }

    let packs: StoredStarterPackRecord[] = [];
    if (isPrismaDriverEnabled()) {
      try {
        const rows = await prisma.starterPack.findMany({
          orderBy: [{ isStarter: "desc" }, { priceIdr: "asc" }],
        });
        packs = rows.map((p) => ({
          id: p.id,
          code: p.code,
          nameId: p.nameId,
          nameEn: p.nameEn,
          nameZh: p.nameZh,
          descriptionId: p.descriptionId,
          descriptionEn: p.descriptionEn,
          descriptionZh: p.descriptionZh,
          kingdomTheme: p.kingdomTheme as KingdomValue,
          priceIdr: p.priceIdr,
          cardSlugs: p.cardSlugs,
          isFairPlaySafe: p.isFairPlaySafe,
          imagePath: p.imagePath ?? undefined,
          packType: (p.packType as "STARTER" | "BOOSTER") ?? "STARTER",
          isStarter: p.isStarter ?? false,
          cardCount: p.cardCount ?? (p.packType === "BOOSTER" ? 5 : p.cardSlugs.length),
        }));
      } catch (err) {
        console.error("Prisma listStarterPacks fallback:", err);
      }
    }

    if (packs.length === 0) {
      const store = getEmbeddedStore();
      packs = store.starterPacks;
    }

    // Apply first-login free starter pack pricing dynamically and ensure Starter Pack is at the top
    const mappedPacks = packs.map((pack) => {
      const isStarter = pack.isStarter || pack.code.includes("STARTER");
      if (isStarter) {
        return {
          ...pack,
          priceIdr: hasClaimed ? pack.priceIdr : 0,
          isStarter: true,
          isFree: !hasClaimed,
        };
      }
      return {
        ...pack,
        isFree: false,
      };
    });

    return mappedPacks.sort((a, b) => {
      const aStarter = a.isStarter || a.code.includes("STARTER");
      const bStarter = b.isStarter || b.code.includes("STARTER");
      if (aStarter && !bStarter) return -1;
      if (!aStarter && bStarter) return 1;
      return a.priceIdr - b.priceIdr;
    });
  }

  public async listOrders(userId?: string, limit = 25): Promise<StoredPaymentOrderRecord[]> {
    if (!userId) return [];
    if (isPrismaDriverEnabled()) {
      const orders = await prisma.shopOrder.findMany({
        where: { userId },
        include: { starterPack: true },
        orderBy: { createdAt: "desc" },
        ...(limit > 0 ? { take: limit } : {}),
      });
      return orders.map((o) => ({
        id: o.id,
        orderNumber: o.referenceCode,
        userId: o.userId,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        starterPackId: o.starterPackId,
        starterPackCode: o.starterPack.code,
        starterPackName: o.starterPack.nameId,
        amountIdr: o.amountIdr,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        paymentProvider: o.paymentProvider,
        paymentMode: o.paymentMode,
        gatewayReference: o.gatewayReference,
        paymentUrl: o.paymentUrl,
        paymentInstructions: o.paymentInstructions && typeof o.paymentInstructions === "object" && !Array.isArray(o.paymentInstructions)
          ? o.paymentInstructions as Record<string, unknown>
          : null,
        expiresAt: o.expiresAt?.toISOString() ?? null,
        drawnCardSlugs: (o.drawnCardSlugs as string[]) ?? [],
        createdAt: o.createdAt.toISOString(),
        paidAt: o.paidAt?.toISOString() ?? null,
      }));
    }

    const store = getEmbeddedStore();
    const orders = store.paymentOrders.filter((order) => order.userId === userId);
    return limit > 0 ? orders.slice(0, limit) : orders;
  }

  public async listTransactionOrders(
    userId: string,
    options: { page: number; pageSize: number; search: string }
  ): Promise<{ orders: StoredPaymentOrderRecord[]; total: number }> {
    const search = options.search.trim();
    if (isPrismaDriverEnabled()) {
      const shopWhere: Prisma.ShopOrderWhereInput = {
        userId,
        ...(search
          ? {
              OR: [
                { id: { contains: search, mode: "insensitive" } },
                { referenceCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const topupWhere: Prisma.TopupOrderWhereInput = {
        userId,
        ...(search
          ? {
              OR: [
                { id: { contains: search, mode: "insensitive" } },
                { referenceCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [shopRows, topupRows] = await Promise.all([
        prisma.shopOrder.findMany({
          where: shopWhere,
          include: { starterPack: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.topupOrder.findMany({
          where: topupWhere,
          orderBy: { createdAt: "desc" },
        }).catch((err: unknown) => {
          console.warn("[ShopRepository] Failed to fetch topup orders:", err);
          return [];
        }),
      ]);

      const allOrders: StoredPaymentOrderRecord[] = [
        ...shopRows.map(mapPrismaOrder),
        ...topupRows.map(mapTopupToPaymentOrder),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const total = allOrders.length;
      const totalPages = Math.max(1, Math.ceil(total / options.pageSize));
      const page = Math.min(options.page, totalPages);
      const start = (page - 1) * options.pageSize;
      return { orders: allOrders.slice(start, start + options.pageSize), total };
    }

    const query = search.toLocaleLowerCase();
    const store = getEmbeddedStore();
    const shopFiltered = (store.paymentOrders ?? [])
      .filter((order) => order.userId === userId)
      .filter(
        (order) =>
          !query ||
          order.id.toLocaleLowerCase().includes(query) ||
          order.orderNumber.toLocaleLowerCase().includes(query) ||
          order.starterPackName.toLocaleLowerCase().includes(query)
      );

    const topupFiltered = (store.topupOrders ?? [])
      .filter((order) => order.userId === userId)
      .map(mapTopupToPaymentOrder)
      .filter(
        (order) =>
          !query ||
          order.id.toLocaleLowerCase().includes(query) ||
          order.orderNumber.toLocaleLowerCase().includes(query) ||
          order.starterPackName.toLocaleLowerCase().includes(query)
      );

    const allFiltered = [...shopFiltered, ...topupFiltered].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt)
    );

    const total = allFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / options.pageSize));
    const page = Math.min(options.page, totalPages);
    const start = (page - 1) * options.pageSize;
    return { orders: allFiltered.slice(start, start + options.pageSize), total };
  }

  public async claimFreeStarterPack(userId: string): Promise<StoredPaymentOrderRecord> {
    const hasClaimed = await this.hasUserClaimedStarter(userId);
    if (hasClaimed) {
      throw AppError.badRequest("Starter pack gratis sudah pernah diklaim sebelumnya.");
    }

    const packs = await this.listStarterPacks();
    const starterPack =
      packs.find((p) => p.isStarter || p.code.includes("STARTER")) ?? packs[0];

    if (!starterPack) {
      throw AppError.notFound("Starter pack tidak ditemukan.");
    }

    const now = new Date();
    const orderNumber = `NSC-FREE-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(
      2,
      "0"
    )}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const gatewayReference = `FREE-STARTER-CLAIM-${Date.now()}`;

    if (isPrismaDriverEnabled()) {
      const dbPack = await prisma.starterPack.findUnique({
        where: { code: starterPack.code },
      });
      const targetPackId = dbPack?.id ?? starterPack.id;

      const created = await prisma.$transaction(async (tx) => {
        const previousFreeOrder = await tx.shopOrder.findFirst({
          where: { userId, amountIdr: 0, paymentStatus: "PAID" },
          select: { id: true },
        });
        if (previousFreeOrder) {
          throw AppError.badRequest("Starter pack gratis sudah pernah diklaim sebelumnya.");
        }

        const claim = await tx.user.updateMany({
          where: { id: userId, hasClaimedStarterPack: false },
          data: { hasClaimedStarterPack: true },
        });
        if (claim.count !== 1) {
          throw AppError.badRequest("Starter pack gratis sudah pernah diklaim sebelumnya.");
        }

        const order = await tx.shopOrder.create({
          data: {
            referenceCode: orderNumber,
            userId,
            buyerName: "Pemain Nusantara",
            buyerEmail: "pemain@nusantaracard.id",
            starterPackId: targetPackId,
            amountIdr: 0,
            paymentMethod: "FREE",
            paymentStatus: "PAID",
            paymentProvider: "FREE_CLAIM",
            paymentMode: "DEV",
            gatewayReference,
            drawnCardSlugs: starterPack.cardSlugs,
            paidAt: now,
          },
        });

        await grantOwnedCards(userId, starterPack.cardSlugs, `ORDER:${order.id}`, tx);
        return order;
      });

      return {
        id: created.id,
        orderNumber: created.referenceCode,
        userId: created.userId,
        buyerName: created.buyerName,
        buyerEmail: created.buyerEmail,
        starterPackId: starterPack.id,
        starterPackCode: starterPack.code,
        starterPackName: starterPack.nameId,
        amountIdr: 0,
        paymentMethod: "FREE",
        paymentStatus: "PAID",
        paymentProvider: "FREE_CLAIM",
        paymentMode: "DEV",
        gatewayReference,
        drawnCardSlugs: starterPack.cardSlugs,
        createdAt: created.createdAt.toISOString(),
        paidAt: now.toISOString(),
      };
    }

    const store = getEmbeddedStore();
    const user = store.users.find((u) => u.id === userId);
    if (
      user?.hasClaimedStarterPack ||
      store.paymentOrders.some((order) => order.userId === userId && order.amountIdr === 0 && order.paymentStatus === "PAID")
    ) {
      throw AppError.badRequest("Starter pack gratis sudah pernah diklaim sebelumnya.");
    }
    if (user) {
      user.hasClaimedStarterPack = true;
    }

    const record: StoredPaymentOrderRecord = {
      id: `ord-free-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber,
      userId,
      buyerName: user?.name || "Pemain Nusantara",
      buyerEmail: "pemain@nusantaracard.id",
      starterPackId: starterPack.id,
      starterPackCode: starterPack.code,
      starterPackName: starterPack.nameId,
      amountIdr: 0,
      paymentMethod: "FREE",
      paymentStatus: "PAID",
      paymentProvider: "FREE_CLAIM",
      paymentMode: "DEV",
      gatewayReference,
      drawnCardSlugs: starterPack.cardSlugs,
      createdAt: now.toISOString(),
      paidAt: now.toISOString(),
    };

    store.paymentOrders.unshift(record);
    await grantOwnedCards(userId, starterPack.cardSlugs, `ORDER:${record.id}`);
    persistEmbeddedStore(store);
    return record;
  }

  public async createPaymentOrder(
    input: CreatePaymentOrderInput
  ): Promise<StoredPaymentOrderRecord> {
    if (!input.userId) throw AppError.unauthorized();
    const packs = await this.listStarterPacks(input.userId ?? undefined);
    const pack = packs.find((p) => p.code === input.starterPackCode);
    if (!pack) {
      throw AppError.notFound(
        `Paket '${input.starterPackCode}' tidak ditemukan.`
      );
    }

    const isBooster = pack.packType === "BOOSTER" || pack.code.includes("BOOSTER");
    const isStarter = pack.isStarter || pack.code.includes("STARTER");
    const pointsToUse = input.pointsToUse;
    const maxPoints = isBooster ? Math.floor(pack.priceIdr * 0.6) : isStarter ? pack.priceIdr : 0;
    if (!Number.isSafeInteger(pointsToUse) || pointsToUse < 0 || pointsToUse > maxPoints) {
      throw AppError.badRequest("Penggunaan poin melebihi batas diskon paket.");
    }

    // Booster packs roll 5 random cards (1 guaranteed High-End)
    // Starter pack grants the 20 low-end cards
    const drawnSlugs = isBooster
      ? rollBoosterPackCards(pack.code)
      : [...pack.cardSlugs];

    const now = new Date();
    const orderNumber = `NSC-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(
      2,
      "0"
    )}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

    const originalAmount = pack.priceIdr;
    const finalAmount = originalAmount - pointsToUse;
    if (originalAmount < 1) {
      throw AppError.badRequest("Paket gratis harus diambil melalui klaim starter gratis.");
    }
    if (finalAmount > 0 && (!input.paymentMethod || !input.paymentChannel)) {
      throw AppError.badRequest("Metode pembayaran diperlukan untuk sisa tagihan.");
    }

    if (isPrismaDriverEnabled()) {
      return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: input.userId! }, select: { id: true } });
        if (!user) throw AppError.forbidden("Nusa Point hanya tersedia untuk akun pemain terdaftar.");
        if (pointsToUse > 0) {
          await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
            WITH point_lock AS MATERIALIZED (
              SELECT pg_advisory_xact_lock(8813044, hashtext(${input.userId!}))
            )
            SELECT 1::int AS locked FROM point_lock
          `);
          const balance = await tx.nusaPointTransaction.aggregate({
            where: { userId: input.userId! },
            _sum: { amount: true },
          });
          if ((balance._sum.amount ?? 0) < pointsToUse) throw AppError.badRequest("Saldo Nusa Point tidak mencukupi.");
        }
        const dbPack = await tx.starterPack.findUnique({ where: { code: pack.code }, select: { id: true } });
        const created = await tx.shopOrder.create({
          data: {
            referenceCode: orderNumber,
            userId: input.userId,
            buyerName: input.buyerName,
            buyerEmail: input.buyerEmail,
            starterPackId: dbPack?.id ?? pack.id,
            amountIdr: finalAmount,
            originalAmountIdr: originalAmount,
            pointsSpent: pointsToUse,
            paymentMethod: finalAmount === 0 ? "NUSA_POINTS" : input.paymentMethod!,
            paymentStatus: finalAmount === 0 ? "PAID" : "PENDING",
            paymentProvider: finalAmount === 0 ? "NUSA_POINTS" : "IPAYMU",
            paymentMode: input.paymentMode,
            drawnCardSlugs: drawnSlugs,
            ...(finalAmount === 0 ? { paidAt: now } : {}),
          },
          include: { starterPack: true },
        });
        if (pointsToUse > 0) {
          await tx.nusaPointTransaction.create({
            data: {
              id: randomUUID(), userId: input.userId!, amount: -pointsToUse,
              source: "SHOP_ORDER_SPEND", sourceId: created.id, createdAt: now,
            },
          });
        }
        if (finalAmount === 0) await grantOwnedCards(input.userId!, drawnSlugs, `ORDER:${created.id}`, tx);
        return mapPrismaOrder(created);
      });
    }

    const store = getEmbeddedStore();
    const user = store.users.find((item) => item.id === input.userId);
    if (!user) throw AppError.forbidden("Nusa Point hanya tersedia untuk akun pemain terdaftar.");
    const balance = store.nusaPointTransactions.filter((entry) => entry.userId === input.userId)
      .reduce((sum, entry) => sum + entry.amount, 0);
    if (balance < pointsToUse) throw AppError.badRequest("Saldo Nusa Point tidak mencukupi.");
    const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: StoredPaymentOrderRecord = {
      id,
      orderNumber,
      userId: input.userId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      starterPackId: pack.id,
      starterPackCode: pack.code,
      starterPackName: pack.nameId,
      amountIdr: finalAmount,
      originalAmountIdr: originalAmount,
      pointsSpent: pointsToUse,
      paymentMethod: finalAmount === 0 ? "NUSA_POINTS" : input.paymentMethod!,
      paymentStatus: finalAmount === 0 ? "PAID" : "PENDING",
      paymentProvider: finalAmount === 0 ? "NUSA_POINTS" : "IPAYMU",
      paymentMode: input.paymentMode,
      gatewayReference: null,
      paymentUrl: null,
      paymentInstructions: null,
      expiresAt: null,
      drawnCardSlugs: drawnSlugs,
      createdAt: now.toISOString(),
      paidAt: finalAmount === 0 ? now.toISOString() : null,
    };

    if (pointsToUse > 0) {
      store.nusaPointTransactions.push({
        id: randomUUID(), userId: input.userId, amount: -pointsToUse,
        source: "SHOP_ORDER_SPEND", sourceId: id, createdAt: now.toISOString(),
      });
    }
    store.paymentOrders.unshift(record);
    if (finalAmount === 0) await grantOwnedCards(input.userId, drawnSlugs, `ORDER:${id}`);
    persistEmbeddedStore(store);
    return record;
  }

  public async attachGatewayPayment(input: {
    orderId: string;
    gatewayReference: string | null;
    paymentUrl: string | null;
    paymentInstructions: Record<string, unknown> | null;
    expiresAt: string | null;
  }): Promise<StoredPaymentOrderRecord> {
    if (isPrismaDriverEnabled()) {
      const order = await prisma.shopOrder.update({
        where: { id: input.orderId },
        data: {
          gatewayReference: input.gatewayReference,
          paymentUrl: input.paymentUrl,
          paymentInstructions: input.paymentInstructions
            ? input.paymentInstructions as Prisma.InputJsonObject
            : Prisma.DbNull,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
        include: { starterPack: true },
      });
      const hydratedOrder = await prisma.shopOrder.findUnique({
        where: { id: order.id },
        include: { starterPack: true },
      });
      if (!hydratedOrder) throw AppError.notFound("Order tidak ditemukan.");
      return mapPrismaOrder(hydratedOrder);
    }

    const store = getEmbeddedStore();
    const order = store.paymentOrders.find((item) => item.id === input.orderId);
    if (!order) throw AppError.notFound("Order tidak ditemukan.");
    order.gatewayReference = input.gatewayReference;
    order.paymentUrl = input.paymentUrl;
    order.paymentInstructions = input.paymentInstructions;
    order.expiresAt = input.expiresAt;
    persistEmbeddedStore(store);
    return order;
  }

  public async failPendingOrder(orderId: string): Promise<void> {
    if (isPrismaDriverEnabled()) {
      await prisma.$transaction(async (tx) => {
        const order = await tx.shopOrder.findUnique({ where: { id: orderId } });
        if (!order || order.paymentStatus !== "PENDING") return;
        const changed = await tx.shopOrder.updateMany({
          where: { id: orderId, paymentStatus: "PENDING" },
          data: { paymentStatus: "FAILED" },
        });
        if (changed.count !== 1) return;
        if (order.pointsSpent > 0 && order.userId) {
          await tx.nusaPointTransaction.create({
            data: {
              id: randomUUID(), userId: order.userId, amount: order.pointsSpent,
              source: "SHOP_ORDER_REFUND", sourceId: order.id,
            },
          });
        }
      });
      return;
    }
    const store = getEmbeddedStore();
    const order = store.paymentOrders.find((item) => item.id === orderId);
    if (order?.paymentStatus === "PENDING") {
      order.paymentStatus = "FAILED";
      if ((order.pointsSpent ?? 0) > 0 && order.userId &&
        !store.nusaPointTransactions.some((entry) => entry.source === "SHOP_ORDER_REFUND" && entry.sourceId === order.id)) {
        store.nusaPointTransactions.push({
          id: randomUUID(), userId: order.userId, amount: order.pointsSpent!,
          source: "SHOP_ORDER_REFUND", sourceId: order.id, createdAt: new Date().toISOString(),
        });
      }
    }
    persistEmbeddedStore(store);
  }

  public async getOrderById(orderId: string, userId: string): Promise<StoredPaymentOrderRecord> {
    if (isPrismaDriverEnabled()) {
      const order = await prisma.shopOrder.findFirst({
        where: { id: orderId, userId },
        include: { starterPack: true },
      });
      if (!order) throw AppError.notFound("Order tidak ditemukan.");
      return mapPrismaOrder(order);
    }
    const order = getEmbeddedStore().paymentOrders.find(
      (item) => item.id === orderId && item.userId === userId
    );
    if (!order) throw AppError.notFound("Order tidak ditemukan.");
    return order;
  }

  public async settleGatewayOrder(input: {
    referenceCode: string;
    amountIdr: number | null;
    paymentMode: "DEV" | "PROD";
    status: "PAID" | "FAILED" | "EXPIRED";
  }): Promise<"updated" | "duplicate" | "not_found" | "amount_mismatch"> {
    if (isPrismaDriverEnabled()) {
      return prisma.$transaction(async (tx) => {
        const order = await tx.shopOrder.findUnique({
          where: { referenceCode: input.referenceCode },
        });
        if (!order) return "not_found";
        if (order.paymentMode !== input.paymentMode) return "duplicate";
        if (input.amountIdr !== null && input.amountIdr !== order.amountIdr) {
          return "amount_mismatch";
        }
        if (order.paymentStatus === "PAID") return "duplicate";
        if (order.paymentStatus !== "PENDING" && input.status !== "PAID") return "duplicate";
        const changed = await tx.shopOrder.updateMany({
          where: { id: order.id, paymentStatus: order.paymentStatus },
          data: {
            paymentStatus: input.status,
            ...(input.status === "PAID" ? { paidAt: new Date() } : {}),
          },
        });
        if (changed.count !== 1) return "duplicate";
        if (input.status === "PAID" && order.paymentStatus !== "PENDING" && order.pointsSpent > 0 && order.userId) {
          const priorRefund = await tx.nusaPointTransaction.findUnique({
            where: { userId_source_sourceId: { userId: order.userId, source: "SHOP_ORDER_REFUND", sourceId: order.id } },
            select: { id: true },
          });
          if (priorRefund) {
            await tx.nusaPointTransaction.create({
              data: {
                id: randomUUID(), userId: order.userId, amount: -order.pointsSpent,
                source: "SHOP_ORDER_REFUND_REVERSAL", sourceId: order.id,
              },
            });
          }
        }
        if (input.status === "PAID" && order.userId) {
          await grantOwnedCards(order.userId, order.drawnCardSlugs, `ORDER:${order.id}`, tx);
        }
        if (input.status !== "PAID" && order.pointsSpent > 0 && order.userId) {
          await tx.nusaPointTransaction.create({
            data: {
              id: randomUUID(), userId: order.userId, amount: order.pointsSpent,
              source: "SHOP_ORDER_REFUND", sourceId: order.id,
            },
          });
        }
        return "updated";
      });
    }

    const store = getEmbeddedStore();
    const order = store.paymentOrders.find((item) => item.orderNumber === input.referenceCode);
    if (!order) return "not_found";
    if (order.paymentMode && order.paymentMode !== input.paymentMode) return "duplicate";
    if (input.amountIdr !== null && input.amountIdr !== order.amountIdr) {
      return "amount_mismatch";
    }
    if (order.paymentStatus === "PAID") return "duplicate";
    if (order.paymentStatus !== "PENDING" && input.status !== "PAID") return "duplicate";
    if (input.status === "PAID" && order.paymentStatus !== "PENDING" && (order.pointsSpent ?? 0) > 0 && order.userId) {
      const priorRefund = store.nusaPointTransactions.some((entry) =>
        entry.userId === order.userId && entry.source === "SHOP_ORDER_REFUND" && entry.sourceId === order.id
      );
      const reversalExists = store.nusaPointTransactions.some((entry) =>
        entry.userId === order.userId && entry.source === "SHOP_ORDER_REFUND_REVERSAL" && entry.sourceId === order.id
      );
      if (priorRefund && !reversalExists) {
        store.nusaPointTransactions.push({
          id: randomUUID(), userId: order.userId, amount: -(order.pointsSpent ?? 0),
          source: "SHOP_ORDER_REFUND_REVERSAL", sourceId: order.id, createdAt: new Date().toISOString(),
        });
      }
    }
    order.paymentStatus = input.status;
    if (input.status === "PAID") {
      order.paidAt = new Date().toISOString();
      if (order.userId) {
        await grantOwnedCards(order.userId, order.drawnCardSlugs ?? [], `ORDER:${order.id}`);
      }
    } else if ((order.pointsSpent ?? 0) > 0 && order.userId &&
      !store.nusaPointTransactions.some((entry) => entry.source === "SHOP_ORDER_REFUND" && entry.sourceId === order.id)) {
      store.nusaPointTransactions.push({
        id: randomUUID(), userId: order.userId, amount: order.pointsSpent!,
        source: "SHOP_ORDER_REFUND", sourceId: order.id, createdAt: new Date().toISOString(),
      });
    }
    persistEmbeddedStore(store);
    return "updated";
  }

  public async createNusaBurnOrder(input: {
    userId: string;
    buyerName: string;
    buyerEmail: string;
    starterPackCode: string;
    amountNusa: number;
    txSignature: string;
  }): Promise<StoredPaymentOrderRecord> {
    const packs = await this.listStarterPacks(input.userId);
    const pack = packs.find((p) => p.code === input.starterPackCode);
    if (!pack) {
      throw AppError.notFound(
        `Paket '${input.starterPackCode}' tidak ditemukan.`
      );
    }

    const isBooster =
      pack.packType === "BOOSTER" || pack.code.includes("BOOSTER");
    const drawnSlugs = isBooster
      ? rollBoosterPackCards(pack.code)
      : [...pack.cardSlugs];

    const now = new Date();
    const orderNumber = `NUSA-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(
      2,
      "0"
    )}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

    if (isPrismaDriverEnabled()) {
      return prisma.$transaction(async (tx) => {
        const duplicate = await tx.shopOrder.findFirst({
          where: { txSignature: input.txSignature },
          select: { id: true },
        });
        if (duplicate) {
          throw AppError.badRequest(
            "Signature transaksi burn NUSA sudah pernah digunakan."
          );
        }
        const dbPack = await tx.starterPack.findUnique({
          where: { code: pack.code },
          select: { id: true },
        });
        const created = await tx.shopOrder.create({
          data: {
            referenceCode: orderNumber,
            userId: input.userId,
            starterPackId: dbPack?.id ?? pack.id,
            buyerName: input.buyerName,
            buyerEmail: input.buyerEmail,
            paymentMethod: "NUSA_BURN",
            amountIdr: input.amountNusa,
            originalAmountIdr: pack.priceIdr,
            pointsSpent: input.amountNusa,
            paymentStatus: "PAID",
            paymentProvider: "NUSA_TOKEN_BURN",
            paymentMode: "PROD",
            drawnCardSlugs: drawnSlugs,
            txSignature: input.txSignature,
            paidAt: now,
          },
          include: { starterPack: true },
        });
        await grantOwnedCards(input.userId, drawnSlugs, `ORDER:${created.id}`, tx);
        return mapPrismaOrder(created as Parameters<typeof mapPrismaOrder>[0]);
      });
    }

    const store = getEmbeddedStore();
    const id = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: StoredPaymentOrderRecord = {
      id,
      orderNumber,
      userId: input.userId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      starterPackId: pack.id,
      starterPackCode: pack.code,
      starterPackName: pack.nameId,
      paymentMethod: "NUSA_BURN",
      amountIdr: input.amountNusa,
      originalAmountIdr: pack.priceIdr,
      pointsSpent: input.amountNusa,
      paymentStatus: "PAID",
      paymentProvider: "NUSA_TOKEN_BURN",
      paymentMode: "PROD",
      gatewayReference: input.txSignature,
      paymentUrl: null,
      paymentInstructions: null,
      expiresAt: null,
      drawnCardSlugs: drawnSlugs,
      createdAt: now.toISOString(),
      paidAt: now.toISOString(),
    };
    store.paymentOrders.unshift(record);
    await grantOwnedCards(input.userId, drawnSlugs, `ORDER:${id}`);
    persistEmbeddedStore(store);
    return record;
  }
}

export const shopRepository: ShopRepository = new ShopRepositoryImpl();
