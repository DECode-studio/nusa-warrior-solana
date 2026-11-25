"use client";

import React from "react";
import { Cpu, Database, Info, Layers, ShieldCheck } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_SETTINGS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_SETTINGS_TEXT_CONSTANT } from "../constants/TextConstant";

export function AdminSettingsSystemInfoSection(): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_SETTINGS_SEMANTIC_IDS.SYSTEM_INFO_SECTION}
      className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 border-b border-[rgba(103,102,255,0.18)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5856F2]/20 text-[#A9A8FF]">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SYSTEM_INFO_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SYSTEM_INFO_SUBTITLE)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          id={ADMIN_SETTINGS_SEMANTIC_IDS.SYSTEM_INFO_RUNTIME}
          className="rounded-2xl border border-white/5 bg-[#07011F]/70 p-4"
        >
          <div className="flex items-center gap-2 text-[#A9A8FF]">
            <Cpu className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.RUNTIME_LABEL)}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.RUNTIME_VALUE)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#A5A1B9]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.RUNTIME_DESC)}
          </p>
        </div>

        <div
          id={ADMIN_SETTINGS_SEMANTIC_IDS.SYSTEM_INFO_DB}
          className="rounded-2xl border border-white/5 bg-[#07011F]/70 p-4"
        >
          <div className="flex items-center gap-2 text-[#0DB561]">
            <Database className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.DB_LABEL)}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.DB_VALUE)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#A5A1B9]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.DB_DESC)}
          </p>
        </div>

        <div
          id={ADMIN_SETTINGS_SEMANTIC_IDS.SYSTEM_INFO_DI}
          className="rounded-2xl border border-white/5 bg-[#07011F]/70 p-4"
        >
          <div className="flex items-center gap-2 text-[#FF9F31]">
            <Layers className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.DI_LABEL)}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.DI_VALUE)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#A5A1B9]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.DI_DESC)}
          </p>
        </div>

        <div
          id={ADMIN_SETTINGS_SEMANTIC_IDS.SYSTEM_INFO_SAFETY}
          className="rounded-2xl border border-white/5 bg-[#07011F]/70 p-4"
        >
          <div className="flex items-center gap-2 text-[#3CE089]">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.SAFETY_LABEL)}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SAFETY_VALUE)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#A5A1B9]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SAFETY_DESC)}
          </p>
        </div>
      </div>
    </section>
  );
}
