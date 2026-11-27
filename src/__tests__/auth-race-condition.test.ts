import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  clearAuthRefreshCache,
  isAuthMutationInProgress,
  refreshAuthSession,
  runWithAuthMutationLock,
} from "@/core/http-client/auth-refresh";
import {
  consumeDistributedRateLimit,
  resetDistributedRateLimit,
} from "@/server/shared/http/distributed-rate-limit";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function createLockCoordinator(): {
  request: <T>(name: string, callback: () => Promise<T>) => Promise<T>;
} {
  const tails = new Map<string, Promise<unknown>>();
  return {
    request<T>(name: string, callback: () => Promise<T>): Promise<T> {
      const previous = tails.get(name) ?? Promise.resolve();
      const next = previous.then(callback, callback);
      const settled = next.then(
        () => undefined,
        () => undefined
      );
      tails.set(name, settled);
      return next;
    },
  };
}

describe("Auth Rate Limit Reset", () => {
  const prevDriver = process.env.NUSANTARA_STORAGE_DRIVER;

  beforeEach(() => {
    process.env.NUSANTARA_STORAGE_DRIVER = "embedded";
  });

  afterEach(() => {
    if (prevDriver === undefined) {
      delete process.env.NUSANTARA_STORAGE_DRIVER;
    } else {
      process.env.NUSANTARA_STORAGE_DRIVER = prevDriver;
    }
  });

  it("resets only the targeted rate limit bucket and restores capacity", async () => {
    const targetKey = `auth:admin-login:127.0.0.1:admin-${Date.now()}`;
    const otherKey = `auth:admin-login:127.0.0.1:other-${Date.now()}`;
    const policy = { capacity: 2, refillPerSecond: 1 / 300 };

    expect((await consumeDistributedRateLimit(targetKey, policy)).allowed).toBe(true);
    expect((await consumeDistributedRateLimit(targetKey, policy)).allowed).toBe(true);
    expect((await consumeDistributedRateLimit(targetKey, policy)).allowed).toBe(false);

    expect((await consumeDistributedRateLimit(otherKey, policy)).allowed).toBe(true);
    expect((await consumeDistributedRateLimit(otherKey, policy)).allowed).toBe(true);
    expect((await consumeDistributedRateLimit(otherKey, policy)).allowed).toBe(false);

    await resetDistributedRateLimit(targetKey);

    expect((await consumeDistributedRateLimit(targetKey, policy)).allowed).toBe(true);
    expect((await consumeDistributedRateLimit(otherKey, policy)).allowed).toBe(false);
  });
});

describe("Auth Refresh & Mutation Lock Race Protection", () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    const locks = createLockCoordinator();
    vi.stubGlobal("window", { localStorage: storage });
    vi.stubGlobal("navigator", { locks });
    clearAuthRefreshCache();
  });

  afterEach(() => {
    clearAuthRefreshCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("serializes auth mutations after an in-flight refresh and suppresses non-forced refreshes during mutation", async () => {
    const events: string[] = [];
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        events.push("refresh:fetch-start");
        await refreshGate;
        events.push("refresh:fetch-end");
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      })
    );

    const refreshPromise = refreshAuthSession({ force: true });
    await vi.waitFor(() => {
      expect(events).toContain("refresh:fetch-start");
    });

    const mutationPromise = runWithAuthMutationLock(async () => {
      events.push("mutation:run");
      expect(isAuthMutationInProgress()).toBe(true);
      // Non-forced refresh attempted during an active login/logout mutation must be suppressed.
      const suppressed = await refreshAuthSession();
      expect(suppressed).toBe(false);
      return "logged-in";
    });

    // Mutation must wait for the in-flight refresh lock to settle.
    await Promise.resolve();
    expect(events).not.toContain("mutation:run");

    releaseRefresh();
    expect(await refreshPromise).toBe(true);
    expect(await mutationPromise).toBe("logged-in");
    expect(isAuthMutationInProgress()).toBe(false);
    expect(events).toEqual([
      "refresh:fetch-start",
      "refresh:fetch-end",
      "mutation:run",
    ]);
  });

  it("throttles cross-tab proactive refreshes using localStorage timestamp", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await refreshAuthSession({ minIntervalMs: 300_000 });
    expect(first).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Simulate another tab calling refreshAuthSession within minIntervalMs (even if per-tab cache is cleared).
    window.localStorage.setItem("nusa-auth-last-refresh-at", String(Date.now()));
    // Reset only in-memory cache by running a separate import-free check via forcing a stale timestamp?
    // Clear in-memory cache first, then restore the cross-tab timestamp.
    clearAuthRefreshCache();
    window.localStorage.setItem("nusa-auth-last-refresh-at", String(Date.now()));

    const second = await refreshAuthSession({ minIntervalMs: 300_000 });
    expect(second).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects stale non-forced refresh result when an auth mutation advances last-mutation timestamp", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        // Simulate an auth mutation completing in another tab while this refresh request was in flight.
        window.localStorage.setItem(
          "nusa-auth-last-mutation-at",
          String(Date.now() + 10)
        );
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      })
    );

    const result = await refreshAuthSession();
    expect(result).toBe(false);
  });
});
