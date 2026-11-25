import { redirect } from "next/navigation";
import { isValidLocale, ROUTES } from "@/core/constants/routes";

interface UserBattlePageProps {
  readonly params: Promise<{ lang: string }>;
}

export default async function UserBattlePage({ params }: UserBattlePageProps): Promise<never> {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : "id";
  redirect(ROUTES.USER_BATTLE_LOBBY(locale));
}
