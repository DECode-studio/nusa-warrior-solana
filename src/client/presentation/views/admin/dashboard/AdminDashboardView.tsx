"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { AdminRequestState } from "@/client/presentation/components/admin";
import {
  AdminDashboardBanner,
  AdminDashboardKpiGrid,
  AdminDashboardKingdomBreakdown,
  AdminDashboardRecentReports,
} from "./components";
import { ADMIN_DASHBOARD_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "./constants/TextConstant";
import { useAdminDashboard } from "./hooks/useAdminDashboard";

export function AdminDashboardView(): React.ReactElement {
  const { t } = useTranslator();
  const {
    cards,
    users,
    reports,
    loading,
    error,
    retryLoad,
    activeCardsCount,
    withdrawnCardsCount,
    verifiedCardsCount,
    openReportsCount,
  } = useAdminDashboard();

  return (
    <div id={ADMIN_DASHBOARD_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* 1. Curatorial Header Banner with Action Links */}
      <AdminDashboardBanner
        usersCount={loading || error ? null : users.length}
      />

      <AdminRequestState
        loading={loading}
        error={error ? t(error) : null}
        loadingId={ADMIN_DASHBOARD_SEMANTIC_IDS.LOADING_STATE}
        errorId={ADMIN_DASHBOARD_SEMANTIC_IDS.ERROR_ALERT}
        retryId={ADMIN_DASHBOARD_SEMANTIC_IDS.RETRY_BTN}
        loadingMessage={t(ADMIN_DASHBOARD_TEXT_CONSTANT.LOADING)}
        errorTitle={t(ADMIN_DASHBOARD_TEXT_CONSTANT.LOAD_ERROR)}
        retryLabel={t(ADMIN_DASHBOARD_TEXT_CONSTANT.RETRY)}
        onRetry={retryLoad}
      />

      {!loading && !error && (
        <>
          <AdminDashboardKpiGrid
            totalCards={cards.length}
            activeCardsCount={activeCardsCount}
            withdrawnCardsCount={withdrawnCardsCount}
            verifiedCardsCount={verifiedCardsCount}
            totalUsers={users.length}
            openReportsCount={openReportsCount}
            totalReports={reports.length}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <AdminDashboardKingdomBreakdown
              cards={cards}
              withdrawnCardsCount={withdrawnCardsCount}
            />
            <AdminDashboardRecentReports reports={reports} />
          </div>
        </>
      )}
    </div>
  );
}
