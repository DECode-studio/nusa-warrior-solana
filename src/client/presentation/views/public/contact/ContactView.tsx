"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { PublicPageLayout } from "@/client/presentation/components/layout/PublicPageLayout";
import {
  ContactChannelsSection,
  ContactFaqSection,
  ContactHeroSection,
} from "./components";
import { CONTACT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { useContact } from "./hooks/useContact";

export function ContactView(): React.ReactElement {
  const { locale } = useTranslator();
  const {
    faqItems,
    openFaqId,
    toggleFaq,
    contactEmail,
    contactPhone,
    officeAddress,
  } = useContact();

  return (
    <PublicPageLayout locale={locale}>
      <main id={CONTACT_SEMANTIC_IDS.ROOT} className="nc-page nc-public-main">
        {/* 1. Hero Banner */}
        <ContactHeroSection />

        {/* 2. Communication Channels Grid */}
        <ContactChannelsSection
          contactEmail={contactEmail}
          contactPhone={contactPhone}
          officeAddress={officeAddress}
        />

        {/* 3. Curatorial FAQ Accordion */}
        <ContactFaqSection
          faqItems={faqItems}
          openFaqId={openFaqId}
          onToggleFaq={toggleFaq}
        />
      </main>
    </PublicPageLayout>
  );
}
