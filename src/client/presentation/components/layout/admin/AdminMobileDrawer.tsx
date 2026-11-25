"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, LogOut, ExternalLink } from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { ADMIN_NAV_ITEMS, ROUTES } from "@/core/constants/routes";
import { isPanelNavItemActive } from "@/core/utils/panel-navigation";
import { useTranslator } from "@/core/translator";
import { ADMIN_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { AdminNavIcon } from "./AdminNavIcon";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
  onLogout: () => void;
}

export function AdminMobileDrawer({
  isOpen,
  currentPath,
  onClose,
  onLogout,
}: AdminMobileDrawerProps): React.ReactElement | null {
  const { locale, t } = useTranslator();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id={ADMIN_LAYOUT_SEMANTIC_IDS.MOBILE_DRAWER}
      role="dialog"
      aria-modal="true"
      aria-label={t(ADMIN_LAYOUT_TEXT_CONSTANT.MOBILE_NAV_ARIA)}
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r border-[rgba(103,102,255,0.24)] bg-[#07011F] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(103,102,255,0.16)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Image
              src={APP_CONFIG.logos.transparent}
              alt={APP_CONFIG.brandName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl object-contain"
              unoptimized
            />
            <div>
              <span className="block font-display text-base font-bold text-white">
                {APP_CONFIG.brandName}
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-[#0DB561] uppercase">
                {t(ADMIN_LAYOUT_TEXT_CONSTANT.PANEL_BADGE)}
              </span>
            </div>
          </div>

          <button
            id={ADMIN_LAYOUT_SEMANTIC_IDS.MOBILE_DRAWER_CLOSE_BTN}
            type="button"
            onClick={onClose}
            aria-label={t(ADMIN_LAYOUT_TEXT_CONSTANT.MOBILE_CLOSE_ARIA)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(103,102,255,0.28)] bg-[#0F0927] text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label={t(ADMIN_LAYOUT_TEXT_CONSTANT.MOBILE_NAV_ARIA)}
          className="flex-1 space-y-1.5 p-4"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const targetHref = item.href(locale);
            const isActive = isPanelNavItemActive(currentPath, item, locale);
            const label = t(item.labelKey);

            return (
              <Link
                key={item.key}
                id={`${ADMIN_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}mobile-${item.key}`}
                href={targetHref}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3.5 rounded-full px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#6766FF] to-[#5856F2] text-white shadow-[0_8px_24px_rgba(103,102,255,0.35)]"
                    : "text-[#CFCBE2] hover:bg-[rgba(103,102,255,0.12)] hover:text-white"
                }`}
              >
                <AdminNavIcon name={item.icon} className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-[rgba(103,102,255,0.16)] p-4">
          <Link
            id={`${ADMIN_LAYOUT_SEMANTIC_IDS.PUBLIC_HOME_LINK}-mobile`}
            href={ROUTES.HOME(locale)}
            onClick={onClose}
            className="flex w-full items-center justify-between rounded-full border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/70 px-4 py-2.5 text-xs font-medium text-[#CFCBE2] hover:text-white"
          >
            <span>{t(ADMIN_LAYOUT_TEXT_CONSTANT.VIEW_LANDING)}</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>

          <button
            id={`${ADMIN_LAYOUT_SEMANTIC_IDS.LOGOUT_BTN}-mobile`}
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>{t(ADMIN_LAYOUT_TEXT_CONSTANT.LOGOUT)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
