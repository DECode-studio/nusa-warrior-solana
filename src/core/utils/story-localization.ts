import type { SupportedLocale } from "@/core/constants/routes";

export function getStoryLocalizedText(
  source: string | undefined,
  translations: Partial<Record<SupportedLocale, string>> | undefined,
  locale: SupportedLocale,
): string {
  return translations?.[locale] ?? translations?.id ?? source ?? "";
}
