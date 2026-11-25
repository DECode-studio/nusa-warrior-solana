"use client";

import React from "react";
import { Layers, ShieldCheck, ShoppingBag, Trophy } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { UserStatCard } from "@/client/presentation/components/user";
import { USER_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { USER_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UserDashboardKpiSectionProps {
  readonly cardsCount: number;
  readonly decksCount: number;
  readonly totalWins: number;
  readonly totalMatches: number;
}

export function UserDashboardKpiSection({
  cardsCount,
  decksCount,
  totalWins,
  totalMatches,
}: UserDashboardKpiSectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={USER_DASHBOARD_SEMANTIC_IDS.KPI_GRID}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div id={USER_DASHBOARD_SEMANTIC_IDS.STAT_COLLECTION}>
        <UserStatCard
          label={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_COLLECTION_LABEL)}
          value={t(USER_DASHBOARD_TEXT_CONSTANT.CARDS_VALUE, { count: cardsCount })}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_COLLECTION_DESC)}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="emerald"
        />
      </div>

      <div id={USER_DASHBOARD_SEMANTIC_IDS.STAT_DECKS}>
        <UserStatCard
          label={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_DECKS_LABEL)}
          value={t(USER_DASHBOARD_TEXT_CONSTANT.DECKS_VALUE, { count: decksCount })}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_DECKS_DESC)}
          icon={<Layers className="h-4 w-4" />}
        />
      </div>

      <div id={USER_DASHBOARD_SEMANTIC_IDS.STAT_WINRATE}>
        <UserStatCard
          label={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_WINRATE_LABEL)}
          value={`${totalWins} / ${totalMatches}`}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_WINRATE_DESC)}
          icon={<Trophy className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      <div id={USER_DASHBOARD_SEMANTIC_IDS.STAT_FAIRPLAY}>
        <UserStatCard
          label={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_FAIRPLAY_LABEL)}
          value={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_FAIRPLAY_VAL)}
          description={t(USER_DASHBOARD_TEXT_CONSTANT.STAT_FAIRPLAY_DESC)}
          icon={<ShoppingBag className="h-4 w-4" />}
          accent="emerald"
        />
      </div>
    </section>
  );
}

