"use client";

import { useEffect } from "react";
import { refreshAuthSession } from "@/core/http-client/auth-refresh";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const VISIBILITY_REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000;

export function SessionHeartbeat(): null {
  useEffect(() => {
    const refresh = (): void => {
      void refreshAuthSession({
        minIntervalMs: VISIBILITY_REFRESH_MIN_INTERVAL_MS,
      });
    };

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
  return null;
}
