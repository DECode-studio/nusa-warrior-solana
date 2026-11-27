"use client";

const REFRESH_COOLDOWN_MS = 5_000;
const REFRESH_LOCK_NAME = "nusa-auth-refresh";
const LAST_REFRESH_STORAGE_KEY = "nusa-auth-last-refresh-at";
const LAST_MUTATION_STORAGE_KEY = "nusa-auth-last-mutation-at";

let inFlightRefresh: Promise<boolean> | null = null;
let lastResult: { ok: boolean; at: number } | null = null;
let authMutationInProgress = 0;

function readStorageTimestamp(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeStorageTimestamp(key: string, ts: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(ts));
  } catch {
    // Ignore storage quota or private mode failures
  }
}

function removeStorageKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage access failures
  }
}

async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (
    typeof navigator !== "undefined" &&
    "locks" in navigator &&
    navigator.locks &&
    typeof navigator.locks.request === "function"
  ) {
    try {
      return await navigator.locks.request(REFRESH_LOCK_NAME, task);
    } catch {
      return task();
    }
  }

  return task();
}

export function isAuthMutationInProgress(): boolean {
  return authMutationInProgress > 0;
}

export async function runWithAuthMutationLock<T>(
  operation: () => Promise<T>
): Promise<T> {
  authMutationInProgress += 1;
  lastResult = null;
  removeStorageKey(LAST_REFRESH_STORAGE_KEY);

  try {
    return await withRefreshLock(async () => {
      if (inFlightRefresh) {
        await inFlightRefresh.catch(() => false);
      }
      return operation();
    });
  } finally {
    writeStorageTimestamp(LAST_MUTATION_STORAGE_KEY, Date.now());
    lastResult = null;
    authMutationInProgress = Math.max(0, authMutationInProgress - 1);
  }
}

async function executeRefreshRequest(options?: {
  force?: boolean;
  minIntervalMs?: number;
}): Promise<boolean> {
  return withRefreshLock(async () => {
    if (!options?.force && authMutationInProgress > 0) {
      return false;
    }

    if (!options?.force && options?.minIntervalMs) {
      const lastCrossTabAt = readStorageTimestamp(LAST_REFRESH_STORAGE_KEY);
      if (lastCrossTabAt > 0 && Date.now() - lastCrossTabAt < options.minIntervalMs) {
        return true;
      }
    }

    const mutationBefore = readStorageTimestamp(LAST_MUTATION_STORAGE_KEY);
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });

      if (
        !options?.force &&
        readStorageTimestamp(LAST_MUTATION_STORAGE_KEY) > mutationBefore
      ) {
        return false;
      }

      if (response.ok) {
        writeStorageTimestamp(LAST_REFRESH_STORAGE_KEY, Date.now());
        return true;
      }

      return false;
    } catch {
      return false;
    }
  });
}

export function clearAuthRefreshCache(): void {
  lastResult = null;
  removeStorageKey(LAST_REFRESH_STORAGE_KEY);
}

export function refreshAuthSession(options?: {
  force?: boolean;
  minIntervalMs?: number;
}): Promise<boolean> {
  if (!options?.force && authMutationInProgress > 0) {
    return Promise.resolve(false);
  }

  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  if (
    !options?.force &&
    lastResult &&
    Date.now() - lastResult.at < REFRESH_COOLDOWN_MS
  ) {
    return Promise.resolve(lastResult.ok);
  }

  if (!options?.force && options?.minIntervalMs) {
    const lastCrossTabAt = readStorageTimestamp(LAST_REFRESH_STORAGE_KEY);
    if (lastCrossTabAt > 0 && Date.now() - lastCrossTabAt < options.minIntervalMs) {
      return Promise.resolve(true);
    }
  }

  inFlightRefresh = executeRefreshRequest(options)
    .then((ok) => {
      if (!isAuthMutationInProgress()) {
        lastResult = { ok, at: Date.now() };
      }
      return ok;
    })
    .finally(() => {
      inFlightRefresh = null;
    });

  return inFlightRefresh;
}
