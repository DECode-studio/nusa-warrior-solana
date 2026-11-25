"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CorrectionReportEntity } from "@/client/domain/card/entity/card_entity";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { ADMIN_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminDashboardRecentReportsProps {
  readonly reports: readonly (CorrectionReportEntity & {
    readonly cardName?: string;
  })[];
}

export function AdminDashboardRecentReports({
  reports,
}: AdminDashboardRecentReportsProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={ADMIN_DASHBOARD_SEMANTIC_IDS.RECENT_REPORTS}
      className="rounded-[24px] border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/95 p-6 lg:col-span-6"
    >
      <div className="flex items-center justify-between border-b border-[rgba(103,102,255,0.18)] pb-3.5">
        <h3 className="font-display text-lg font-bold text-white">
          {t(ADMIN_DASHBOARD_TEXT_CONSTANT.REPORTS_TITLE)}
        </h3>
        <Link
          href={ROUTES.ADMIN_CARDS(locale)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#A8A7FF] hover:text-white"
        >
          <span>{t(ADMIN_DASHBOARD_TEXT_CONSTANT.REPORTS_LINK)}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {reports.length === 0 ? (
          <div
            id={ADMIN_DASHBOARD_SEMANTIC_IDS.REPORTS_EMPTY}
            className="rounded-xl border border-dashed border-[rgba(103,102,255,0.25)] bg-[#07011F]/60 p-6 text-center text-xs text-[#CFCBE2]"
          >
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.REPORTS_EMPTY)}
          </div>
        ) : (
          reports.slice(0, 4).map((rep) => (
            <div
              key={rep.id}
              id={`${ADMIN_DASHBOARD_SEMANTIC_IDS.REPORT_ITEM_PREFIX}${rep.id}`}
              className="rounded-xl border border-[rgba(103,102,255,0.2)] bg-[#07011F]/90 p-3.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  {rep.cardName ?? rep.cardId}
                </span>
                <span className="nc-badge-primary">
                  {t(ADMIN_DASHBOARD_TEXT_CONSTANT.REPORTS_STATUS)} {rep.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[#CFCBE2]">
                {rep.description}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

