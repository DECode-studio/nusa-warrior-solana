import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getService } from "@/core/di/container";
import {
  AUTH_USECASE_TOKEN,
  BATTLE_USECASE_TOKEN,
  CARD_USECASE_TOKEN,
  DECK_USECASE_TOKEN,
  PAYMENT_GATEWAY_USECASE_TOKEN,
  SHOP_USECASE_TOKEN,
} from "@/core/di/tokens";
import { CardUseCase } from "@/client/domain/card/usecase/card_usecase";
import type { CardRepository } from "@/client/domain/card/repository/card_repository";
import { PaymentGatewayUseCase } from "@/client/domain/payment/usecase/payment_gateway_usecase";
import type { PaymentGatewayRepository } from "@/client/domain/payment/repository/payment_gateway_repository";
import {
  createCardReportUseCase,
  getCardDetailUseCase,
  listCardsUseCase,
} from "@/server/modules/card/application/card.usecase";
import {
  createDeckUseCase,
  listDecksUseCase,
} from "@/server/modules/deck/application/deck.usecase";
import {
  claimFreeStarterPackUseCase,
  getShopCatalogUseCase,
} from "@/server/modules/shop/application/shop.usecase";
import { loginWithCredentialsUseCase } from "@/server/modules/auth/application/auth.usecase";
import {
  listAdminUsersUseCase,
  updateAdminUserRoleUseCase,
  updateCardCurationUseCase,
} from "@/server/modules/admin/application/admin.usecase";

// Mock "server-only" in Vitest node environment so server usecases can be unit-tested directly
vi.mock("server-only", () => ({}));

function collectTypeScriptFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTypeScriptFiles(fullPath));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Architecture Rules, DI Container & Server/Client UseCases", () => {
  it("resolves all Client UseCases from @needle-di/core container", () => {
    expect(getService(CARD_USECASE_TOKEN)).toBeDefined();
    expect(getService(DECK_USECASE_TOKEN)).toBeDefined();
    expect(getService(BATTLE_USECASE_TOKEN)).toBeDefined();
    expect(getService(SHOP_USECASE_TOKEN)).toBeDefined();
    expect(getService(AUTH_USECASE_TOKEN)).toBeDefined();
    expect(getService(PAYMENT_GATEWAY_USECASE_TOKEN)).toBeDefined();
  });

  it("executes Client PaymentGatewayUseCase with injected mock PaymentGatewayRepository", async () => {
    const mockRepo: PaymentGatewayRepository = {
      getSettings: vi.fn().mockResolvedValue({
        globalMode: "DEV",
        updatedByUserId: null,
        updatedAt: "2026-10-30T00:00:00.000Z",
        users: [],
        totalUsers: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      updateGlobalMode: vi.fn().mockResolvedValue({
        globalMode: "PROD",
        updatedByUserId: "admin-1",
        updatedAt: "2026-10-30T01:00:00.000Z",
        users: [],
        totalUsers: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      updateUserOverride: vi.fn().mockResolvedValue({
        userId: "user-1",
        name: "Test User",
        email: "test@user.id",
        role: "PLAYER",
        paymentModeOverride: "DEV",
      }),
    };
    const useCase = new PaymentGatewayUseCase(mockRepo);
    const settings = await useCase.getSettings();
    expect(settings.globalMode).toBe("DEV");
    expect(mockRepo.getSettings).toHaveBeenCalled();

    const updated = await useCase.updateGlobalMode("PROD");
    expect(updated.globalMode).toBe("PROD");
    expect(mockRepo.updateGlobalMode).toHaveBeenCalledWith("PROD");

    const override = await useCase.updateUserOverride("user-1", "DEV");
    expect(override.paymentModeOverride).toBe("DEV");
    expect(mockRepo.updateUserOverride).toHaveBeenCalledWith("user-1", "DEV");
  });

  it("executes Client CardUseCase with injected mock CardRepository", async () => {
    const mockRepo: CardRepository = {
      getCards: vi.fn().mockResolvedValue([]),
      getCardsPaginated: vi.fn(),
      getCardBySlug: vi.fn(),
      getOwnedCards: vi.fn(),
      getOwnedCardsPaginated: vi.fn(),
      submitCorrectionReport: vi.fn(),
    };
    const useCase = new CardUseCase(mockRepo);
    const cards = await useCase.getCards({ kingdom: "MAJAPAHIT" });
    expect(cards).toEqual([]);
    expect(mockRepo.getCards).toHaveBeenCalledWith({ kingdom: "MAJAPAHIT" });
  });

  it("executes Server UseCases for Cards, Decks, and Sandbox Shop", async () => {
    const allCards = await listCardsUseCase({});
    expect(allCards.length).toBe(76);

    const hayamWuruk = await getCardDetailUseCase("hayam-wuruk");
    expect(hayamWuruk.name).toBe("Hayam Wuruk");
    expect(hayamWuruk.kingdom).toBe("MAJAPAHIT");

    const report = await createCardReportUseCase({
      cardSlug: "hayam-wuruk",
      reporterName: "Uji Kurator",
      reporterEmail: "kurator@test.id",
      category: "HISTORICAL_SOURCE",
      description: "Verifikasi silang tahun penobatan 1350 M.",
      referenceUrl: "https://kebudayaan.kemdikbud.go.id/",
    });
    expect(report.cardSlug).toBe("hayam-wuruk");
    expect(report.status).toBe("OPEN");

    const decks = await listDecksUseCase(null);
    expect(decks.length).toBeGreaterThanOrEqual(3);

    // Reject invalid deck with > 10 characters
    await expect(
      createDeckUseCase({
        name: "Deck Lebih Dari 10 Karakter",
        description: null,
        kingdomFilter: "MAJAPAHIT",
        userId: null,
        characterSlugs: [
          "raden-wijaya",
          "jayanegara",
          "tribhuwana-wijayatunggadewi",
          "hayam-wuruk",
          "gajah-mada",
          "arya-wiraraja",
          "ranggalawe",
          "lembu-sora",
          "nambi",
          "suhita",
          "wikramawardhana",
        ],
        instrumentSlugs: [],
      })
    ).rejects.toThrow(/10 kartu Karakter/);

    // Reject deck with more than 10 instruments
    await expect(
      createDeckUseCase({
        name: "Too Many Instruments Deck",
        description: "Deck dengan 11 waditra",
        kingdomFilter: "MIXED",
        userId: null,
        characterSlugs: ["raden-wijaya"],
        instrumentSlugs: [
          "padahi",
          "regang",
          "kendang",
          "bonang",
          "gambang",
          "kenong",
          "demung",
          "peking",
          "calung",
          "terebang",
          "kecrek",
        ],
      })
    ).rejects.toThrow(/10 kartu Waditra/);

    // Accept valid deck with 8 characters (<= 10) and 10 instruments (<= 10, total <= 20)
    const valid8CharDeck = await createDeckUseCase({
      name: "Tormentor Deck",
      description: "Deck dengan 8 karakter dan 10 waditra",
      kingdomFilter: "MIXED",
      userId: null,
      characterSlugs: [
        "raden-wijaya",
        "jayanegara",
        "tribhuwana-wijayatunggadewi",
        "hayam-wuruk",
        "gajah-mada",
        "ranggalawe",
        "lembu-sora",
        "nambi",
      ],
      instrumentSlugs: [
        "padahi",
        "regang",
        "kendang",
        "bonang",
        "gambang",
        "kenong",
        "demung",
        "peking",
        "calung",
        "terebang",
      ],
    });
    expect(valid8CharDeck.characterSlugs.length).toBe(8);
    expect(valid8CharDeck.instrumentSlugs.length).toBe(10);

    const shopCatalog = await getShopCatalogUseCase();
    expect(shopCatalog.packs.length).toBe(4);
    expect(shopCatalog.packs[0]?.isStarter).toBe(true);
    expect(shopCatalog.packs[0]?.code).toBe("PACK-STARTER-BEGINNER");

    const starterPack = shopCatalog.packs.find((p) => p.isStarter);
    expect(starterPack).toBeDefined();
    expect(starterPack?.imagePath).toBe("/assets/pack/pack-starter.png");

    // Test Free Starter Claim (First Claim)
    const testUserId = `usr-test-claim-${Date.now()}`;
    const freeClaim = await claimFreeStarterPackUseCase(testUserId);
    expect(freeClaim.amountIdr).toBe(0);
    expect(freeClaim.paymentStatus).toBe("PAID");
    expect(freeClaim.drawnCards?.length).toBe(20);

    // Test Second Free Claim is rejected
    await expect(claimFreeStarterPackUseCase(testUserId)).rejects.toThrow(
      /sudah pernah diklaim/
    );
  });

  it("enforces Zero `any` and strict Client/Server import boundaries across src/", () => {
    const srcDir = path.join(process.cwd(), "src");
    const allSourceFiles = collectTypeScriptFiles(srcDir);
    expect(allSourceFiles.length).toBeGreaterThan(40);

    const anyViolations: string[] = [];
    const boundaryViolations: string[] = [];

    const anyRegex = /(:\s*any\b|\bas\s+any\b|<any>)/;

    for (const filePath of allSourceFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const rel = path.relative(process.cwd(), filePath);

      if (anyRegex.test(content)) {
        anyViolations.push(rel);
      }

      if (rel.startsWith("src/client/")) {
        if (
          content.includes("@prisma/client") ||
          content.includes("@/server/")
        ) {
          boundaryViolations.push(rel);
        }
      }
    }

    expect(anyViolations).toEqual([]);
    expect(boundaryViolations).toEqual([]);
  });

  it("enforces the 3 presentation view categories (public, user, admin) and .env Admin authentication", async () => {
    const viewsDir = path.join(
      process.cwd(),
      "src/client/presentation/views"
    );
    const categoryDirs = fs
      .readdirSync(viewsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    expect(categoryDirs).toEqual(["admin", "public", "user"]);

    // Verify .env Admin login enforcement
    process.env.JWT_SECRET = "01a178ca-db7a-7799-a17b-2e188c76af25";
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "Nusantara2026!";

    await expect(
      loginWithCredentialsUseCase({
        mode: "ADMIN",
        username: "admin",
        password: "wrong-password",
      })
    ).rejects.toThrow(/ADMIN_USERNAME|ADMIN_PASSWORD|tidak sesuai/);

    const adminAuth = await loginWithCredentialsUseCase({
      mode: "ADMIN",
      username: "admin",
      password: "Nusantara2026!",
    });
    expect(adminAuth.user.role).toBe("ADMIN");

    const users = await listAdminUsersUseCase();
    expect(users.length).toBeGreaterThanOrEqual(1);
    const updatedUser = await updateAdminUserRoleUseCase({
      userId: users[0].id,
      role: "CURATOR",
    });
    expect(updatedUser.role).toBe("CURATOR");

    // Verify card curation update with descriptions
    const cards = await listCardsUseCase({});
    expect(cards.length).toBeGreaterThanOrEqual(1);
    const targetSlug = cards[0].slug;
    const updatedCard = await updateCardCurationUseCase({
      cardSlug: targetSlug,
      historicalSummaryId: "Ringkasan sejarah yang baru diperbarui.",
      historicalSummaryEn: "Updated historical summary in English.",
      historicalSummaryZh: "更新的历史摘要。",
      effectName: "Efek Baru",
      effectDescriptionId: "Deskripsi efek baru.",
    });
    expect(updatedCard.historicalSummaryId).toBe("Ringkasan sejarah yang baru diperbarui.");
    expect(updatedCard.historicalSummaryEn).toBe("Updated historical summary in English.");
    expect(updatedCard.historicalSummaryZh).toBe("更新的历史摘要。");
    expect(updatedCard.effectName).toBe("Efek Baru");
    expect(updatedCard.effectDescriptionId).toBe("Deskripsi efek baru.");
  });
});

