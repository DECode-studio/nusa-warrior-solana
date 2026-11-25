import { redirect } from "next/navigation";
import { isValidLocale, ROUTES } from "@/core/constants/routes";

interface StoryModePageProps {
  readonly params: Promise<{ lang: string }>;
}

export default async function UserStoryModePage({ params }: StoryModePageProps): Promise<never> {
  const { lang } = await params;
  redirect(ROUTES.USER_KINGDOM_LIST_STORY(isValidLocale(lang) ? lang : "id"));
}
