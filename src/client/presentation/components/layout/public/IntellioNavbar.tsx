"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import {
  ROUTES,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { PublicContainer } from "@/client/presentation/components/ui";
import { NavbarDrawerIsland } from "./NavbarDrawerIsland";

export interface IntellioNavbarProps {
  readonly activePath?: string;
  readonly locale?: SupportedLocale;
}

const PUBLIC_NAV_KEYS = ["home", "catalog", "team", "contact"] as const;
const PUBLIC_NAV_LABELS: Record<
  SupportedLocale,
  readonly [string, string, string, string]
> = {
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

export function IntellioNavbar({
  activePath,
  locale: propLocale,
}: IntellioNavbarProps): React.ReactElement {
  const { locale: contextLocale, setLocale } = useTranslator();
  const pathname = usePathname();
  const router = useRouter();
  const locale = propLocale ?? contextLocale;
  const resolvedPath = activePath ?? pathname ?? ROUTES.HOME(locale);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLocaleSwitch = (nextLocale: SupportedLocale): void => {
    setLocale(nextLocale);
    if (!pathname) {
      router.push(ROUTES.HOME(nextLocale));
      return;
    }
    const segments = pathname.split("/").filter(Boolean);
    if (
      segments.length > 0 &&
      (segments[0] === "id" || segments[0] === "en" || segments[0] === "zh")
    ) {
      segments[0] = nextLocale;
      router.push(`/${segments.join("/")}`);
    } else {
      router.push(ROUTES.HOME(nextLocale));
    }
  };

  return (
    <header
      id="nusantara-main-navbar"
      className={`fixed inset-x-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled ? "top-3 px-3 sm:top-4 sm:px-6" : "top-0 px-0"
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 ease-in-out ${
          isScrolled
            ? "max-w-7xl rounded-2xl border border-white/15 bg-[#080220]/90 py-2.5 shadow-[0_16px_40px_rgba(4,1,18,0.7)] backdrop-blur-md sm:rounded-full sm:py-3"
            : "max-w-7xl border-b border-white/10 bg-transparent py-4 sm:py-5"
        }`}
      >
        <PublicContainer
          size="wide"
          className="flex min-h-11 items-center justify-between gap-3 sm:gap-5"
        >
          <Link
            href={ROUTES.HOME(locale)}
            id="nav-brand-logo"
            className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-[#6766FF] sm:gap-3"
          >
            <Image
              src={APP_CONFIG.logoLightPath}
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 rounded-xl border border-[#6766FF]/35 bg-[#0F0927] object-contain p-1 sm:h-10 sm:w-10"
              unoptimized
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-extrabold tracking-wide text-white sm:text-base">
                {APP_CONFIG.brandName}
              </span>
              <span className="hidden truncate text-[10px] font-semibold tracking-[0.12em] text-[#A8A7FF] uppercase sm:block">
                {locale === "id"
                  ? "Arena Kartu Taktis Nusantara"
                  : locale === "zh"
                    ? "努山塔拉战术卡牌竞技场"
                    : "Nusantara Tactical Card Arena"}
              </span>
            </span>
          </Link>

          {/* Primary Nav Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {PUBLIC_NAV_KEYS.map((key, index) => {
              const href = resolvePublicHref(locale, key);
              const isActive =
                key === "home"
                  ? resolvedPath === ROUTES.HOME(locale)
                  : resolvedPath.startsWith(href);

              return (
                <Link
                  key={key}
                  id={`nav-${key}-link`}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center rounded-full px-3.5 py-1.5 font-display text-xs font-bold tracking-wider uppercase transition-colors sm:text-sm ${
                    isActive
                      ? "bg-[#5856F2]/30 text-[#A8A7FF]"
                      : "text-[#F8F5F0]/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {PUBLIC_NAV_LABELS[locale][index]}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher Pill */}
            <div
              role="group"
              aria-label="Language Switcher"
              className="hidden items-center gap-0.5 rounded-full border border-white/15 bg-[#0F0927]/90 p-0.5 sm:flex"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  id={`btn-locale-${loc}`}
                  onClick={() => handleLocaleSwitch(loc)}
                  aria-pressed={locale === loc}
                  className={`inline-flex min-h-8 min-w-8 items-center justify-center rounded-full px-2 py-0.5 font-display text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                    locale === loc
                      ? "bg-[#6766FF] text-white shadow-xs"
                      : "text-[#F8F5F0]/70 hover:text-white"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Enter Arena CTA Button */}
            <Link
              href={ROUTES.USER_DASHBOARD(locale)}
              id="nav-user-console-btn"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6766FF] to-[#5856F2] px-3.5 py-1.5 font-display text-xs font-bold tracking-wider text-white uppercase shadow-[0_4px_16px_rgba(103,102,255,0.4)] transition hover:brightness-110 sm:px-4 sm:py-2"
            >
              <span>
                {locale === "id"
                  ? "Masuk Arena"
                  : locale === "zh"
                    ? "进入竞技场"
                    : "Enter Arena"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <NavbarDrawerIsland activePath={resolvedPath} locale={locale} />
          </div>
        </PublicContainer>
      </div>
    </header>
  );
}
