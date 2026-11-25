import "server-only";
import { getEmbeddedStore, persistEmbeddedStore } from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import type {
  PaymentGatewaySettings,
  PaymentGatewayUserOverride,
  PaymentGatewayUserQueryFilter,
  PaymentMode,
  PaymentRepository,
} from "../domain/payment.repository";

const SETTINGS_ID = "global";

export class PaymentRepositoryImpl implements PaymentRepository {
  public async getSettings(
    filter?: PaymentGatewayUserQueryFilter
  ): Promise<PaymentGatewaySettings> {
    const page = Math.max(1, filter?.page ?? 1);
    const limit = Math.max(1, Math.min(100, filter?.limit ?? 10));

    if (isPrismaDriverEnabled()) {
      const search = filter?.search?.trim();
      const userWhere = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { walletAddress: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [setting, totalUsers, users] = await Promise.all([
        prisma.paymentGatewaySetting.upsert({
          where: { id: SETTINGS_ID },
          create: { id: SETTINGS_ID, globalMode: "DEV" },
          update: {},
        }),
        prisma.user.count({ where: userWhere }),
        prisma.user.findMany({
          where: userWhere,
          select: {
            id: true,
            name: true,
            walletAddress: true,
            role: true,
            paymentModeOverride: true,
          },
          orderBy: [{ name: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
      return {
        globalMode: setting.globalMode,
        updatedByUserId: setting.updatedByUserId,
        updatedAt: setting.updatedAt.toISOString(),
        users: users.map((user) => ({
          userId: user.id,
          name: user.name,
          walletAddress: user.walletAddress ?? null,
          role: user.role,
          paymentModeOverride: user.paymentModeOverride,
        })),
        totalUsers,
        page,
        limit,
        totalPages,
      };
    }

    const store = getEmbeddedStore();
    let userList = store.users;
    const search = filter?.search?.trim().toLowerCase();
    if (search) {
      userList = userList.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          (u.walletAddress ?? "").toLowerCase().includes(search) ||
          u.role.toLowerCase().includes(search)
      );
    }

    const totalUsers = userList.length;
    const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
    const sorted = [...userList].sort((a, b) => a.name.localeCompare(b.name));
    const sliced = sorted.slice((page - 1) * limit, page * limit);

    return {
      ...store.paymentGatewaySetting,
      users: sliced.map((user) => ({
        userId: user.id,
        name: user.name,
        walletAddress: user.walletAddress ?? null,
        role: user.role,
        paymentModeOverride: user.paymentModeOverride ?? null,
      })),
      totalUsers,
      page,
      limit,
      totalPages,
    };
  }

  public async setGlobalMode(mode: PaymentMode, adminUserId: string): Promise<PaymentGatewaySettings> {
    if (mode === "PROD" && !isPrismaDriverEnabled()) {
      throw AppError.badRequest("Mode PROD membutuhkan penyimpanan Prisma yang persisten.");
    }
    const now = new Date();
    if (isPrismaDriverEnabled()) {
      await prisma.paymentGatewaySetting.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, globalMode: mode, updatedByUserId: adminUserId },
        update: { globalMode: mode, updatedByUserId: adminUserId },
      });
    } else {
      const store = getEmbeddedStore();
      store.paymentGatewaySetting = {
        globalMode: mode,
        updatedByUserId: adminUserId,
        updatedAt: now.toISOString(),
      };
      persistEmbeddedStore(store);
    }
    return this.getSettings();
  }

  public async setUserOverride(userId: string, mode: PaymentMode | null): Promise<PaymentGatewayUserOverride> {
    if (mode === "PROD" && !isPrismaDriverEnabled()) {
      throw AppError.badRequest("Mode PROD membutuhkan penyimpanan Prisma yang persisten.");
    }
    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { paymentModeOverride: mode },
        select: { id: true, name: true, walletAddress: true, role: true, paymentModeOverride: true },
      }).catch((error: unknown) => {
        if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
          throw AppError.notFound("Akun pengguna tidak ditemukan.");
        }
        throw error;
      });
      return {
        userId: user.id,
        name: user.name,
        walletAddress: user.walletAddress ?? null,
        role: user.role,
        paymentModeOverride: user.paymentModeOverride,
      };
    }

    const store = getEmbeddedStore();
    const user = store.users.find((item) => item.id === userId);
    if (!user) throw AppError.notFound("Akun pengguna tidak ditemukan.");
    user.paymentModeOverride = mode;
    persistEmbeddedStore(store);
    return {
      userId: user.id,
      name: user.name,
      walletAddress: user.walletAddress ?? null,
      role: user.role,
      paymentModeOverride: mode,
    };
  }

  public async resolveModeForUser(userId: string): Promise<PaymentMode> {
    if (isPrismaDriverEnabled()) {
      const [user, setting] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { paymentModeOverride: true } }),
        prisma.paymentGatewaySetting.upsert({
          where: { id: SETTINGS_ID },
          create: { id: SETTINGS_ID, globalMode: "DEV" },
          update: {},
        }),
      ]);
      if (!user) throw AppError.notFound("Akun pengguna tidak ditemukan.");
      return user.paymentModeOverride ?? setting.globalMode;
    }
    const store = getEmbeddedStore();
    const user = store.users.find((item) => item.id === userId);
    if (!user) throw AppError.notFound("Akun pengguna tidak ditemukan.");
    const mode = user.paymentModeOverride ?? store.paymentGatewaySetting.globalMode;
    if (mode === "PROD") {
      throw AppError.badRequest("Mode PROD mensyaratkan penyimpanan Prisma aktif.");
    }
    return mode;
  }
}

export const paymentRepository: PaymentRepository = new PaymentRepositoryImpl();
