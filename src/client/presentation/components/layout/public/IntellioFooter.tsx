"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swords } from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { ROUTES, type SupportedLocale } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  IntellioCard,
  PillButton,
  PublicContainer,
} from "@/client/presentation/components/ui";

export function IntellioFooter({
  locale: propLocale,
}: {
  readonly locale?: SupportedLocale;
}): React.ReactElement {
  const { locale: contextLocale } = useTranslator();
  const locale = propLocale ?? contextLocale;

  return (
    <footer className="relative overflow-hidden border-t border-[#6766FF]/20 bg-[#07011F] pt-14 pb-10">
      <div
        className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[#6766FF]/10 blur-[110px]"
        aria-hidden="true"
      />

      <PublicContainer size="wide" className="relative">
        {/* Top CTA Card */}
        <IntellioCard variant="elevated" padding="md" className="relative mb-12">
          <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF9F31]/30 bg-[#FF9F31]/10 px-3 py-1 text-xs font-bold text-[#FF9F31]">
                <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Nusa Warriors Console</span>
              </span>
              <h2 className="nc-type-section-title mt-3 font-display font-bold text-white">
                {locale === "id"
                  ? "Siap Memimpin Pasukan di Arena Nusa Warriors?"
                  : locale === "zh"
                    ? "准备好在 Nusa Warriors 竞技场统帅大军了吗？"
                    : "Ready to Command Your Forces in Nusa Warriors?"}
              </h2>
              <p className="nc-type-body-sm mt-2 text-[#CFCBE2]">
                {locale === "id"
                  ? "Akses Dasbor Ksatria untuk menyusun 10 Karakter & 10 Waditra, mempelajari tutorial interaktif, atau memulai pertarungan 2-Baris."
                  : locale === "zh"
                    ? "进入战士控制台，构筑 10 张角色与 10 张传统乐器卡组，体验双排策略对决。"
                    : "Access the Warrior Console to build your 10-Character & 10-Instrument deck, complete the interactive tutorial, and launch into the 2-Row Battle Arena."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
              <PillButton
                href={ROUTES.USER_DASHBOARD(locale)}
                variant="primary"
                size="md"
                showArrow
              >
                {locale === "id"
                  ? "Buka Panel Ksatria"
                  : locale === "zh"
                    ? "打开战士控制台"
                    : "Open Warrior Console"}
              </PillButton>
              <PillButton
                href={ROUTES.CATALOG(locale)}
                variant="outline"
                size="md"
              >
                {locale === "id"
                  ? "Katalog 60 Kartu"
                  : locale === "zh"
                    ? "浏览 60 张卡牌"
                    : "Explore 60 Cards"}
              </PillButton>
            </div>
          </div>
        </IntellioCard>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link
              href={ROUTES.HOME(locale)}
              className="inline-flex items-center gap-2.5"
            >
              <Image
                src={APP_CONFIG.logoLightPath}
                alt={APP_CONFIG.brandName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full border border-[#6766FF]/40 bg-[#0F0927] object-contain p-1"
                unoptimized
              />
              <div>
                <span className="block font-display text-lg font-bold tracking-wider text-white">
                  {APP_CONFIG.brandName.toUpperCase()}
                </span>
                <span className="nc-type-caption block text-[#A8A7FF]">
                  {APP_CONFIG.brandDomain}
                </span>
              </div>
            </Link>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-[#CFCBE2]">
              {APP_CONFIG.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {Object.entries(APP_CONFIG.socialLinks).map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="nc-type-caption inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 font-bold tracking-wider text-[#F8F5F0] transition-colors hover:border-[#6766FF] hover:bg-[#5856F2] hover:text-white"
                >
                  {key}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold tracking-wider text-white uppercase">
              {locale === "id" ? "Halaman Public" : "Public Pages"}
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#CFCBE2]">
              <li>
                <Link
                  href={ROUTES.HOME(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Beranda" : "Home"}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CATALOG(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Katalog 60 Kartu" : "60-Card Catalog"}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TEAM(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Tim Kami" : "Our Team"}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CONTACT(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Kontak & FAQ" : "Contact & FAQ"}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-white uppercase">
              {locale === "id" ? "Panel Ksatria & Admin" : "Warrior & Admin Consoles"}
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-[#CFCBE2]">
              <li>
                <Link
                  href={ROUTES.USER_DASHBOARD(locale)}
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Swords className="h-3.5 w-3.5 text-[#6766FF]" aria-hidden="true" />
                  <span>{locale === "id" ? "Dasbor Ksatria" : "Warrior Dashboard"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.USER_TUTORIAL(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Tutorial Interaktif" : "Interactive Tutorial"}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.USER_BATTLE(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Battle Arena (Lobby)" : "Battle Arena (Lobby)"}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_DASHBOARD(locale)}
                  className="hover:text-white transition-colors"
                >
                  {locale === "id" ? "Panel Kurator Admin" : "Admin Curatorial Panel"}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-display text-sm font-bold tracking-wider text-white uppercase">
              Nusa Warriors Studio
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[#CFCBE2]">
              Cyber 2 Tower, 18th Floor, Kuningan, Jakarta Selatan, Indonesia
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <a
                href="mailto:curator@nusawarriors.id"
                className="block text-[#6766FF] hover:underline"
              >
                curator@nusawarriors.id
              </a>
              <span className="block text-[#0DB561]">+62 (812) 9000-8890</span>
            </div>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-xs text-[#CFCBE2]/70 sm:flex-row">
          <p>© 2026 Nusa Warriors. Seluruh hak cipta dilindungi undang-undang.</p>
          <p>
            Proyek Sejarah Kebudayaan Digital Majapahit &amp; Pajajaran — Excelsior Technologies
          </p>
        </div>
      </PublicContainer>
    </footer>
  );
}
