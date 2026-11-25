import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requireAuthSession } from "@/server/shared/auth/authorization";
import * as sessionModule from "@/server/shared/auth/session";

describe("Custom Card Guest Guard", () => {
  it("harus menolak akun guest dan melempar AppError.forbidden (403)", async () => {
    vi.spyOn(sessionModule, "getCurrentSession").mockResolvedValue({
      userId: "guest-user-123",
      email: "guest@nusantara.local",
      name: "Tamu Pendekar",
      role: "PLAYER",
      isGuest: true,
    });

    await expect(requireAuthSession()).rejects.toThrow(
      "Mode tamu tidak dapat menggunakan fitur ini. Silakan hubungkan akun Google Anda."
    );
  });

  it("harus mengizinkan akun non-guest", async () => {
    vi.spyOn(sessionModule, "getCurrentSession").mockResolvedValue({
      userId: "player-user-123",
      email: "pendekar@gmail.com",
      name: "Pendekar Sejati",
      role: "PLAYER",
      isGuest: false,
    });

    const session = await requireAuthSession();
    expect(session.userId).toBe("player-user-123");
    expect(session.isGuest).toBe(false);
  });
});

