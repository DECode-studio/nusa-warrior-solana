"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Compass, Globe, LogOut, Sparkles } from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { USER_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { UserAccountStatus } from "./UserAccountStatus";
import { UserNavigation } from "./UserNavigation";
import { useUserLocaleSwitch } from "./hooks/useUserLocaleSwitch";

export interface UserSidebarProps {
  readonly savedDecksCount: number | null;
  readonly userName: string;
  readonly isGuest?: boolean;
  readonly isLoggingOut: boolean;
  readonly onLogout: () => Promise<void>;
  readonly onOpenTourModal?: () => void;
}

export function UserSidebar({
  savedDecksCount,
  userName,
  isGuest,
  isLoggingOut,
  onLogout,
  onOpenTourModal,
}: UserSidebarProps): React.ReactElement {
  const pathname = usePathname();
  const { locale, t } = useTranslator();
  const cycleLocale = useUserLocaleSwitch();

  return (
    <aside
      id={USER_LAYOUT_SEMANTIC_IDS.SIDEBAR}
      className="fixed bottom-4 left-4 top-4 z-40 hidden w-64 flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[#07011F]/90 p-5 shadow-2xl backdrop-blur-xl md:flex lg:w-72"
    >
      <div className="flex h-full flex-col justify-between overflow-y-auto pr-1">
        <div>
          {/* Brand Header */}
          <Link
            id={USER_LAYOUT_SEMANTIC_IDS.BRAND_LINK}
            href={ROUTES.USER_DASHBOARD(locale)}
            className="flex items-center gap-3 rounded-[16px] px-1 py-1 focus-visible:outline-2 focus-visible:outline-[#6766FF]"
          >
            <Image
              src={APP_CONFIG.logos.transparent}
              alt={APP_CONFIG.brandName}
              width={42}
              height={42}
              className="h-10 w-10 shrink-0 object-contain"
              unoptimized
            />
            <div className="min-w-0">
              <span className="block truncate font-display text-lg font-bold tracking-wide text-white">
                {APP_CONFIG.brandName}
              </span>
              <p className="text-[11px] tracking-wider text-[#F8F5F0]/60">
                {t(USER_LAYOUT_TEXT_CONSTANT.CONSOLE_SUBTITLE)}
              </p>
            </div>
          </Link>

          {/* Top Up Shortcut in Sidebar */}
          <Link
            href={`${ROUTES.USER_SHOP(locale)}?tab=topup`}
            className="mt-4 flex items-center justify-between rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-[#FF9F31]/10 to-amber-500/5 px-3.5 py-2.5 transition-all hover:border-amber-400/60 hover:bg-amber-500/20 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 group-hover:scale-105 transition-transform">
                <Coins className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-bold text-cream group-hover:text-amber-light">
                Top Up Nusa Point
              </span>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-display text-[10px] font-bold text-amber-300">
              FEE 500
            </span>
          </Link>

          <UserNavigation
            pathname={pathname}
            locale={locale}
            savedDecksCount={savedDecksCount}
            isGuest={isGuest}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          {/* Guide / Tour Button */}
          {onOpenTourModal && (
            <button
              id="user-sidebar-tour-btn"
              type="button"
              onClick={onOpenTourModal}
              className="flex w-full cursor-pointer items-center justify-between rounded-[40px] border border-[#FFBD70]/30 bg-[#FFBD70]/10 px-3.5 py-2 text-xs font-semibold text-[#FFBD70] transition-colors hover:border-[#FFBD70] hover:bg-[#FFBD70]/20"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#FFBD70]" />
                <span>{t("tour.sidebarBtnLabel")}</span>
              </div>
              <Sparkles className="h-3 w-3 text-[#FFBD70]" />
            </button>
          )}

          {/* Language Switcher */}
          <button
            id={USER_LAYOUT_SEMANTIC_IDS.LOCALE_SWITCH_BTN}
            type="button"
            onClick={cycleLocale}
            className="flex w-full cursor-pointer items-center justify-between rounded-[40px] border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-[#F8F5F0]/80 transition-colors hover:border-[#6766FF] hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#6766FF]" />
              <span>{t(USER_LAYOUT_TEXT_CONSTANT.LANGUAGE_SWITCH)}</span>
            </div>
            <span className="font-display font-bold text-[#6766FF]">
              {locale.toUpperCase()}
            </span>
          </button>

          {/* Logout Button */}
          <button
            id={USER_LAYOUT_SEMANTIC_IDS.LOGOUT_BTN}
            type="button"
            onClick={() => void onLogout()}
            disabled={isLoggingOut}
            className="flex cursor-pointer items-center gap-2 rounded-[40px] border border-[#FF9F31]/30 bg-[#FF9F31]/10 px-3.5 py-2 text-xs font-semibold text-[#FF9F31] transition-colors hover:bg-[#FF9F31]/20 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>
              {isLoggingOut
                ? t(USER_LAYOUT_TEXT_CONSTANT.LOGGING_OUT)
                : t(USER_LAYOUT_TEXT_CONSTANT.LOGOUT)}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
