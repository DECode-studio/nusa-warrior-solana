import React from "react";
import { redirect } from "next/navigation";
import { UserLayoutShell } from "@/client/presentation/components/layout";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";
import { getCurrentSession } from "@/server/shared/auth/session";

interface UserLayoutProps {
  readonly children: React.ReactNode;
  readonly params: Promise<{ lang: string }>;
}

export default async function UserLayout({
  children,
  params,
}: UserLayoutProps): Promise<React.ReactElement> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  const session = await getCurrentSession();

  if (!session) {
    redirect(ROUTES.LOGIN(locale));
  }
  if (session.role !== "PLAYER") {
    redirect(
      session.role === "ADMIN" || session.role === "CURATOR"
        ? ROUTES.ADMIN_DASHBOARD(locale)
        : ROUTES.LOGIN(locale)
    );
  }

  return <UserLayoutShell>{children}</UserLayoutShell>;
}

