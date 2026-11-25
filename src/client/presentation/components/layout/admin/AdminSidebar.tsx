"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, ExternalLink, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { ADMIN_NAV_ITEMS, ROUTES } from "@/core/constants/routes";
import { isPanelNavItemActive } from "@/core/utils/panel-navigation";
import { useTranslator } from "@/core/translator";
import { ADMIN_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { AdminNavIcon } from "./AdminNavIcon";

interface AdminSidebarProps {
  currentPath: string;
  adminUsername?: string;
  onLogout: () => void;
}

export function AdminSidebar({
  currentPath,
  adminUsername,
  onLogout,
}: AdminSidebarProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <aside
      id={ADMIN_LAYOUT_SEMANTIC_IDS.SIDEBAR}
      className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:top-4 md:left-4 md:bottom-4 z-40 rounded-[24px] border border-[rgba(103,102,255,0.22)] bg-[#07011F]/95 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl overflow-hidden"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-[rgba(103,102,255,0.16)] px-6 py-5">
        <Link
          id={ADMIN_LAYOUT_SEMANTIC_IDS.BRAND_LINK}
          href={ROUTES.ADMIN_DASHBOARD(locale)}
          className="flex items-center gap-3"
        >
          <Image
            src={APP_CONFIG.logos.transparent}
            alt={APP_CONFIG.brandName}
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-xl object-contain"
            unoptimized
          />
          <div>
            <span className="block font-display text-lg font-bold tracking-tight text-white">
              {APP_CONFIG.brandName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-[#0DB561] uppercase">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {t(ADMIN_LAYOUT_TEXT_CONSTANT.PANEL_BADGE)}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav
        id={ADMIN_LAYOUT_SEMANTIC_IDS.NAV_CONTAINER}
        aria-label={t(ADMIN_LAYOUT_TEXT_CONSTANT.NAV_ARIA)}
        className="flex-1 space-y-1.5 px-3.5 py-6"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const targetHref = item.href(locale);
          const isActive = isPanelNavItemActive(currentPath, item, locale);
          const label = t(item.labelKey);

          return (
            <Link
              key={item.key}
              id={`${ADMIN_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}${item.key}`}
              href={targetHref}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3.5 rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#6766FF] to-[#5856F2] text-white shadow-[0_8px_24px_rgba(103,102,255,0.35)]"
                  : "text-[#CFCBE2] hover:bg-[rgba(103,102,255,0.12)] hover:text-white"
              }`}
            >
              <AdminNavIcon
                name={item.icon}
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive
                    ? "text-white"
                    : "text-[#8B8AFF] group-hover:text-white"
                }`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-2 border-t border-[rgba(103,102,255,0.16)] p-4">
        {adminUsername && (
          <div
            id={ADMIN_LAYOUT_SEMANTIC_IDS.USER_BADGE}
            className="mb-2 rounded-2xl border border-[rgba(103,102,255,0.2)] bg-[#0F0927]/80 px-3.5 py-2.5 text-xs"
          >
            <div className="font-bold text-white truncate">{adminUsername}</div>
            <div className="text-[10px] text-[#3CE089]">
              {t(ADMIN_LAYOUT_TEXT_CONSTANT.ENV_CREDENTIALS)}
            </div>
          </div>
        )}

        <Link
          id={ADMIN_LAYOUT_SEMANTIC_IDS.PUBLIC_HOME_LINK}
          href={ROUTES.HOME(locale)}
          className="flex w-full items-center justify-between rounded-full border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/70 px-4 py-2.5 text-xs font-medium text-[#CFCBE2] transition-colors hover:border-[#6766FF] hover:text-white"
        >
          <span>{t(ADMIN_LAYOUT_TEXT_CONSTANT.VIEW_LANDING)}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>

        <button
          id={ADMIN_LAYOUT_SEMANTIC_IDS.LOGOUT_BTN}
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{t(ADMIN_LAYOUT_TEXT_CONSTANT.LOGOUT)}</span>
        </button>
      </div>
    </aside>
  );
}
