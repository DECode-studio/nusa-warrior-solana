"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { CardDetailModal } from "@/client/presentation/components/CardDetailModal";
import { PublicPageLayout } from "@/client/presentation/components/layout/PublicPageLayout";
import { PublicContainer } from "@/client/presentation/components/ui";
import {
  CatalogCardsGrid,
  CatalogFilterBar,
  CatalogHeaderBanner,
} from "./components";
import { CATALOG_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { useCatalog } from "./hooks/useCatalog";

export function CatalogView(): React.ReactElement {
  const { locale } = useTranslator();
  const {
    cards,
    totalCards,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    cardTypeFilter,
    setCardTypeFilter,
    kingdomFilter,
    setKingdomFilter,
    roleFilter,
    setRoleFilter,
    loading,
    error,
    retryLoad,
    resetFilters,
    inspectedCard,
    setInspectedCard,
  } = useCatalog();

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    cardTypeFilter !== "ALL" ||
    kingdomFilter !== "ALL" ||
    roleFilter !== "ALL";

  return (
    <PublicPageLayout locale={locale}>
      <main id={CATALOG_SEMANTIC_IDS.ROOT} className="nc-page nc-public-main">
        <PublicContainer size="wide">
          {/* Header Title Banner */}
          <CatalogHeaderBanner totalCardsCount={totalCards} />

          {/* Interactive Filter Bar */}
          <CatalogFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            cardTypeFilter={cardTypeFilter}
            onCardTypeFilterChange={setCardTypeFilter}
            kingdomFilter={kingdomFilter}
            onKingdomFilterChange={setKingdomFilter}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            filteredCardsCount={totalCards}
            totalCardsCount={totalCards}
            hasActiveFilter={hasActiveFilter}
            onResetFilters={resetFilters}
          />

          {/* Cards Grid with Server-Side Pagination */}
          <CatalogCardsGrid
            cards={cards}
            loading={loading}
            error={error}
            onRetry={retryLoad}
            onResetFilters={resetFilters}
            onInspectCard={setInspectedCard}
            pagination={{
              currentPage,
              totalPages,
              totalItems: totalCards,
              pageSize,
              onPageChange: (p) => {
                setCurrentPage(p);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 320, behavior: "smooth" });
                }
              },
              onPageSizeChange: setPageSize,
            }}
          />
        </PublicContainer>

        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      </main>
    </PublicPageLayout>
  );
}
