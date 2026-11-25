"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTranslator } from "@/core/translator";
import { NavbarHeader } from "./layout/NavbarHeader";

export function AppNavbar(): React.ReactElement {
  const { locale } = useTranslator();
  const pathname = usePathname();

  // Panel pages (/user/* and /admin/*) and standalone battle screens manage their own console headers
  if (
    pathname?.includes("/user") ||
    pathname?.includes("/admin") ||
    pathname?.includes("/battle")
  ) {
    return <></>;
  }

  return <NavbarHeader activePath={pathname ?? `/${locale}`} locale={locale} />;
}
