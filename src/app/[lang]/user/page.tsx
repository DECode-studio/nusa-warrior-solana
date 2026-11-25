import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";

interface UserIndexPageProps {
  params: Promise<{ lang: string }>;
}

export default async function UserIndexPage({
  params,
}: UserIndexPageProps): Promise<never> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  redirect(ROUTES.USER_DASHBOARD(locale));
}

