import { describe, expect, it, vi } from "vitest";

// Mock "server-only" in Vitest node environment so server usecases can be unit-tested directly
vi.mock("server-only", () => ({}));

import {
  listCardsPaginatedUseCase,
  listCardsUseCase,
} from "@/server/modules/card/application/card.usecase";
import {
  listAdminCardsPaginatedUseCase,
  listAdminUsersPaginatedUseCase,
} from "@/server/modules/admin/application/admin.usecase";
import { getPaymentGatewaySettingsUseCase } from "@/server/modules/payment/application/payment.usecase";
import { translator } from "@/core/translator";

describe("Cards Catalog Pagination & Caching Requirements", () => {
  it("returns all 76 cards when pagination parameters are not provided", async () => {
    const allCards = await listCardsUseCase({});
    expect(allCards.length).toBe(76);
  });

  it("returns sliced cards when page and limit are provided (Page 1)", async () => {
    const page1Cards = await listCardsUseCase({ page: 1, limit: 10 });
    expect(page1Cards.length).toBe(10);
    expect(page1Cards[0].code).toBe("MJP-01");
    expect(page1Cards[9].code).toBe("MJP-10");
  });

  it("returns the second page of cards accurately (Page 2)", async () => {
    const page2Cards = await listCardsUseCase({ page: 2, limit: 10 });
    expect(page2Cards.length).toBe(10);
    expect(page2Cards[0].code).toBe("MJP-11");
    expect(page2Cards[9].code).toBe("PJJ-20");
  });

  it("handles the last page correctly when count is not a full page", async () => {
    // 76 cards with limit 25 => Page 1 (25), Page 2 (25), Page 3 (25), Page 4 (1)
    const page4Cards = await listCardsUseCase({ page: 4, limit: 25 });
    expect(page4Cards.length).toBe(1);
  });

  it("returns empty array when requested page exceeds total items", async () => {
    const outOfBounds = await listCardsUseCase({ page: 10, limit: 20 });
    expect(outOfBounds).toEqual([]);
  });

  it("combines filter (e.g. MAJAPAHIT) with pagination parameters", async () => {
    const allMajapahit = await listCardsUseCase({ kingdom: "MAJAPAHIT" });
    const pagedMajapahit = await listCardsUseCase({ kingdom: "MAJAPAHIT", page: 1, limit: 5 });
    expect(pagedMajapahit.length).toBe(5);
    expect(pagedMajapahit[0].id).toBe(allMajapahit[0].id);
    expect(pagedMajapahit[4].id).toBe(allMajapahit[4].id);
  });

  it("translates pagination keys across ID, EN, and ZH locales", () => {
    // Indonesian
    expect(translator.t("common.pagination.previous", "id")).toBe("Sebelumnya");
    expect(translator.t("common.pagination.next", "id")).toBe("Berikutnya");
    expect(
      translator.t("common.pagination.showing", "id", {
        start: 1,
        end: 12,
        total: 60,
        label: "kartu",
      })
    ).toBe("Menampilkan 1–12 dari 60 kartu");

    // English
    expect(translator.t("common.pagination.previous", "en")).toBe("Previous");
    expect(translator.t("common.pagination.next", "en")).toBe("Next");
    expect(
      translator.t("common.pagination.showing", "en", {
        start: 1,
        end: 12,
        total: 60,
        label: "cards",
      })
    ).toBe("Showing 1–12 of 60 cards");

    // Chinese
    expect(translator.t("common.pagination.previous", "zh")).toBe("上一页");
    expect(translator.t("common.pagination.next", "zh")).toBe("下一页");
    expect(
      translator.t("common.pagination.showing", "zh", {
        start: 1,
        end: 12,
        total: 60,
        label: "张卡牌",
      })
    ).toBe("显示 1–12 / 共 60 张卡牌");
  });

  it("executes listCardsPaginatedUseCase returning metadata (total, totalPages, items)", async () => {
    const res = await listCardsPaginatedUseCase({ page: 1, limit: 12 });
    expect(res.total).toBe(76);
    expect(res.totalPages).toBe(7);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(12);
    expect(res.items.length).toBe(12);
  });

  it("executes listAdminCardsPaginatedUseCase with search and pagination", async () => {
    const res = await listAdminCardsPaginatedUseCase({ page: 1, limit: 10, search: "Gajah Mada" });
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.items[0].name).toContain("Gajah Mada");
    expect(res.page).toBe(1);
    expect(res.limit).toBe(10);
  });

  it("executes listAdminUsersPaginatedUseCase with pagination metadata", async () => {
    const res = await listAdminUsersPaginatedUseCase({ page: 1, limit: 5 });
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(5);
    expect(res.totalPages).toBeGreaterThanOrEqual(1);
    expect(res.items.length).toBeLessThanOrEqual(5);
  });

  it("executes getPaymentGatewaySettingsUseCase with user list pagination", async () => {
    const res = await getPaymentGatewaySettingsUseCase({ page: 1, limit: 5 });
    expect(res.globalMode).toBeDefined();
    expect(res.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(5);
    expect(res.totalPages).toBeGreaterThanOrEqual(1);
    expect(res.users.length).toBeLessThanOrEqual(5);
  });
});
