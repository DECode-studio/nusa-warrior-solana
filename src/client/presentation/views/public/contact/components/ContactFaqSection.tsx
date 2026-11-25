"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { useTranslator } from "@/core/translator";
import {
  Accordion,
  Badge,
  PublicContainer,
  SectionHeading,
} from "@/client/presentation/components/ui";
import { CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import {
  CONTACT_TEXT_CONSTANT,
  type ContactFaqItem,
} from "../constants/TextConstant";

export interface ContactFaqSectionProps {
  readonly faqItems: readonly ContactFaqItem[];
  readonly openFaqId: string | null;
  readonly onToggleFaq: (id: string) => void;
}

export function ContactFaqSection({
  faqItems,
  openFaqId,
  onToggleFaq,
}: ContactFaqSectionProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const formattedFaqItems = faqItems.map((item) => ({
    id: item.id,
    title: locale === "id" ? item.questionId : item.questionEn,
    content: locale === "id" ? item.answerId : item.answerEn,
    icon: <HelpCircle className="h-4 w-4" aria-hidden="true" />,
  }));

  return (
    <section id={CONTACT_SEMANTIC_IDS.FAQ_SECTION} className="mt-16">
      <PublicContainer
        size="narrow"
        id={CONTACT_SEMANTIC_IDS.FAQ_CONTAINER}
        className="rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.02] p-5 sm:p-8"
      >
        <div id={CONTACT_SEMANTIC_IDS.FAQ_BADGE}>
          <Badge variant="primary" size="md">
            {t(CONTACT_TEXT_CONSTANT.FAQ_BADGE)}
          </Badge>
        </div>
        <div id={CONTACT_SEMANTIC_IDS.FAQ_TITLE}>
          <SectionHeading
            align="center"
            titleClassName="mt-4"
            title={t(CONTACT_TEXT_CONSTANT.FAQ_TITLE)}
          />
        </div>

        <div id={CONTACT_SEMANTIC_IDS.FAQ_ACCORDION} className="mt-8">
          <Accordion
            items={formattedFaqItems}
            openId={openFaqId}
            onToggle={onToggleFaq}
          />
        </div>
      </PublicContainer>
    </section>
  );
}

