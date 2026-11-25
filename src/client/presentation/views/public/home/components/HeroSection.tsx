"use client";

import React from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { APP_ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  IntellioCard,
  Badge,
  PillButton,
  PublicContainer,
} from "@/client/presentation/components/ui";
import { HOME_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { HOME_TEXT_CONSTANT } from "../constants/TextConstant";

export function HeroSection(): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={HOME_SEMANTIC_IDS.HERO_SECTION}
      className="relative isolate overflow-hidden bg-[#080220] pt-24 pb-12 sm:pt-28 sm:pb-16"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(103,102,255,0.26),transparent_52%),linear-gradient(180deg,#100a32_0%,#080220_78%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[28rem] w-[58rem] -translate-x-1/2 rounded-full border border-white/[0.035] sm:top-[-17rem] sm:h-[38rem] sm:w-[72rem]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#6766FF]/10 blur-[100px]"
        aria-hidden="true"
      />

      <PublicContainer size="wide" className="relative">
        {/* Central Hero Pitch */}
        <div className="relative mx-auto max-w-3xl text-center">
          <div
            id={HOME_SEMANTIC_IDS.HERO_BADGE}
            className="mx-auto inline-flex min-h-8 items-center gap-2 rounded-full border border-[#FFB454]/25 bg-[#FFB454]/[0.08] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#FFD18A] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FFB454]" aria-hidden="true" />
            <span>{t(HOME_TEXT_CONSTANT.HERO_BADGE)}</span>
          </div>

          <h1
            id={HOME_SEMANTIC_IDS.HERO_HEADING}
            className="nc-type-display mt-6 font-display font-bold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.08)]"
          >
            {t(HOME_TEXT_CONSTANT.HERO_TITLE_PREFIX)}
            <span className="block bg-gradient-to-r from-[#A8A7FF] via-[#D9C8FF] to-[#FFBD70] bg-clip-text text-transparent">
              {t(HOME_TEXT_CONSTANT.HERO_TITLE_HIGHLIGHT)}
            </span>
          </h1>

          <p
            id={HOME_SEMANTIC_IDS.HERO_DESCRIPTION}
            className="nc-type-body mx-auto mt-4 max-w-2xl text-[#F8F5F0]/80"
          >
            {t(HOME_TEXT_CONSTANT.HERO_DESCRIPTION)}
          </p>

          <div
            id={HOME_SEMANTIC_IDS.HERO_CTA_GROUP}
            className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5"
          >
            <PillButton
              id={HOME_SEMANTIC_IDS.PLAY_BATTLE_BTN}
              href={APP_ROUTES.USER_DASHBOARD(locale)}
              variant="primary"
              size="md"
              showArrow
            >
              {t(HOME_TEXT_CONSTANT.HERO_CTA_PRIMARY)}
            </PillButton>

            <PillButton
              id={HOME_SEMANTIC_IDS.CATALOG_BTN}
              href={APP_ROUTES.CATALOG(locale)}
              variant="outline"
              size="md"
            >
              {t(HOME_TEXT_CONSTANT.HERO_CTA_CATALOG)}
            </PillButton>

            <PillButton
              id={HOME_SEMANTIC_IDS.TUTORIAL_BTN}
              href={APP_ROUTES.CONTACT(locale)}
              variant="dark"
              size="md"
            >
              {t(HOME_TEXT_CONSTANT.HERO_CTA_CONTACT)}
            </PillButton>
          </div>
        </div>

        {/* 3 Proportional Featured Preview Cards */}
        <div
          id={HOME_SEMANTIC_IDS.PREVIEW_CARDS_GRID}
          className="mx-auto mt-12 grid max-w-5xl grid-cols-1 items-stretch gap-4 sm:grid-cols-3 lg:mt-14"
        >
          {/* Majapahit Preview */}
          <IntellioCard
            id={HOME_SEMANTIC_IDS.PREVIEW_MAJAPAHIT}
            variant="default"
            padding="sm"
            className="group flex flex-col justify-between border-white/[0.09] bg-gradient-to-b from-[#171136] to-[#0D0824] transition duration-300 hover:-translate-y-1 hover:border-[#6766FF]/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-xs font-bold tracking-wider text-[#6766FF] uppercase">
                {t(HOME_TEXT_CONSTANT.PREVIEW_MAJAPAHIT_TITLE)}
              </span>
              <Badge variant="amber" size="sm">
                {t(HOME_TEXT_CONSTANT.PREVIEW_MAJAPAHIT_TAG)}
              </Badge>
            </div>
            <div className="my-2 flex justify-center">
              <div className="w-32 overflow-hidden rounded-[var(--radius-control)] border border-[#6766FF]/35 shadow-[0_12px_28px_rgba(4,1,18,0.55)] transition-transform duration-300 group-hover:scale-[1.03] sm:w-36">
                <Image
                  src="/cards/nusantara-card.majapahit.gajah-mada.png"
                  alt="Gajah Mada Majapahit"
                  width={288}
                  height={384}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
            <div className="mt-1 text-center">
              <div className="font-display text-sm font-bold text-white sm:text-base">
                {t(HOME_TEXT_CONSTANT.PREVIEW_MAJAPAHIT_NAME)}
              </div>
              <div className="nc-type-caption text-[#CFCBE2]">
                {t(HOME_TEXT_CONSTANT.PREVIEW_MAJAPAHIT_STAT)}
              </div>
            </div>
          </IntellioCard>

          {/* Waditra Preview */}
          <IntellioCard
            id={HOME_SEMANTIC_IDS.PREVIEW_WADITRA}
            variant="elevated"
            padding="sm"
            className="group flex flex-col justify-between border-[#6766FF]/45 bg-gradient-to-b from-[#1A1642] to-[#0D0824] shadow-[0_16px_42px_rgba(103,102,255,0.14)] transition duration-300 hover:-translate-y-1 hover:border-[#8B89FF]/70"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-xs font-bold tracking-wider text-white uppercase">
                {t(HOME_TEXT_CONSTANT.PREVIEW_WADITRA_TITLE)}
              </span>
              <Badge variant="emerald" size="sm">
                {t(HOME_TEXT_CONSTANT.PREVIEW_WADITRA_TAG)}
              </Badge>
            </div>
            <div className="my-2 flex justify-center">
              <div className="w-32 overflow-hidden rounded-[var(--radius-control)] border border-[#0DB561]/40 shadow-[0_12px_28px_rgba(4,1,18,0.55)] transition-transform duration-300 group-hover:scale-[1.03] sm:w-36">
                <Image
                  src="/cards/nusantara-card.instrument.padahi.png"
                  alt="Padahi Waditra"
                  width={288}
                  height={384}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
            <div className="mt-1 text-center">
              <div className="font-display text-sm font-bold text-white sm:text-base">
                {t(HOME_TEXT_CONSTANT.PREVIEW_WADITRA_NAME)}
              </div>
              <div className="nc-type-caption text-[#CFCBE2]">
                {t(HOME_TEXT_CONSTANT.PREVIEW_WADITRA_STAT)}
              </div>
            </div>
          </IntellioCard>

          {/* Pajajaran Preview */}
          <IntellioCard
            id={HOME_SEMANTIC_IDS.PREVIEW_PAJAJARAN}
            variant="default"
            padding="sm"
            className="group flex flex-col justify-between border-white/[0.09] bg-gradient-to-b from-[#171136] to-[#0D0824] transition duration-300 hover:-translate-y-1 hover:border-[#6766FF]/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-xs font-bold tracking-wider text-[#6766FF] uppercase">
                {t(HOME_TEXT_CONSTANT.PREVIEW_PAJAJARAN_TITLE)}
              </span>
              <Badge variant="emerald" size="sm">
                {t(HOME_TEXT_CONSTANT.PREVIEW_PAJAJARAN_TAG)}
              </Badge>
            </div>
            <div className="my-2 flex justify-center">
              <div className="w-32 overflow-hidden rounded-[var(--radius-control)] border border-[#6766FF]/35 shadow-[0_12px_28px_rgba(4,1,18,0.55)] transition-transform duration-300 group-hover:scale-[1.03] sm:w-36">
                <Image
                  src="/cards/nusantara-card.pajajaran.sri-baduga-maharaja.png"
                  alt="Sri Baduga Maharaja Pajajaran"
                  width={288}
                  height={384}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
            <div className="mt-1 text-center">
              <div className="font-display text-sm font-bold text-white sm:text-base">
                {t(HOME_TEXT_CONSTANT.PREVIEW_PAJAJARAN_NAME)}
              </div>
              <div className="nc-type-caption text-[#CFCBE2]">
                {t(HOME_TEXT_CONSTANT.PREVIEW_PAJAJARAN_STAT)}
              </div>
            </div>
          </IntellioCard>
        </div>
      </PublicContainer>
    </section>
  );
}

