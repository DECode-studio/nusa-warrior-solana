"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";

export function useUserLocaleSwitch(): () => void {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale } = useTranslator();

  return useCallback(() => {
    const currentIndex = SUPPORTED_LOCALES.indexOf(locale);
    const nextLocale: SupportedLocale =
      SUPPORTED_LOCALES[(currentIndex + 1) % SUPPORTED_LOCALES.length] ?? "id";
    setLocale(nextLocale);

    if (!pathname) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale)) {
      segments[0] = nextLocale;
      router.push(`/${segments.join("/")}`);
    }
  }, [locale, pathname, router, setLocale]);
}
