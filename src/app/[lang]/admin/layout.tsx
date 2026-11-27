import React from "react";
import { redirect } from "next/navigation";
import { AdminLayoutShell } from "@/client/presentation/components/layout";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";
import { getCurrentSession } from "@/server/shared/auth/session";

interface AdminLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{ lang: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps): Promise<React.ReactElement> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  const session = await getCurrentSession();

  if (!session) {
    redirect(ROUTES.LOGIN(locale));
  }
  if (session.role !== "ADMIN" && session.role !== "CURATOR") {
    redirect(ROUTES.LOGIN(locale));
  }

  return <AdminLayoutShell initialAdminUser={session}>{children}</AdminLayoutShell>;
}

