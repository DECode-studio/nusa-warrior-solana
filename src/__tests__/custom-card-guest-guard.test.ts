import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requireAuthSession } from "@/server/shared/auth/authorization";
import * as sessionModule from "@/server/shared/auth/session";

describe("Auth Session Guard", () => {
  it("harus menolak sesi kosong dan melempar AppError.unauthorized (401)", async () => {
    vi.spyOn(sessionModule, "getCurrentSession").mockResolvedValue(null);

    await expect(requireAuthSession()).rejects.toThrow(
      "Silakan hubungkan dompet Solana Anda untuk melanjutkan."
    );
  });

  it("harus mengizinkan akun dompet Solana yang terautentikasi", async () => {
    vi.spyOn(sessionModule, "getCurrentSession").mockResolvedValue({
      userId: "player-user-123",
      walletAddress: "11111111111111111111111111111111",
      name: "Pendekar Sejati",
      role: "PLAYER",
    });

    const session = await requireAuthSession();
    expect(session.userId).toBe("player-user-123");
    expect(session.walletAddress).toBe("11111111111111111111111111111111");
  });
});
