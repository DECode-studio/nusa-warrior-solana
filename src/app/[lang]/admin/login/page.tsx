import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";

interface AdminLoginPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AdminLoginPage({ params }: AdminLoginPageProps): Promise<never> {
  const { lang } = await params;
  redirect(ROUTES.ADMIN_LOGIN(isSupportedLocale(lang) ? lang : DEFAULT_LOCALE));
}

