import { describe, expect, it, vi } from "vitest";
import { ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT } from "@/client/presentation/views/admin/payment-gateway/constants/TextConstant";
import { ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS } from "@/client/presentation/views/admin/payment-gateway/constants/SemanticIdConstant";
import { getService } from "@/core/di/container";
import {
  PAYMENT_GATEWAY_REPOSITORY_TOKEN,
  PAYMENT_GATEWAY_USECASE_TOKEN,
} from "@/core/di/tokens";
import { PaymentGatewayUseCase } from "@/client/domain/payment/usecase/payment_gateway_usecase";
import type { PaymentGatewayRepository } from "@/client/domain/payment/repository/payment_gateway_repository";
import type { PaymentGatewaySettingsEntity } from "@/client/domain/payment/entity/payment_gateway_entity";
import { PaymentGatewayRepositoryImpl } from "@/client/data/payment/repository/payment_gateway_repository_impl";
import type { PaymentGatewayRemoteDataSource } from "@/client/data/payment/datasource/payment_gateway_remote_datasource";
import {
  toPaymentGatewaySettingsEntity,
  toPaymentGatewayUserEntity,
  type PaymentGatewaySettingsApiModel,
  type PaymentGatewayUserApiModel,
} from "@/client/data/payment/model/payment_gateway_model";

const mockInitialSettings: PaymentGatewaySettingsEntity = {
  globalMode: "DEV",
  updatedByUserId: "admin-1",
  updatedAt: "2026-10-30T10:00:00.000Z",
  totalUsers: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
  users: [
    {
      userId: "usr-1",
      name: "Budi Santoso",
      walletAddress: "11111111111111111111111111111111",
      role: "PLAYER",
      paymentModeOverride: null,
    },
    {
      userId: "usr-2",
      name: "Siti Rahma",
      walletAddress: null,
      role: "CURATOR",
      paymentModeOverride: "PROD",
    },
  ],
};

describe("AdminPaymentGateway Architecture, Domain & Data Layer", () => {
  it("resolves PaymentGatewayUseCase and PaymentGatewayRepository from DI container", () => {
    const useCase = getService(PAYMENT_GATEWAY_USECASE_TOKEN);
    const repo = getService(PAYMENT_GATEWAY_REPOSITORY_TOKEN);
    expect(useCase).toBeDefined();
    expect(repo).toBeDefined();
  });

  it("executes PaymentGatewayUseCase methods with mock repository", async () => {
    const mockRepo: PaymentGatewayRepository = {
      getSettings: vi.fn().mockResolvedValue(mockInitialSettings),
      updateGlobalMode: vi.fn().mockImplementation(async (mode) => ({
        ...mockInitialSettings,
        globalMode: mode,
      })),
      updateUserOverride: vi.fn().mockImplementation(async (userId, mode) => {
        const found = mockInitialSettings.users.find((u) => u.userId === userId);
        return {
          userId,
          name: found?.name ?? "User",
          walletAddress: found?.walletAddress ?? null,
          role: found?.role ?? "PLAYER",
          paymentModeOverride: mode,
        };
      }),
    };

    const useCase = new PaymentGatewayUseCase(mockRepo);

    const settings = await useCase.getSettings({ page: 1, limit: 10, search: "budi" });
    expect(settings.globalMode).toBe("DEV");
    expect(settings.users.length).toBe(2);
    expect(mockRepo.getSettings).toHaveBeenCalledWith({ page: 1, limit: 10, search: "budi" });

    const updatedGlobal = await useCase.updateGlobalMode("PROD");
    expect(updatedGlobal.globalMode).toBe("PROD");
    expect(mockRepo.updateGlobalMode).toHaveBeenCalledWith("PROD");

    const updatedOverride = await useCase.updateUserOverride("usr-1", "PROD");
    expect(updatedOverride.userId).toBe("usr-1");
    expect(updatedOverride.paymentModeOverride).toBe("PROD");
    expect(mockRepo.updateUserOverride).toHaveBeenCalledWith("usr-1", "PROD");
  });

  it("maps API model to domain entity in PaymentGatewayRepositoryImpl", async () => {
    const mockDataSource: PaymentGatewayRemoteDataSource = {
      getSettings: vi.fn().mockResolvedValue({
        globalMode: "DEV",
        updatedByUserId: "adm-9",
        updatedAt: "2026-10-30T12:00:00.000Z",
        totalUsers: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        users: [
          {
            userId: "u-1",
            name: "Gajah Mada",
            walletAddress: null,
            role: "ADMIN",
            paymentModeOverride: null,
          },
        ],
      }),
      updateGlobalMode: vi.fn().mockResolvedValue({
        globalMode: "PROD",
        updatedByUserId: "adm-9",
        updatedAt: "2026-10-30T12:05:00.000Z",
        totalUsers: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        users: [],
      }),
      updateUserOverride: vi.fn().mockResolvedValue({
        userId: "u-1",
        name: "Gajah Mada",
        walletAddress: null,
        role: "ADMIN",
        paymentModeOverride: "DEV",
      }),
    };

    const repoImpl = new PaymentGatewayRepositoryImpl(mockDataSource);
    const settings = await repoImpl.getSettings({ page: 1, limit: 10 });
    expect(settings.globalMode).toBe("DEV");
    expect(settings.users[0]?.name).toBe("Gajah Mada");
    expect(settings.totalUsers).toBe(1);
    expect(mockDataSource.getSettings).toHaveBeenCalledWith({ page: 1, limit: 10 });

    const globalUpdate = await repoImpl.updateGlobalMode("PROD");
    expect(globalUpdate.globalMode).toBe("PROD");

    const userOverride = await repoImpl.updateUserOverride("u-1", "DEV");
    expect(userOverride.paymentModeOverride).toBe("DEV");
  });

  it("converts PaymentGateway model objects to clean immutable entities", () => {
    const userApi: PaymentGatewayUserApiModel = {
      userId: "usr-42",
      name: "Tribhuwana",
      walletAddress: null,
      role: "ADMIN",
      paymentModeOverride: "PROD",
    };
    const userEntity = toPaymentGatewayUserEntity(userApi);
    expect(userEntity).toEqual({
      userId: "usr-42",
      name: "Tribhuwana",
      walletAddress: null,
      role: "ADMIN",
      paymentModeOverride: "PROD",
    });

    const settingsApi: PaymentGatewaySettingsApiModel = {
      globalMode: "DEV",
      updatedByUserId: null,
      updatedAt: "2026-10-30T15:00:00.000Z",
      totalUsers: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      users: [userApi],
    };
    const settingsEntity = toPaymentGatewaySettingsEntity(settingsApi);
    expect(settingsEntity.globalMode).toBe("DEV");
    expect(settingsEntity.users.length).toBe(1);
    expect(settingsEntity.totalUsers).toBe(1);
    expect(settingsEntity.page).toBe(1);
    expect(settingsEntity.users[0]?.name).toBe("Tribhuwana");
  });

  it("has valid Semantic ID constants and Text constants matching design conventions", () => {
    expect(ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.ROOT).toBe("admin-payment-gateway-view-root");
    expect(ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.GLOBAL_CARD).toBe("admin-payment-gateway-global-card");
    expect(ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.USERS_CARD).toBe("admin-payment-gateway-users-card");
    expect(ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.PAGINATION).toBe("admin-payment-gateway-pagination");

    expect(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.TITLE).toBe("paymentGateway.title");
    expect(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.GLOBAL_TITLE).toBe("paymentGateway.globalTitle");
    expect(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SAVED).toBe("paymentGateway.saved");
  });
});
