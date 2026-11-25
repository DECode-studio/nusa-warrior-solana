"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionResume(): null {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (active && response.ok) router.refresh();
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [router]);
  return null;
}
