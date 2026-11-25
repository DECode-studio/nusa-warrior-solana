"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import {
  AdminFeedbackBanner,
  AdminRequestState,
} from "@/client/presentation/components/admin";
import { Pagination } from "@/client/presentation/components/ui";
import {
  AdminCardsHeading,
  AdminCardsReportsList,
  AdminCardsTabFilterBar,
  AdminCardsTable,
} from "./components";
import { ADMIN_CARDS_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "./constants/TextConstant";
import { useAdminCards } from "./hooks/useAdminCards";

export function AdminCardsView(): React.ReactElement {
  const { t } = useTranslator();
  const {
    cards,
    totalCards,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    reports,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    retryLoad,
    actionFeedback,
    handleUpdateCardVerification,
    handleToggleCardPublication,
    handleUpdateReportStatus,
  } = useAdminCards();

  const handleTabChange = (tab: "CARDS" | "REPORTS"): void => {
    setActiveTab(tab);
  };

  return (
    <div id={ADMIN_CARDS_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* 1. Curatorial Header Banner */}
      <AdminCardsHeading />

      {/* 2. Action Feedback Message Banner */}
      {actionFeedback && (
        <AdminFeedbackBanner
          id={ADMIN_CARDS_SEMANTIC_IDS.ACTION_FEEDBACK}
          message={t(actionFeedback.messageKey)}
          variant={actionFeedback.variant}
        />
      )}

      {/* 3. Tab Switcher & Search Bar */}
      <AdminCardsTabFilterBar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        cardsCount={totalCards}
        reportsCount={reports.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 4. Loading State */}
      <AdminRequestState
        loading={loading}
        error={error ? t(error) : null}
        loadingId={ADMIN_CARDS_SEMANTIC_IDS.LOADING_STATE}
        errorId={ADMIN_CARDS_SEMANTIC_IDS.ERROR_ALERT}
        retryId={ADMIN_CARDS_SEMANTIC_IDS.RETRY_BTN}
        loadingMessage={t(ADMIN_CARDS_TEXT_CONSTANT.LOADING)}
        errorTitle={t(ADMIN_CARDS_TEXT_CONSTANT.ERROR_TITLE)}
        retryLabel={t(ADMIN_CARDS_TEXT_CONSTANT.RETRY_BTN)}
        onRetry={retryLoad}
      />

      {/* 5. Active Tab Content: Cards Table with Server-side Pagination or Reports List */}
      {!loading && !error && activeTab === "CARDS" && (
        <div className="space-y-4">
          <AdminCardsTable
            cards={cards}
            onUpdateVerification={handleUpdateCardVerification}
            onTogglePublication={handleToggleCardPublication}
          />

          {totalCards > 0 && (
            <Pagination
              id={ADMIN_CARDS_SEMANTIC_IDS.PAGINATION}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCards}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </div>
      )}

      {!loading && !error && activeTab === "REPORTS" && (
        <AdminCardsReportsList
          reports={reports}
          onUpdateReportStatus={handleUpdateReportStatus}
        />
      )}
    </div>
  );
}

export { AdminCardsView as AdminView };
