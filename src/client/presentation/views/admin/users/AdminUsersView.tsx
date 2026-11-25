"use client";

import React from "react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  AdminFeedbackBanner,
  AdminRequestState,
} from "@/client/presentation/components/admin";
import { Pagination } from "@/client/presentation/components/ui";
import { AdminUsersHeading, AdminUsersTable } from "./components";
import { ADMIN_USERS_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_USERS_TEXT_CONSTANT } from "./constants/TextConstant";
import { useAdminUsers } from "./hooks/useAdminUsers";

export function AdminUsersView(): React.ReactElement {
  const { locale, t } = useTranslator();
  const router = useRouter();
  const {
    filteredUsers,
    totalUsers,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    retryLoad,
    feedbackMsg,
    handleUpdateRole,
  } = useAdminUsers();
  const handleOpenDetail = useCallback(
    (userId: string): void => {
      router.push(ROUTES.ADMIN_USER_DETAIL(locale, userId));
    },
    [locale, router]
  );

  return (
    <div id={ADMIN_USERS_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* 1. Curatorial Header Banner & Search Input */}
      <AdminUsersHeading
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Action Feedback Message Banner */}
      {feedbackMsg && (
        <AdminFeedbackBanner
          id={ADMIN_USERS_SEMANTIC_IDS.ACTION_FEEDBACK}
          message={t(feedbackMsg.messageKey)}
          variant={feedbackMsg.variant}
        />
      )}

      {/* 3. Loading State */}
      <AdminRequestState
        loading={loading}
        error={error ? t(error) : null}
        loadingId={ADMIN_USERS_SEMANTIC_IDS.LOADING_STATE}
        errorId={ADMIN_USERS_SEMANTIC_IDS.ERROR_ALERT}
        retryId={ADMIN_USERS_SEMANTIC_IDS.RETRY_BTN}
        loadingMessage={t(ADMIN_USERS_TEXT_CONSTANT.LOADING)}
        errorTitle={t(ADMIN_USERS_TEXT_CONSTANT.ERROR_TITLE)}
        retryLabel={t(ADMIN_USERS_TEXT_CONSTANT.RETRY_BTN)}
        onRetry={retryLoad}
      />

      {/* 4. Users Authorization Table & Pagination */}
      {!loading && !error && (
        <>
          <AdminUsersTable
            users={filteredUsers}
            onUpdateRole={handleUpdateRole}
            onOpenDetail={handleOpenDetail}
          />
          <Pagination
            id={ADMIN_USERS_SEMANTIC_IDS.PAGINATION}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalUsers}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
            itemLabel={t("common.pagination.defaultLabel")}
          />
        </>
      )}
    </div>
  );
}
