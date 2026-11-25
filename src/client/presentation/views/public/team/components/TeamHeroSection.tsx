"use client";

import React from "react";
import { Mail, Sparkles } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  Badge,
  IntellioCard,
  PillButton,
  PublicContainer,
  SectionHeading,
} from "@/client/presentation/components/ui";
import { TEAM_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { TEAM_TEXT_CONSTANT } from "../constants/TextConstant";

export function TeamHeroSection(): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section id={TEAM_SEMANTIC_IDS.HERO} className="relative">
      <PublicContainer size="wide">
        <IntellioCard
          variant="elevated"
          padding="md"
          className="relative overflow-hidden border-primary/25 bg-linear-to-br from-[#17123D] via-[#100A30] to-[#0B0622] sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[110px]"
            aria-hidden="true"
          />
          <div className="max-w-3xl">
            <div id={TEAM_SEMANTIC_IDS.HERO_BADGE}>
              <Badge
                variant="primary"
                size="md"
                icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
              >
                {t(TEAM_TEXT_CONSTANT.HERO_BADGE)}
              </Badge>
            </div>
            <div id={TEAM_SEMANTIC_IDS.HERO_TITLE}>
              <SectionHeading
                as="h1"
                size="page"
                title={t(TEAM_TEXT_CONSTANT.HERO_TITLE)}
                description={t(TEAM_TEXT_CONSTANT.HERO_DESCRIPTION)}
                descriptionSize="body"
                titleClassName="mt-4"
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <PillButton
                id={TEAM_SEMANTIC_IDS.HERO_CONTACT_BTN}
                href={ROUTES.CONTACT(locale)}
                variant="primary"
                showArrow
              >
                <Mail className="mr-1.5 inline h-4 w-4" />
                {t(TEAM_TEXT_CONSTANT.HERO_CONTACT_BTN)}
              </PillButton>
            </div>
          </div>
        </IntellioCard>
      </PublicContainer>
    </section>
  );
}
