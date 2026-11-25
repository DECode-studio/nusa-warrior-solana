"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Mail, Phone, MapPin, Swords } from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { ROUTES, type SupportedLocale } from "@/core/constants/routes";

export interface NavbarDrawerIslandProps {
  readonly activePath?: string;
  readonly locale?: SupportedLocale;
}

const PUBLIC_NAV_KEYS = ["home", "catalog", "team", "contact"] as const;
const PUBLIC_NAV_LABELS: Record<SupportedLocale, readonly [string, string, string, string]> = {
  id: ["Beranda", "Katalog", "Tim", "Kontak"],
  en: ["Home", "Catalog", "Team", "Contact"],
  zh: ["首页", "文化图鉴", "团队", "联系我们"],
};

function resolvePublicHref(
  locale: SupportedLocale,
  key: (typeof PUBLIC_NAV_KEYS)[number]
): string {
  switch (key) {
    case "home":
      return ROUTES.HOME(locale);
    case "catalog":
      return ROUTES.CATALOG(locale);
    case "team":
      return ROUTES.TEAM(locale);
    case "contact":
      return ROUTES.CONTACT(locale);
  }
}

export function NavbarDrawerIsland({
  activePath = "/",
  locale = "id",
}: NavbarDrawerIslandProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  const resolvedActivePath = activePath || pathname || "/";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id="btn-mobile-menu-toggle"
        onClick={() => setOpen(true)}
        aria-label="Buka menu navigasi"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(103,102,255,0.35)] bg-[#0F0927] text-white transition-colors hover:border-[#6766FF] lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex justify-end"
              role="dialog"
              aria-modal="true"
              aria-label="Nusa Warriors Navigation Menu"
            >
              {/* Backdrop with light dismiss */}
              <div
                className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />

              {/* Drawer Panel */}
              <div className="relative z-10 flex h-full max-h-dvh w-full max-w-sm flex-col overflow-y-auto border-l border-[rgba(103,102,255,0.25)] bg-[#07011F] p-6 shadow-2xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <Link
                      href={ROUTES.HOME(locale)}
                      onClick={() => setOpen(false)}
                      className="flex items-center"
                    >
                      <Image
                        src="/assets/app-logo.png"
                        alt={APP_CONFIG.brandName}
                        width={112}
                        height={36}
                        className="h-8 w-auto object-contain"
                        unoptimized
                      />
                    </Link>

                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Tutup menu navigasi"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-[#6766FF]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <nav aria-label="Mobile Navigation" className="mt-6 space-y-1.5">
                    {PUBLIC_NAV_KEYS.map((key, index) => {
                      const href = resolvePublicHref(locale, key);
                      const isActive =
                        key === "home"
                          ? resolvedActivePath === ROUTES.HOME(locale)
                          : resolvedActivePath.startsWith(href);

                      return (
                        <Link
                          key={key}
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center justify-between rounded-full px-4 py-2.5 font-display text-base font-bold tracking-wide transition-colors ${
                            isActive
                              ? "bg-[#5856F2]/30 text-[#A8A7FF]"
                              : "text-[#F8F5F0]/80 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{PUBLIC_NAV_LABELS[locale][index]}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Console Gateways */}
                  <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                    <Link
                      href={ROUTES.USER_DASHBOARD(locale)}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#6766FF] px-4 py-3 font-display text-sm font-bold tracking-wider text-white uppercase shadow-[0_8px_24px_rgba(103,102,255,0.4)] transition hover:bg-[#5856F2]"
                    >
                      <Swords className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {locale === "id"
                          ? "Masuk Arena"
                          : locale === "zh"
                            ? "进入竞技场"
                            : "Enter Arena"}
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="mt-8 space-y-2.5 border-t border-white/10 pt-5 text-xs text-[#CFCBE2]">
                  <p className="font-display text-sm font-bold text-white uppercase">
                    Kontak Studio
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Mail
                      className="h-3.5 w-3.5 shrink-0 text-[#6766FF]"
                      aria-hidden="true"
                    />
                    <span>{APP_CONFIG.contactEmail}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone
                      className="h-3.5 w-3.5 shrink-0 text-[#0DB561]"
                      aria-hidden="true"
                    />
                    <span>{APP_CONFIG.contactPhone}</span>
                  </p>
                  <p className="flex items-start gap-2.5">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF9F31]"
                      aria-hidden="true"
                    />
                    <span>{APP_CONFIG.officeAddress}</span>
                  </p>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
