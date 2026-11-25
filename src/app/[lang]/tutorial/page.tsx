import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";

interface LegacyPageProps {
  params: Promise<{ lang: string }>;
}

export default async function LegacyTutorialPage({
  params,
}: LegacyPageProps): Promise<never> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  redirect(ROUTES.USER_TUTORIAL(locale));
}
