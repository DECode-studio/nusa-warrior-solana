import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";

interface AdminIndexPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AdminIndexPage({
  params,
}: AdminIndexPageProps): Promise<never> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  redirect(ROUTES.ADMIN_DASHBOARD(locale));
}
