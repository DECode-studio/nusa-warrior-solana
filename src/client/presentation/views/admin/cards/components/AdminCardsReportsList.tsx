"use client";

import React from "react";
import type {
  CorrectionReportEntity,
  CorrectionReportStatus,
} from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { ADMIN_CARDS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminCardsReportsListProps {
  readonly reports: readonly (CorrectionReportEntity & {
    readonly cardName?: string;
    readonly cardSlug?: string;
  })[];
  readonly onUpdateReportStatus: (
    reportId: string,
    status: CorrectionReportStatus
  ) => Promise<void>;
}

export function AdminCardsReportsList({
  reports,
  onUpdateReportStatus,
}: AdminCardsReportsListProps): React.ReactElement {
  const { t } = useTranslator();

  if (reports.length === 0) {
    return (
      <div
        id={ADMIN_CARDS_SEMANTIC_IDS.REPORTS_EMPTY}
        className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-8 text-center text-sm text-[#CFCBE2]"
      >
        {t(ADMIN_CARDS_TEXT_CONSTANT.REPORTS_EMPTY)}
      </div>
    );
  }

  return (
    <div id={ADMIN_CARDS_SEMANTIC_IDS.REPORTS_LIST} className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          id={`${ADMIN_CARDS_SEMANTIC_IDS.REPORT_ITEM_PREFIX}${report.id}`}
          className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 space-y-3 p-5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="nc-badge-amber">
                {t(ADMIN_CARDS_TEXT_CONSTANT.REPORT_CARD)} {report.cardName ?? report.cardId} (
                {report.cardSlug ?? report.cardId})
              </span>
              <span className="text-[#CFCBE2]">
                {t(ADMIN_CARDS_TEXT_CONSTANT.REPORT_REPORTER)}{" "}
                <strong className="text-white">{report.reporterName}</strong> •{" "}
                {t(ADMIN_CARDS_TEXT_CONSTANT.REPORT_CATEGORY)}{" "}
                {report.category}
              </span>
            </div>
            <span className="nc-badge-primary">
              {t(ADMIN_CARDS_TEXT_CONSTANT.REPORT_STATUS)} {report.status}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-white">
            {report.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {(
              ["OPEN", "REVIEWED", "RESOLVED", "DISMISSED"] as const
            ).map((st) => (
              <button
                key={st}
                id={`${ADMIN_CARDS_SEMANTIC_IDS.REPORT_STATUS_BTN_PREFIX}${report.id}-${st.toLowerCase()}`}
                type="button"
                aria-pressed={report.status === st}
                onClick={() =>
                  void onUpdateReportStatus(report.id, st as CorrectionReportStatus)
                }
                className={`cursor-pointer ${
                  report.status === st
                    ? "nc-btn-primary px-3.5 py-2 text-xs"
                    : "nc-btn-secondary px-3.5 py-2 text-xs"
                }`}
              >
                {t(ADMIN_CARDS_TEXT_CONSTANT.SET_PREFIX)} {st}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

