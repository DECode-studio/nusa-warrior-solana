"use client";

import React from "react";
import { BookOpen, Sparkles, Swords } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  Badge,
  IntellioCard,
  PillButton,
  PublicContainer,
  SectionHeading,
} from "@/client/presentation/components/ui";
import { CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";

export function ContactHeroSection(): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section id={CONTACT_SEMANTIC_IDS.HERO} className="relative">
      <PublicContainer size="wide">
        <IntellioCard
          variant="elevated"
          padding="md"
          className="relative overflow-hidden border-[#6766FF]/25 bg-gradient-to-br from-[#17123D] via-[#100A30] to-[#0B0622] sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6766FF]/20 blur-[110px]"
            aria-hidden="true"
          />
          <div className="max-w-3xl">
            <div id={CONTACT_SEMANTIC_IDS.HERO_BADGE}>
              <Badge
                variant="primary"
                size="md"
                icon={<Sparkles className="h-3.5 w-3.5 text-[#6766FF]" />}
              >
                {t(CONTACT_TEXT_CONSTANT.HERO_BADGE)}
              </Badge>
            </div>
            <div id={CONTACT_SEMANTIC_IDS.HERO_TITLE}>
              <SectionHeading
                as="h1"
                size="page"
                title={t(CONTACT_TEXT_CONSTANT.HERO_TITLE)}
                description={t(CONTACT_TEXT_CONSTANT.HERO_DESCRIPTION)}
                descriptionSize="body"
                titleClassName="mt-4"
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <PillButton
                id={CONTACT_SEMANTIC_IDS.HERO_WARRIOR_BTN}
                href={ROUTES.USER_DASHBOARD(locale)}
                variant="primary"
                showArrow
              >
                <Swords className="mr-1.5 inline h-4 w-4" />
                {t(CONTACT_TEXT_CONSTANT.HERO_CTA_WARRIOR)}
              </PillButton>
              <PillButton
                id={CONTACT_SEMANTIC_IDS.HERO_CATALOG_BTN}
                href={ROUTES.CATALOG(locale)}
                variant="outline"
              >
                <BookOpen className="mr-1.5 inline h-4 w-4" />
                {t(CONTACT_TEXT_CONSTANT.HERO_CTA_CATALOG)}
              </PillButton>
            </div>
          </div>
        </IntellioCard>
      </PublicContainer>
    </section>
  );
}

