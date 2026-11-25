"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  AdminFeedbackBanner,
  AdminRequestState,
} from "@/client/presentation/components/admin";
import { Button } from "@/client/presentation/components/ui";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { useAdminUserDetail } from "./hooks/useAdminUserDetail";
import { ADMIN_USERS_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_USERS_TEXT_CONSTANT } from "./constants/TextConstant";
import { AdminUserDetailCollection, AdminUserDetailProfile } from "./components";

export function AdminUserDetailView({
  userId,
}: {
  readonly userId: string;
}): React.ReactElement {
  const { locale, t } = useTranslator();
  const {
    detail, loading, error, retryLoad, cardSearch, setCardSearch,
    cardFilter, setCardFilter, isUpdatingRole, roleFeedback,
    handleRoleChange, copiedEmail, handleCopyEmail, cardsBySlug,
    filteredCards, totalCopies, registeredDateLabel, deckUpdatedAtLabels,
    deckCardCounts,
  } = useAdminUserDetail(userId);

  if (loading) {
    return (
      <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ROOT} className="space-y-6">
        <Button
          id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_BACK_BUTTON}
          href={ROUTES.ADMIN_USERS(locale)}
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
        >
          {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_BACK)}
        </Button>
        <AdminRequestState
          loading={true}
          error={null}
          loadingId={ADMIN_USERS_SEMANTIC_IDS.DETAIL_LOADING}
          errorId={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ERROR}
          retryId={ADMIN_USERS_SEMANTIC_IDS.DETAIL_RETRY}
          loadingMessage={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_LOADING)}
          errorTitle=""
          retryLabel=""
          onRetry={retryLoad}
        />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ROOT} className="space-y-6">
        <Button
          id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_BACK_BUTTON}
          href={ROUTES.ADMIN_USERS(locale)}
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
        >
          {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_BACK)}
        </Button>
        <AdminRequestState
          loading={false}
          error={error ?? t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_NOT_FOUND)}
          loadingId={ADMIN_USERS_SEMANTIC_IDS.DETAIL_LOADING}
          errorId={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ERROR}
          retryId={ADMIN_USERS_SEMANTIC_IDS.DETAIL_RETRY}
          loadingMessage=""
          errorTitle={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_ERROR_TITLE)}
          retryLabel={t(ADMIN_USERS_TEXT_CONSTANT.RETRY_BTN)}
          onRetry={retryLoad}
        />
      </div>
    );
  }

  return (
    <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ROOT} className="space-y-6">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_BACK_BUTTON}
          href={ROUTES.ADMIN_USERS(locale)}
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
        >
          {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_BACK)}
        </Button>

        <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_BREADCRUMB} className="flex items-center gap-2 text-xs text-[#CFCBE2]">
          <Link
            id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_BREADCRUMB_LINK}
            href={ROUTES.ADMIN_USERS(locale)}
            className="hover:text-white transition-colors"
          >
            {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_BREADCRUMB)}
          </Link>
          <span>/</span>
          <span className="text-[#A9A8FF] font-semibold truncate max-w-[200px]">
            {detail.user.name}
          </span>
        </div>
      </div>

      {/* 2. Action Feedback Banner (e.g. Role changed) */}
      {roleFeedback && (
        <AdminFeedbackBanner
          id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_ACTION_FEEDBACK}
          message={t(roleFeedback.messageKey, { role: detail.user.role })}
          variant={roleFeedback.variant}
        />
      )}

      <AdminUserDetailProfile
        detail={detail}
        totalCopies={totalCopies}
        registeredDateLabel={registeredDateLabel}
        isUpdatingRole={isUpdatingRole}
        copiedEmail={copiedEmail}
        onRoleChange={handleRoleChange}
        onCopyEmail={handleCopyEmail}
      />

      <AdminUserDetailCollection
        detail={detail}
        locale={locale}
        cardSearch={cardSearch}
        cardFilter={cardFilter}
        filteredCards={filteredCards}
        cardsBySlug={cardsBySlug}
        deckUpdatedAtLabels={deckUpdatedAtLabels}
        deckCardCounts={deckCardCounts}
        onSearchChange={setCardSearch}
        onFilterChange={setCardFilter}
      />
    </div>
  );
}
