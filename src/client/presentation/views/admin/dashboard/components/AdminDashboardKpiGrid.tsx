"use client";

import React from "react";
import { CheckCircle2, Flag, Layers, Users } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminDashboardKpiGridProps {
  readonly totalCards: number;
  readonly activeCardsCount: number;
  readonly withdrawnCardsCount: number;
  readonly verifiedCardsCount: number;
  readonly totalUsers: number;
  readonly openReportsCount: number;
  readonly totalReports: number;
}

export function AdminDashboardKpiGrid({
  totalCards,
  activeCardsCount,
  withdrawnCardsCount,
  verifiedCardsCount,
  totalUsers,
  openReportsCount,
  totalReports,
}: AdminDashboardKpiGridProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_DASHBOARD_SEMANTIC_IDS.KPI_GRID}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* 1. Total Curated Cards */}
      <div
        id={ADMIN_DASHBOARD_SEMANTIC_IDS.KPI_TOTAL_CARDS}
        className="rounded-[20px] border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/95 p-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#CFCBE2]">
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_TOTAL_CARDS)}
          </span>
          <Layers className="h-4 w-4 text-[#6766FF]" aria-hidden="true" />
        </div>
        <div className="mt-2 font-display text-3xl font-bold text-white">
          {totalCards}
        </div>
        <p className="mt-1 text-[11px] text-[#3CE089]">
          {activeCardsCount} {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_ACTIVE)} •{" "}
          {withdrawnCardsCount} {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_WITHDRAWN)}
        </p>
      </div>

      {/* 2. Verified Inscriptions */}
      <div
        id={ADMIN_DASHBOARD_SEMANTIC_IDS.KPI_VERIFIED_CARDS}
        className="rounded-[20px] border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/95 p-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#CFCBE2]">
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_VERIFIED)}
          </span>
          <CheckCircle2 className="h-4 w-4 text-[#0DB561]" aria-hidden="true" />
        </div>
        <div className="mt-2 font-display text-3xl font-bold text-white">
          {verifiedCardsCount}
        </div>
        <p className="mt-1 text-[11px] text-[#CFCBE2]/75">
          {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_VERIFIED_DESC).replace(
            "{total}",
            totalCards.toString()
          )}
        </p>
      </div>

      {/* 3. Registered Users */}
      <div
        id={ADMIN_DASHBOARD_SEMANTIC_IDS.KPI_USERS}
        className="rounded-[20px] border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/95 p-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#CFCBE2]">
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_USERS)}
          </span>
          <Users className="h-4 w-4 text-[#FF9F31]" aria-hidden="true" />
        </div>
        <div className="mt-2 font-display text-3xl font-bold text-white">
          {totalUsers}
        </div>
        <p className="mt-1 text-[11px] text-[#CFCBE2]/75">
          {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_USERS_DESC)}
        </p>
      </div>

      {/* 4. Open Reports */}
      <div
        id={ADMIN_DASHBOARD_SEMANTIC_IDS.KPI_OPEN_REPORTS}
        className="rounded-[20px] border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/95 p-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#CFCBE2]">
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_REPORTS)}
          </span>
          <Flag className="h-4 w-4 text-rose-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-display text-3xl font-bold text-white">
          {openReportsCount}
        </div>
        <p className="mt-1 text-[11px] text-[#CFCBE2]/75">
          {t(ADMIN_DASHBOARD_TEXT_CONSTANT.KPI_REPORTS_DESC).replace(
            "{total}",
            totalReports.toString()
          )}
        </p>
      </div>
    </section>
  );
}
