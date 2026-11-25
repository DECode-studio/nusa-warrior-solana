import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";

interface UserLoginPageProps {
  params: Promise<{ lang: string }>;
}

export default async function UserLoginPage({ params }: UserLoginPageProps): Promise<never> {
  const { lang } = await params;
  redirect(ROUTES.LOGIN(isSupportedLocale(lang) ? lang : DEFAULT_LOCALE));
}

