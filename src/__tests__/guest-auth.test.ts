import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Provide JWT_SECRET for session creation
process.env.JWT_SECRET = "super-secure-production-jwt-secret-min-32-chars-test";

import {
  cleanupInactiveGuestsUseCase,
  loginAsGuestUseCase,
} from "@/server/modules/auth/application/auth.usecase";
import { authRepository } from "@/server/modules/auth/infrastructure/auth.repository.impl";
import { getEmbeddedStore } from "@/server/shared/db/embedded-store";

describe("Guest Authentication & Inactivity Cleanup", () => {
  it("creates a new guest user with isGuest flag and valid session payload", async () => {
    const result = await loginAsGuestUseCase();

    expect(result.user).toBeDefined();
    expect(result.user.role).toBe("PLAYER");
    expect(result.user.isGuest).toBe(true);
    expect(result.user.name).toMatch(/^Guest #\d{4}$/);
    expect(result.user.email).toContain("@guest.local");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // Verify user exists in repository
    const found = await authRepository.findById(result.user.userId);
    expect(found).not.toBeNull();
    expect(found?.isGuest).toBe(true);
  });

  it("cleans up guest accounts that have been inactive for more than 2 days", async () => {
    // Create an old inactive guest in embedded store
    const store = getEmbeddedStore();
    const threeDaysAgoIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const oldGuestId = `usr-guest-old-${Date.now()}`;

    store.users.push({
      id: oldGuestId,
      email: `old_${Date.now()}@guest.local`,
      name: "Guest #9999",
      passwordHash: "",
      role: "PLAYER",
      isGuest: true,
      lastActiveAt: threeDaysAgoIso,
      createdAt: threeDaysAgoIso,
    });

    // Also create an active guest
    const recentIso = new Date().toISOString();
    const activeGuestId = `usr-guest-active-${Date.now()}`;
    store.users.push({
      id: activeGuestId,
      email: `active_${Date.now()}@guest.local`,
      name: "Guest #1111",
      passwordHash: "",
      role: "PLAYER",
      isGuest: true,
      lastActiveAt: recentIso,
      createdAt: recentIso,
    });

    // Run cleanup
    const cleanupResult = await cleanupInactiveGuestsUseCase();
    expect(cleanupResult.deletedUsers).toBeGreaterThanOrEqual(1);

    // Old guest should be gone
    const oldFound = await authRepository.findById(oldGuestId);
    expect(oldFound).toBeNull();

    // Active guest should still exist
    const activeFound = await authRepository.findById(activeGuestId);
    expect(activeFound).not.toBeNull();
  });

  it("updates lastActiveAt when touchLastActiveAt is called", async () => {
    const guest = await authRepository.createGuestUser({
      name: "Guest #5555",
      email: `touch_${Date.now()}@guest.local`,
    });

    await authRepository.touchLastActiveAt(guest.id);
    const updated = await authRepository.findById(guest.id);

    expect(updated?.lastActiveAt).toBeDefined();
  });
});

