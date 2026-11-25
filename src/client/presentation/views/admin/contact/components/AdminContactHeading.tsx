"use client";

import React from "react";
import { Mail, MessageSquare } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_CONTACT_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_CONTACT_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminContactHeadingProps {
  readonly newCount: number;
}

export function AdminContactHeading({
  newCount,
}: AdminContactHeadingProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={ADMIN_CONTACT_SEMANTIC_IDS.HEADER}
      className="relative overflow-hidden rounded-[24px] border border-[rgba(103,102,255,0.28)] bg-gradient-to-br from-[#0F0927] via-[#080220] to-[#1A1040] p-6 shadow-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#6766FF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#0DB561]/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div
            id={ADMIN_CONTACT_SEMANTIC_IDS.HEADER_TAG}
            className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#A9A8FF] uppercase"
          >
            <Mail className="h-4 w-4" />
            <span>{t(ADMIN_CONTACT_TEXT_CONSTANT.HEADER_TAG)}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.TITLE)}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#CFCBE2] sm:text-sm">
            {t(ADMIN_CONTACT_TEXT_CONSTANT.SUBTITLE)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            id={ADMIN_CONTACT_SEMANTIC_IDS.HEADER_UNRESOLVED_BADGE}
            className="flex items-center gap-2.5 rounded-2xl border border-[#FF9F31]/30 bg-[#FF9F31]/10 px-4 py-2.5 backdrop-blur-xs"
          >
            <MessageSquare className="h-5 w-5 text-[#FF9F31]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#CFCBE2]">
                {t(ADMIN_CONTACT_TEXT_CONSTANT.UNRESOLVED_LABEL)}
              </p>
              <p className="font-display text-lg font-bold text-white">
                {t(ADMIN_CONTACT_TEXT_CONSTANT.NEW_MESSAGES_COUNT, {
                  count: newCount,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
