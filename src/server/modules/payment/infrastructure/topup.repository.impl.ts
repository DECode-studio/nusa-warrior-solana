import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredTopupOrderRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import {
  getTopupTierByAmount,
  NUSA_POINT_TOPUP_FEE,
} from "../domain/topup-policy";
import type {
  CreateTopupOrderInput,
  TopupRepository,
} from "../domain/topup.repository";

function mapPrismaTopupOrder(row: {
  id: string;
  referenceCode: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: string;
  paymentChannel: string | null;
  amountIdr: number;
  feeIdr: number;
  pointsAwarded: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  paymentProvider: string;
  paymentMode: "DEV" | "PROD";
  gatewayReference: string | null;
  paymentUrl: string | null;
  paymentInstructions: unknown;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): StoredTopupOrderRecord {
  return {
    id: row.id,
    orderNumber: row.referenceCode,
    userId: row.userId,
    buyerName: row.buyerName,
    buyerEmail: row.buyerEmail,
    paymentMethod: row.paymentMethod,
    paymentChannel: row.paymentChannel,
    amountIdr: row.amountIdr,
    feeIdr: row.feeIdr,
    pointsAwarded: row.pointsAwarded,
    paymentStatus: row.paymentStatus,
    paymentProvider: row.paymentProvider,
    paymentMode: row.paymentMode,
    gatewayReference: row.gatewayReference,
    paymentUrl: row.paymentUrl,
    paymentInstructions:
      row.paymentInstructions && typeof row.paymentInstructions === "object"
        ? (row.paymentInstructions as Record<string, unknown>)
        : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class TopupRepositoryImpl implements TopupRepository {
  public async createTopupOrder(
    input: CreateTopupOrderInput
  ): Promise<StoredTopupOrderRecord> {
    const tier = getTopupTierByAmount(input.amountIdr);
    if (!tier) {
      throw AppError.badRequest("Nominal top up tidak sesuai dengan segmentasi yang tersedia.");
    }

    const now = new Date();
    const orderNumber = `NPT-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(
      2,
      "0"
    )}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, isGuest: true },
      });
      if (!user || user.isGuest) {
        throw AppError.forbidden("Fitur Top Up Nusa Point hanya tersedia untuk akun terdaftar.");
      }

      const created = await prisma.topupOrder.create({
        data: {
          referenceCode: orderNumber,
          userId: input.userId,
          buyerName: input.buyerName,
          buyerEmail: input.buyerEmail,
          paymentMethod: input.paymentMethod,
          paymentChannel: input.paymentChannel,
          amountIdr: tier.amountIdr,
          feeIdr: NUSA_POINT_TOPUP_FEE,
          pointsAwarded: tier.pointsAwarded,
          paymentStatus: "PENDING",
          paymentProvider: "MENU_KITA",
          paymentMode: input.paymentMode,
          createdAt: now,
          updatedAt: now,
        },
      });

      return mapPrismaTopupOrder(created);
    }

    const store = getEmbeddedStore();
    const user = store.users.find((u) => u.id === input.userId);
    if (!user || user.isGuest) {
      throw AppError.forbidden("Fitur Top Up Nusa Point hanya tersedia untuk akun terdaftar.");
    }

    const record: StoredTopupOrderRecord = {
      id: randomUUID(),
      orderNumber,
      userId: input.userId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      paymentMethod: input.paymentMethod,
      paymentChannel: input.paymentChannel,
      amountIdr: tier.amountIdr,
      feeIdr: NUSA_POINT_TOPUP_FEE,
      pointsAwarded: tier.pointsAwarded,
      paymentStatus: "PENDING",
      paymentProvider: "MENU_KITA",
      paymentMode: input.paymentMode,
      gatewayReference: null,
      paymentUrl: null,
      paymentInstructions: null,
      expiresAt: null,
      paidAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    store.topupOrders ??= [];
    store.topupOrders.push(record);
    persistEmbeddedStore(store);

    return record;
  }

  public async attachGatewayPayment(input: {
    orderId: string;
    gatewayReference: string | null;
    paymentUrl: string | null;
    paymentInstructions: Record<string, unknown> | null;
    expiresAt: string | null;
  }): Promise<StoredTopupOrderRecord> {
    if (isPrismaDriverEnabled()) {
      const updated = await prisma.topupOrder.update({
        where: { id: input.orderId },
        data: {
          gatewayReference: input.gatewayReference,
          paymentUrl: input.paymentUrl,
          paymentInstructions: input.paymentInstructions
            ? (input.paymentInstructions as Prisma.InputJsonValue)
            : undefined,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      });
      return mapPrismaTopupOrder(updated);
    }

    const store = getEmbeddedStore();
    store.topupOrders ??= [];
    const order = store.topupOrders.find((o) => o.id === input.orderId);
    if (!order) throw AppError.notFound("Order top up tidak ditemukan.");

    order.gatewayReference = input.gatewayReference;
    order.paymentUrl = input.paymentUrl;
    order.paymentInstructions = input.paymentInstructions;
    order.expiresAt = input.expiresAt;
    order.updatedAt = new Date().toISOString();
    persistEmbeddedStore(store);

    return order;
  }

  public async failPendingOrder(orderId: string): Promise<void> {
    if (isPrismaDriverEnabled()) {
      await prisma.topupOrder.updateMany({
        where: { id: orderId, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED" },
      });
      return;
    }

    const store = getEmbeddedStore();
    store.topupOrders ??= [];
    const order = store.topupOrders.find((o) => o.id === orderId);
    if (order && order.paymentStatus === "PENDING") {
      order.paymentStatus = "FAILED";
      order.updatedAt = new Date().toISOString();
      persistEmbeddedStore(store);
    }
  }

  public async getOrderById(
    orderId: string,
    userId?: string
  ): Promise<StoredTopupOrderRecord | null> {
    if (isPrismaDriverEnabled()) {
      const row = await prisma.topupOrder.findFirst({
        where: {
          id: orderId,
          ...(userId ? { userId } : {}),
        },
      });
      return row ? mapPrismaTopupOrder(row) : null;
    }

    const store = getEmbeddedStore();
    store.topupOrders ??= [];
    const found = store.topupOrders.find(
      (o) => o.id === orderId && (!userId || o.userId === userId)
    );
    return found ? { ...found } : null;
  }

  public async settleTopupOrder(input: {
    referenceCode: string;
    amountIdr: number | null;
    paymentMode: "DEV" | "PROD";
    status: "PAID" | "FAILED" | "EXPIRED";
  }): Promise<"updated" | "duplicate" | "not_found" | "amount_mismatch"> {
    if (isPrismaDriverEnabled()) {
      return prisma.$transaction(async (tx) => {
        const order = await tx.topupOrder.findUnique({
          where: { referenceCode: input.referenceCode },
        });
        if (!order) return "not_found";
        if (order.paymentMode !== input.paymentMode) return "duplicate";
        if (input.amountIdr !== null && input.amountIdr !== order.amountIdr) {
          return "amount_mismatch";
        }
        if (order.paymentStatus === "PAID") return "duplicate";
        if (order.paymentStatus !== "PENDING" && input.status !== "PAID") return "duplicate";

        const changed = await tx.topupOrder.updateMany({
          where: { id: order.id, paymentStatus: order.paymentStatus },
          data: {
            paymentStatus: input.status,
            ...(input.status === "PAID" ? { paidAt: new Date() } : {}),
          },
        });
        if (changed.count !== 1) return "duplicate";

        if (input.status === "PAID") {
          const now = new Date();
          await tx.nusaPointTransaction.create({
            data: {
              id: randomUUID(),
              userId: order.userId,
              amount: order.pointsAwarded,
              source: "TOPUP",
              sourceId: order.id,
              createdAt: now,
            },
          });
        }

        return "updated";
      });
    }

    const store = getEmbeddedStore();
    store.topupOrders ??= [];
    const order = store.topupOrders.find(
      (o) => o.orderNumber === input.referenceCode
    );
    if (!order) return "not_found";
    if (order.paymentMode !== input.paymentMode) return "duplicate";
    if (input.amountIdr !== null && input.amountIdr !== order.amountIdr) {
      return "amount_mismatch";
    }
    if (order.paymentStatus === "PAID") return "duplicate";
    if (order.paymentStatus !== "PENDING" && input.status !== "PAID") return "duplicate";

    const now = new Date();
    order.paymentStatus = input.status;
    order.updatedAt = now.toISOString();
    if (input.status === "PAID") {
      order.paidAt = now.toISOString();
      store.nusaPointTransactions ??= [];
      store.nusaPointTransactions.push({
        id: randomUUID(),
        userId: order.userId,
        amount: order.pointsAwarded,
        source: "TOPUP",
        sourceId: order.id,
        createdAt: now.toISOString(),
      });
    }
    persistEmbeddedStore(store);

    return "updated";
  }

  public async listUserTopupOrders(userId: string): Promise<StoredTopupOrderRecord[]> {
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.topupOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(mapPrismaTopupOrder);
    }

    const store = getEmbeddedStore();
    store.topupOrders ??= [];
    return store.topupOrders
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const topupRepository = new TopupRepositoryImpl();

