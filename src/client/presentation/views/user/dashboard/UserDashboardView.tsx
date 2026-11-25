"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { UserFeedback } from "@/client/presentation/components/user";
import { UserUnclaimedPackBanner } from "@/client/presentation/components/layout/user";
import {
  UserDashboardFeaturesSection,
  UserDashboardHeading,
  UserDashboardKpiSection,
  UserDashboardMatchHistorySection,
} from "./components";
import { USER_DASHBOARD_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_DASHBOARD_TEXT_CONSTANT } from "./constants/TextConstant";
import { useUserDashboard } from "./hooks/useUserDashboard";

export function UserDashboardView(): React.ReactElement {
  const { t } = useTranslator();
  const {
    currentUser,
    cards,
    decks,
    matchHistory,
    loading,
    error,
    retryLoad,
  } = useUserDashboard();

  const totalWins = matchHistory.filter((m) => m.winner === "PLAYER").length;

  return (
    <div id={USER_DASHBOARD_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* Free Starter Pack Claim Reminder Banner */}
      <UserUnclaimedPackBanner />

      {/* 1. Header with greeting and primary action CTAs */}
      <UserDashboardHeading userName={currentUser?.name} />

      {loading && <UserFeedback kind="loading" title={t("common.loading")} />}

      {!loading && error && (
        <div id={USER_DASHBOARD_SEMANTIC_IDS.FEEDBACK}>
          <UserFeedback
            kind="error"
            title={t(USER_DASHBOARD_TEXT_CONSTANT.ERROR_TITLE)}
            description={t(error)}
            action={
              <Button onClick={retryLoad} size="sm">
                {t(USER_DASHBOARD_TEXT_CONSTANT.ERROR_RETRY)}
              </Button>
            }
          />
        </div>
      )}

      {!loading && !error && (
        <>
          <UserDashboardKpiSection
            cardsCount={cards.length}
            decksCount={decks.filter((deck) => !deck.isPreset && !deck.isTemporary).length}
            totalWins={totalWins}
            totalMatches={matchHistory.length}
          />
          <UserDashboardFeaturesSection />
          <UserDashboardMatchHistorySection matchHistory={matchHistory} />
        </>
      )}
    </div>
  );
}
