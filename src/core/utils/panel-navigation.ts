import type { PanelNavItem, SupportedLocale } from "@/core/constants/routes";

export function isPanelNavItemActive(
  currentPath: string | null,
  item: PanelNavItem,
  locale: SupportedLocale
): boolean {
  if (
    item.key === "battle" &&
    (currentPath?.includes("/user/leagues") || currentPath?.includes("/user/battle"))
  ) {
    return true;
  }
  const targetHref = item.href(locale);
  return (
    currentPath === targetHref ||
    Boolean(currentPath?.startsWith(`${targetHref}/`))
  );
}
