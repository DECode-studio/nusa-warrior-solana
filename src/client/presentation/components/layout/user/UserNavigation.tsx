"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { SupportedLocale } from "@/core/constants/routes";
import { USER_NAV_ITEMS } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { isPanelNavItemActive } from "@/core/utils/panel-navigation";
import { USER_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { UserNavIcon } from "./UserNavIcon";

interface UserNavigationProps {
  readonly pathname: string | null;
  readonly locale: SupportedLocale;
  readonly savedDecksCount: number | null;
  readonly onNavigate?: () => void;
  readonly variant?: "sidebar" | "drawer";
  readonly isGuest?: boolean;
}

export function UserNavigation({
  pathname,
  locale,
  savedDecksCount,
  onNavigate,
  variant = "sidebar",
  isGuest = false,
}: UserNavigationProps): React.ReactElement {
  const { t } = useTranslator();
  const isDrawer = variant === "drawer";

  return (
    <nav
      id={USER_LAYOUT_SEMANTIC_IDS.NAV_LIST}
      className="mt-5 flex flex-col gap-1.5"
      aria-label={t(
        isDrawer
          ? USER_LAYOUT_TEXT_CONSTANT.MOBILE_NAV_ARIA
          : USER_LAYOUT_TEXT_CONSTANT.NAV_ARIA
      )}
    >
      {USER_NAV_ITEMS.map((item) => {
        const targetHref = item.href(locale);
        const active = isPanelNavItemActive(pathname, item, locale);
        const label = t(item.labelKey);
        const badgeValue = item.badgeKey === "decks" ? savedDecksCount : null;
        const isLockedForGuest = item.key === "custom-cards" && isGuest;

        return (
          <Link
            key={item.key}
            id={`${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}${item.key}`}
            href={targetHref}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center justify-between rounded-2xl px-3.5 ${isDrawer ? "py-3 text-base" : "py-2.5 text-sm"} font-display font-semibold transition-colors ${
              active
                ? "bg-[#6766FF] text-white shadow-[0_0_20px_rgba(103,102,255,0.3)]"
                : "text-[#F8F5F0]/75 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <UserNavIcon
                name={item.icon}
                className={`${isDrawer ? "h-5 w-5" : "h-4 w-4"} shrink-0 ${active ? "text-white" : "text-[#F8F5F0]/60 group-hover:text-white"}`}
              />
              <span className="truncate">{label}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {isLockedForGuest && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  <Lock className="h-3 w-3" />
                  <span>Kunci</span>
                </span>
              )}
              {badgeValue !== null ? (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-white/10 text-[#F8F5F0]/75"}`}>
                  {badgeValue}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
