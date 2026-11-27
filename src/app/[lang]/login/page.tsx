import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicLoginView } from "@/client/presentation/views/public";
import { SessionResume } from "@/client/presentation/components/SessionResume";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";
import { getCurrentSession, REFRESH_COOKIE_NAME } from "@/server/shared/auth/session";

interface LoginPageProps {
  readonly params: Promise<{ lang: string }>;
}

export default async function LoginPage({ params }: LoginPageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  const session = await getCurrentSession();

  if (session?.role === "PLAYER") {
    redirect(ROUTES.USER_DASHBOARD(locale));
  }
  if (session?.role === "ADMIN" || session?.role === "CURATOR") {
    redirect(ROUTES.ADMIN_DASHBOARD(locale));
  }

  const cookieStore = await cookies();
  const hasRefreshCookie = Boolean(cookieStore.get(REFRESH_COOKIE_NAME)?.value);

  return <>
    {hasRefreshCookie ? <SessionResume /> : null}
    <PublicLoginView />
  </>;
}
