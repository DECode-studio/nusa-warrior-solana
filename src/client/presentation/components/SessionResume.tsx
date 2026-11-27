"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthMutationInProgress,
  refreshAuthSession,
} from "@/core/http-client/auth-refresh";

const RESUME_REFRESH_COOLDOWN_MS = 10_000;
let lastResumeRedirectAt = 0;

export function SessionResume(): null {
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (isAuthMutationInProgress()) {
      return;
    }

    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (
        search.includes("reason=wallet_disconnected") ||
        search.includes("loggedOut=")
      ) {
        return;
      }
    }

    let active = true;
    void refreshAuthSession().then((ok) => {
      if (!active || !ok || isAuthMutationInProgress()) return;
      const now = Date.now();
      if (now - lastResumeRedirectAt <= RESUME_REFRESH_COOLDOWN_MS) return;
      lastResumeRedirectAt = now;
      routerRef.current.refresh();
    });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
