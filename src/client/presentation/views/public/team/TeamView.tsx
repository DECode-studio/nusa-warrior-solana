"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { PublicPageLayout } from "@/client/presentation/components/layout/PublicPageLayout";
import { TeamHeroSection, TeamGridSection } from "./components";
import { TEAM_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { useTeam } from "./hooks/useTeam";

export function TeamView(): React.ReactElement {
  const { locale } = useTranslator();
  const { members, loading, error, retryLoad } = useTeam();

  return (
    <PublicPageLayout locale={locale}>
      <main id={TEAM_SEMANTIC_IDS.ROOT} className="nc-page nc-public-main">
        {/* 1. Hero Banner */}
        <TeamHeroSection />

        {/* 2. Team Members Grid */}
        <TeamGridSection
          members={members}
          loading={loading}
          error={error}
          onRetry={retryLoad}
        />
      </main>
    </PublicPageLayout>
  );
}
