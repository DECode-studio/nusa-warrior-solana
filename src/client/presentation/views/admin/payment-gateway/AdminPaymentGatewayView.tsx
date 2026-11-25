"use client";

import React from "react";
import {
  AdminFeedbackBanner,
  AdminRequestState,
} from "@/client/presentation/components/admin";
import { useTranslator } from "@/core/translator";
import {
  AdminPaymentGatewayGlobalCard,
  AdminPaymentGatewayHeading,
  AdminPaymentGatewayUserList,
} from "./components";
import { ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT } from "./constants/TextConstant";
import { useAdminPaymentGateway } from "./hooks/useAdminPaymentGateway";

export function AdminPaymentGatewayView(): React.ReactElement {
  const { t } = useTranslator();
  const {
    settings,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalUsers,
    totalPages,
    loading,
    busy,
    error,
    feedbackMsg,
    visibleUsers,
    retryLoad,
    handleUpdateGlobalMode,
    handleUpdateUserOverride,
  } = useAdminPaymentGateway();

  return (
    <div
      id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.ROOT}
      className="space-y-6"
    >
      {/* 1. Header Banner */}
      <AdminPaymentGatewayHeading />

      {/* 2. Feedback Alert Banner */}
      {feedbackMsg && (
        <AdminFeedbackBanner
          id={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.FEEDBACK}
          message={t(feedbackMsg.messageKey)}
          variant={feedbackMsg.variant}
        />
      )}

      {/* 3. Loading & Error States */}
      <AdminRequestState
        loading={loading}
        error={error ? t(error) : null}
        loadingId={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.LOADING_STATE}
        errorId={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.ERROR_ALERT}
        retryId={ADMIN_PAYMENT_GATEWAY_SEMANTIC_IDS.RETRY_BTN}
        loadingMessage={t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.LOADING)}
        errorTitle={t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.ERROR_TITLE)}
        retryLabel={t(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.RETRY_BTN)}
        onRetry={retryLoad}
      />

      {/* 4. Global Configuration Card */}
      {!loading && !error && settings && (
        <>
          <AdminPaymentGatewayGlobalCard
            globalMode={settings.globalMode}
            disabled={busy}
            onUpdateMode={handleUpdateGlobalMode}
          />

          {/* 5. User Overrides Card, Search & Pagination */}
          <AdminPaymentGatewayUserList
            users={visibleUsers}
            globalMode={settings.globalMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            disabled={busy}
            currentPage={currentPage}
            totalPages={totalPages}
            totalUsers={totalUsers}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onUpdateOverride={handleUpdateUserOverride}
          />
        </>
      )}
    </div>
  );
}
