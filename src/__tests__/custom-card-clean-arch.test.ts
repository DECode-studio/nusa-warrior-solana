import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { CustomCardUseCase } from "@/client/domain/custom-card/usecase/custom_card_usecase";
import type { CustomCardRepository } from "@/client/domain/custom-card/repository/custom_card_repository";
import { getService } from "@/core/di/container";
import {
  CUSTOM_CARD_REPOSITORY_TOKEN,
  CUSTOM_CARD_USECASE_TOKEN,
} from "@/core/di/tokens";

describe("Custom Card Clean Architecture & DI Verification", () => {
  it("harus berhasil me-resolve CustomCardUseCase dan CustomCardRepository dari Needle DI container dengan dependency lengkap", async () => {
    const repository = getService(CUSTOM_CARD_REPOSITORY_TOKEN);
    const useCase = getService(CUSTOM_CARD_USECASE_TOKEN);

    expect(repository).toBeDefined();
    expect(useCase).toBeDefined();
    expect(useCase).toBeInstanceOf(CustomCardUseCase);

    // Pastikan property repository di dalam useCase tidak undefined
    expect((useCase as unknown as { repository: unknown }).repository).toBeDefined();
    expect((repository as unknown as { dataSource: unknown }).dataSource).toBeDefined();
  });

  it("CustomCardUseCase harus mendelegasikan pemanggilan getPricing ke repository", async () => {
    const mockRepo: CustomCardRepository = {
      getPricing: vi.fn().mockResolvedValue({
        balance: 3000,
        createdCount: 1,
        nextCost: 2500,
        canAfford: true,
        battlePointCap: 2100,
      }),
      prepareBurn: vi.fn(),
      createCustomCard: vi.fn(),
      listUserCustomCards: vi.fn(),
    };

    const useCase = new CustomCardUseCase(mockRepo);
    const pricing = await useCase.getPricing();

    expect(mockRepo.getPricing).toHaveBeenCalledOnce();
    expect(pricing.balance).toBe(3000);
    expect(pricing.nextCost).toBe(2500);
    expect(pricing.canAfford).toBe(true);
  });
});

