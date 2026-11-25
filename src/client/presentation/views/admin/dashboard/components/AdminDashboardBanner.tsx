"use client";

import React from "react";
import Link from "next/link";
import { Layers, ShieldCheck, Users } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { ADMIN_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminDashboardBannerProps {
  readonly usersCount: number | null;
}

export function AdminDashboardBanner({
  usersCount,
}: AdminDashboardBannerProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={ADMIN_DASHBOARD_SEMANTIC_IDS.BANNER}
      className="rounded-[24px] border border-[rgba(103,102,255,0.28)] bg-gradient-to-br from-[#0F0927] via-[#080220] to-[#1A1040] p-6 shadow-xl sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span
            id={ADMIN_DASHBOARD_SEMANTIC_IDS.BANNER_BADGE}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#0DB561]/35 bg-[#0DB561]/15 px-3 py-1 text-xs font-bold text-[#3CE089]"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(ADMIN_DASHBOARD_TEXT_CONSTANT.BANNER_BADGE)}</span>
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.TITLE_KEY)}
          </h2>
          <p className="mt-1 text-xs text-[#CFCBE2] sm:text-sm">
            {t(ADMIN_DASHBOARD_TEXT_CONSTANT.SUBTITLE_KEY)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            id={ADMIN_DASHBOARD_SEMANTIC_IDS.MANAGE_USERS_LINK}
            href={ROUTES.ADMIN_USERS(locale)}
            className="nc-btn-secondary px-5 py-2.5 text-xs"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>
              {t(ADMIN_DASHBOARD_TEXT_CONSTANT.ACTION_MANAGE_USERS)}
              {usersCount !== null ? ` (${usersCount})` : ""}
            </span>
          </Link>
          <Link
            id={ADMIN_DASHBOARD_SEMANTIC_IDS.CURATE_CARDS_LINK}
            href={ROUTES.ADMIN_CARDS(locale)}
            className="nc-btn-primary px-5 py-2.5 text-xs"
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>{t(ADMIN_DASHBOARD_TEXT_CONSTANT.ACTION_CURATE_CARDS)}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

