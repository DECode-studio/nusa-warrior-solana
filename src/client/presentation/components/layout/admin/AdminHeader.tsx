"use client";

import React from "react";
import { Menu, ShieldCheck, LogOut } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/core/constants/routes";
import { isPanelNavItemActive } from "@/core/utils/panel-navigation";
import { useTranslator } from "@/core/translator";
import { ADMIN_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "@/client/presentation/views/admin/dashboard/constants/TextConstant";

interface AdminHeaderProps {
  currentPath: string;
  onOpenMobileDrawer: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  currentPath,
  onOpenMobileDrawer,
  onLogout,
}: AdminHeaderProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const activeNav = ADMIN_NAV_ITEMS.find((item) =>
    isPanelNavItemActive(currentPath, item, locale)
  );
  const pageTitle = activeNav
    ? t(activeNav.labelKey)
    : t(ADMIN_DASHBOARD_TEXT_CONSTANT.TITLE_KEY);

  return (
    <header
      id={ADMIN_LAYOUT_SEMANTIC_IDS.HEADER}
      className="fixed top-0 left-0 right-0 md:left-72 lg:left-80 z-30 pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300"
    >
      <div className="mx-auto max-w-7xl w-full pointer-events-auto">
        <div className="flex h-16 items-center justify-between rounded-[40px] border border-[rgba(103,102,255,0.22)] bg-[#07011F]/90 px-4 sm:px-6 shadow-[0_14px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              id={ADMIN_LAYOUT_SEMANTIC_IDS.MOBILE_MENU_BTN}
              type="button"
              onClick={onOpenMobileDrawer}
              aria-label={t(ADMIN_LAYOUT_TEXT_CONSTANT.MOBILE_MENU_ARIA)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(103,102,255,0.28)] bg-[#0F0927] text-white transition-colors hover:border-[#6766FF] md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div>
              <h1 className="font-display text-lg font-bold text-white sm:text-xl">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              id={ADMIN_LAYOUT_SEMANTIC_IDS.SESSION_BADGE}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#0DB561]/35 bg-[#0DB561]/10 px-3.5 py-1.5 text-xs font-medium text-[#3CE089]"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t(ADMIN_LAYOUT_TEXT_CONSTANT.AUTHENTICATED_BADGE)}</span>
            </div>

            <button
              id={ADMIN_LAYOUT_SEMANTIC_IDS.HEADER_LOGOUT_BTN}
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-white md:hidden cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t(ADMIN_LAYOUT_TEXT_CONSTANT.LOGOUT)}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
