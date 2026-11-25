import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/shared/auth/session";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";
import { CardForgeView } from "@/client/presentation/views/user/custom-card/CardForgeView";

interface CreateCustomCardPageProps {
  readonly params: Promise<{ lang: string }>;
}

export default async function CreateCustomCardPage({
  params,
}: CreateCustomCardPageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  const session = await getCurrentSession();

  if (!session) {
    redirect(ROUTES.LOGIN(locale));
  }

  return <CardForgeView />;
}
