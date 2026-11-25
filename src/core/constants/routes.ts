export const SUPPORTED_LOCALES = ["id", "en", "zh"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "id";

export function isValidLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export const isSupportedLocale = isValidLocale;

export const ROUTES = {
  // 1. Public Category Routes (Landing Page Style)
  HOME: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}`,
  CATALOG: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/catalog`,
  CATALOG_DETAIL: (lang: SupportedLocale = DEFAULT_LOCALE, slug: string) =>
    `/${lang}/catalog/${slug}`,
  TEAM: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/team`,
  CONTACT: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/contact`,
  LOGIN: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/login`,

  // 2. User Category Routes (Console Panel Style)
  USER: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/dashboard`,
  USER_LOGIN: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/login`,
  USER_DASHBOARD: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/dashboard`,
  USER_TUTORIAL: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/tutorial`,
  USER_BATTLE: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/battle/lobby`,
  USER_BATTLE_LOBBY: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/battle/lobby`,
  USER_BATTLE_ARENA: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/battle/arena`,
  USER_STORY_MODE: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/story-mode/kingdom-list-story`,
  USER_KINGDOM_LIST_STORY: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/story-mode/kingdom-list-story`,
  USER_KINGDOM_STORY_MODE: (
    lang: SupportedLocale = DEFAULT_LOCALE,
    kingdom: "MAJAPAHIT" | "PAJAJARAN",
  ) => `/${lang}/user/story-mode/kingdom-story-mode?kingdom=${encodeURIComponent(kingdom)}`,
  USER_STORY_DETAIL: (
    lang: SupportedLocale = DEFAULT_LOCALE,
    kingdom: "MAJAPAHIT" | "PAJAJARAN",
    missionId: string,
  ) => `/${lang}/user/story-mode/story-detail?kingdom=${encodeURIComponent(kingdom)}&missionId=${encodeURIComponent(missionId)}`,
  USER_LEAGUES: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/leagues`,
  USER_DECKS: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/decks`,
  USER_CUSTOM_CARDS: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/cards/create`,
  USER_SHOP: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/shop`,
  USER_TRANSACTIONS: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/transaction`,

  // 3. Admin Category Routes (Console Panel Style, .env Auth)
  ADMIN: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/admin/dashboard`,
  ADMIN_LOGIN: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/login?role=admin`,
  ADMIN_DASHBOARD: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/dashboard`,
  ADMIN_USERS: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/users`,
  ADMIN_USER_DETAIL: (lang: SupportedLocale = DEFAULT_LOCALE, userId: string) =>
    `/${lang}/admin/users/${userId}`,
  ADMIN_CARDS: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/cards`,
  ADMIN_STORY_MODE: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/story-mode`,
  ADMIN_CARD_DETAIL: (lang: SupportedLocale = DEFAULT_LOCALE, slug: string) =>
    `/${lang}/admin/cards/${slug}`,
  ADMIN_CARD_EDIT: (lang: SupportedLocale = DEFAULT_LOCALE, slug: string) =>
    `/${lang}/admin/cards/${slug}/edit`,
  ADMIN_TEAM: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/team`,
  ADMIN_CONTACT: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/contact`,
  ADMIN_SETTINGS: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/settings`,
  ADMIN_PAYMENT_GATEWAY: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/admin/payment-gateway`,

  // Backward-compatible aliases pointing to new categorized routes
  BATTLE: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/battle/lobby`,
  TUTORIAL: (lang: SupportedLocale = DEFAULT_LOCALE) =>
    `/${lang}/user/tutorial`,
  DECKS: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/decks`,
  SHOP: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/user/shop`,
  SIGN_IN: (lang: SupportedLocale = DEFAULT_LOCALE) => `/${lang}/login`,
} as const;

export const APP_ROUTES = ROUTES;

export interface PanelNavItem {
  readonly key: string;
  readonly href: (lang: SupportedLocale) => string;
  readonly labelKey: string;
  readonly icon: string;
  readonly badgeKey?: "cards" | "users" | "reports" | "decks";
}

export const USER_NAV_ITEMS: readonly PanelNavItem[] = [
  {
    key: "dashboard",
    href: ROUTES.USER_DASHBOARD,
    labelKey: "userNav.dashboard",
    icon: "LayoutDashboard",
  },
  {
    key: "tutorial",
    href: ROUTES.USER_TUTORIAL,
    labelKey: "userNav.tutorial",
    icon: "GraduationCap",
  },
  {
    key: "battle",
    href: ROUTES.USER_BATTLE,
    labelKey: "userNav.battle",
    icon: "Swords",
  },
  {
    key: "story-mode",
    href: ROUTES.USER_KINGDOM_LIST_STORY,
    labelKey: "userNav.storyMode",
    icon: "BookOpen",
  },
  {
    key: "decks",
    href: ROUTES.USER_DECKS,
    labelKey: "userNav.decks",
    icon: "Layers",
    badgeKey: "decks",
  },
  {
    key: "custom-cards",
    href: ROUTES.USER_CUSTOM_CARDS,
    labelKey: "userNav.customCards",
    icon: "Sparkles",
  },
  {
    key: "shop",
    href: ROUTES.USER_SHOP,
    labelKey: "userNav.shop",
    icon: "ShoppingBag",
  },
  {
    key: "transactions",
    href: ROUTES.USER_TRANSACTIONS,
    labelKey: "userNav.transactions",
    icon: "ReceiptText",
  },
] as const;

export const ADMIN_NAV_ITEMS: readonly PanelNavItem[] = [
  {
    key: "dashboard",
    href: ROUTES.ADMIN_DASHBOARD,
    labelKey: "adminNav.dashboard",
    icon: "LayoutDashboard",
  },
  {
    key: "users",
    href: ROUTES.ADMIN_USERS,
    labelKey: "adminNav.users",
    icon: "Users",
    badgeKey: "users",
  },
  {
    key: "cards",
    href: ROUTES.ADMIN_CARDS,
    labelKey: "adminNav.cards",
    icon: "ShieldCheck",
    badgeKey: "cards",
  },
  {
    key: "story-mode",
    href: ROUTES.ADMIN_STORY_MODE,
    labelKey: "adminNav.storyMode",
    icon: "BookOpen",
  },
  {
    key: "team",
    href: ROUTES.ADMIN_TEAM,
    labelKey: "adminNav.team",
    icon: "Users2",
  },
  {
    key: "contact",
    href: ROUTES.ADMIN_CONTACT,
    labelKey: "adminNav.contact",
    icon: "Mail",
  },
  {
    key: "settings",
    href: ROUTES.ADMIN_SETTINGS,
    labelKey: "adminNav.settings",
    icon: "Settings",
  },
  {
    key: "paymentGateway",
    href: ROUTES.ADMIN_PAYMENT_GATEWAY,
    labelKey: "adminNav.paymentGateway",
    icon: "CreditCard",
  },
] as const;
