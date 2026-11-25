"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { CardDetailModal } from "@/client/presentation/components/CardDetailModal";
import { PublicPageLayout } from "@/client/presentation/components/layout/PublicPageLayout";
import {
  HeroSection,
  MetricsStripSection,
  PillarsSection,
  ShowcaseSection,
  GatewaySection,
} from "./components";
import { HOME_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { useHome } from "./hooks/useHome";

export function HomeView(): React.ReactElement {
  const { locale } = useTranslator();
  const {
    featuredCards,
    totalCardsCount,
    loading,
    error,
    inspectedCard,
    setInspectedCard,
    retryLoad,
  } = useHome();

  return (
    <PublicPageLayout locale={locale}>
      <main id={HOME_SEMANTIC_IDS.ROOT} className="nc-page overflow-x-hidden">
        {/* 1. Hero Section with 3 Proportional Featured Previews */}
        <HeroSection />

        {/* 2. Proportional Metrics Strip */}
        <MetricsStripSection totalCardsCount={totalCardsCount} />

        {/* 3. Gameplay & Cultural Pillars */}
        <PillarsSection />

        {/* 4. Curated Showcase Gallery */}
        <ShowcaseSection
          featuredCards={featuredCards}
          loading={loading}
          error={error}
          onInspectCard={setInspectedCard}
          onRetry={retryLoad}
        />

        {/* 5. Console Gateways (Warrior & Admin) */}
        <GatewaySection />

        {/* Inspection Modal */}
        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      </main>

    </PublicPageLayout>
  );
}
