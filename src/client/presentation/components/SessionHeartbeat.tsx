"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function SessionHeartbeat(): null {
  useEffect(() => {
    let refreshInProgress: Promise<void> | null = null;
    const refresh = (): Promise<void> => {
      if (refreshInProgress) return refreshInProgress;
      refreshInProgress = fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then(() => undefined)
        .catch(() => undefined)
        .finally(() => { refreshInProgress = null; });
      return refreshInProgress;
    };

    const interval = window.setInterval(() => { void refresh(); }, REFRESH_INTERVAL_MS);
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
  return null;
}
