"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { ADMIN_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminDashboardKingdomBreakdownProps {
  readonly cards: readonly CardEntity[];
  readonly withdrawnCardsCount: number;
}

export function AdminDashboardKingdomBreakdown({
  cards,
  withdrawnCardsCount,
}: AdminDashboardKingdomBreakdownProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const rows = [
    {
      id: "majapahit",
      label: t(ADMIN_DASHBOARD_TEXT_CONSTANT.KINGDOM_MAJAPAHIT),
      count: cards.filter((c) => c.kingdom === "MAJAPAHIT").length,
      badge: "nc-badge-amber",
    },
    {
      id: "pajajaran",
      label: t(ADMIN_DASHBOARD_TEXT_CONSTANT.KINGDOM_PAJAJARAN),
      count: cards.filter((c) => c.kingdom === "PAJAJARAN").length,
      badge: "nc-badge-primary",
    },
    {
      id: "nusantara",
      label: t(ADMIN_DASHBOARD_TEXT_CONSTANT.KINGDOM_NUSANTARA),
      count: cards.filter((c) => c.kingdom === "NUSANTARA_UMUM").length,
      badge: "nc-badge-emerald",
    },
    {
      id: "withdrawn",
      label: t(ADMIN_DASHBOARD_TEXT_CONSTANT.CARDS_WITHDRAWN),
      count: withdrawnCardsCount,
      badge: "nc-badge-amber",
    },
  ];

  return (
    <section
      id={ADMIN_DASHBOARD_SEMANTIC_IDS.KINGDOM_BREAKDOWN}
      className="rounded-[24px] border border-[rgba(103,102,255,0.22)] bg-[#0F0927]/95 p-6 lg:col-span-6"
    >
      <div className="flex items-center justify-between border-b border-[rgba(103,102,255,0.18)] pb-3.5">
        <h3 className="font-display text-lg font-bold text-white">
          {t(ADMIN_DASHBOARD_TEXT_CONSTANT.DISTRIBUTION_TITLE)}
        </h3>
        <Link
          href={ROUTES.ADMIN_CARDS(locale)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#A8A7FF] hover:text-white"
        >
          <span>{t(ADMIN_DASHBOARD_TEXT_CONSTANT.DISTRIBUTION_LINK)}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            id={`${ADMIN_DASHBOARD_SEMANTIC_IDS.KINGDOM_ROW_PREFIX}${row.id}`}
            className="flex items-center justify-between rounded-xl border border-[rgba(103,102,255,0.2)] bg-[#07011F]/90 p-3.5 text-xs"
          >
            <span className="font-semibold text-white">{row.label}</span>
            <span className={row.badge}>
              {row.count} {t(ADMIN_DASHBOARD_TEXT_CONSTANT.CARDS_UNIT)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

