import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CUSTOM_CARD_POLICY,
  getCustomCardCost,
} from "@/server/modules/nusa-points/domain/nusa-point-policy";

describe("Custom Card Policy & Pricing Logic", () => {
  it("harus memberikan gratis pada kartu ke-1, 2500 NP pada kartu ke-2, dan 5000 NP seterusnya", () => {
    // Kartu ke-1 (user belum punya kartu custom)
    expect(getCustomCardCost(0)).toBe(0);

    // Kartu ke-2 (user sudah punya 1 kartu custom)
    expect(getCustomCardCost(1)).toBe(2500);

    // Kartu ke-3 dan seterusnya
    expect(getCustomCardCost(2)).toBe(5000);
    expect(getCustomCardCost(5)).toBe(5000);
  });

  it("harus memiliki batas Battle Point default 2.100 BP", () => {
    expect(CUSTOM_CARD_POLICY.defaultBattlePointCap).toBe(2100);
    expect(CUSTOM_CARD_POLICY.minAttack).toBe(100);
    expect(CUSTOM_CARD_POLICY.minDefense).toBe(100);

    // Verifikasi alokasi yang valid (<= 2100)
    const validAtk = 1100;
    const validDef = 1000;
    expect(validAtk + validDef).toBeLessThanOrEqual(CUSTOM_CARD_POLICY.defaultBattlePointCap);

    // Verifikasi alokasi melebihi cap (> 2100)
    const overAtk = 1200;
    const overDef = 1000;
    expect(overAtk + overDef).toBeGreaterThan(CUSTOM_CARD_POLICY.defaultBattlePointCap);
  });
});

