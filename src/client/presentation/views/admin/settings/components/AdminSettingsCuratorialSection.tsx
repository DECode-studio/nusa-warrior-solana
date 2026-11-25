"use client";

import React from "react";
import { BookOpen, CheckCircle, ShieldCheck } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_SETTINGS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_SETTINGS_TEXT_CONSTANT } from "../constants/TextConstant";
import type { AdminSettings } from "../hooks/useAdminSettings";

export interface AdminSettingsCuratorialSectionProps {
  readonly settings: AdminSettings;
  readonly onUpdate: <K extends keyof AdminSettings>(
    key: K,
    value: AdminSettings[K]
  ) => void;
}

export function AdminSettingsCuratorialSection({
  settings,
  onUpdate,
}: AdminSettingsCuratorialSectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_SETTINGS_SEMANTIC_IDS.CURATORIAL_SECTION}
      className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 border-b border-[rgba(103,102,255,0.18)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6766FF]/20 text-[#A9A8FF]">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.CURATORIAL_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.CURATORIAL_SUBTITLE)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Toggle 1: Strict Verification */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#A9A8FF]" />
              <span className="text-xs font-bold text-white">
                {t(ADMIN_SETTINGS_TEXT_CONSTANT.STRICT_VERIF_TITLE)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#CFCBE2] leading-relaxed">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.STRICT_VERIF_DESC)}
            </p>
          </div>
          <button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.STRICT_VERIFICATION_TOGGLE}
            type="button"
            role="switch"
            aria-checked={settings.strictVerification}
            onClick={() =>
              onUpdate("strictVerification", !settings.strictVerification)
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              settings.strictVerification ? "bg-[#6766FF]" : "bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.strictVerification
                  ? "translate-x-5.5 mt-0.5"
                  : "translate-x-0.5 mt-0.5"
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Auto Alert Correction */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#3CE089]" />
              <span className="text-xs font-bold text-white">
                {t(ADMIN_SETTINGS_TEXT_CONSTANT.AUTO_ALERT_TITLE)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#CFCBE2] leading-relaxed">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.AUTO_ALERT_DESC)}
            </p>
          </div>
          <button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.AUTO_ALERT_TOGGLE}
            type="button"
            role="switch"
            aria-checked={settings.autoAlertCorrection}
            onClick={() =>
              onUpdate("autoAlertCorrection", !settings.autoAlertCorrection)
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              settings.autoAlertCorrection ? "bg-[#0DB561]" : "bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.autoAlertCorrection
                  ? "translate-x-5.5 mt-0.5"
                  : "translate-x-0.5 mt-0.5"
              }`}
            />
          </button>
        </div>

        {/* Select 1: Default Publication Status */}
        <div className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <label className="block text-xs font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.PUB_STATUS_TITLE)}
          </label>
          <p className="mt-0.5 text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.PUB_STATUS_DESC)}
          </p>
          <select
            id={ADMIN_SETTINGS_SEMANTIC_IDS.DEFAULT_PUB_STATUS_SELECT}
            value={settings.defaultPublicationStatus}
            onChange={(e) =>
              onUpdate(
                "defaultPublicationStatus",
                e.target.value as "ACTIVE" | "WITHDRAWN"
              )
            }
            className="mt-3 w-full rounded-xl border border-[rgba(103,102,255,0.35)] bg-[#0F0927] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#6766FF] cursor-pointer"
          >
            <option value="ACTIVE">{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_ACTIVE)}</option>
            <option value="WITHDRAWN">{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_WITHDRAWN)}</option>
          </select>
        </div>

        {/* Select 2: Default Curatorial Locale */}
        <div className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <label className="block text-xs font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.LOCALE_TITLE)}
          </label>
          <p className="mt-0.5 text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.LOCALE_DESC)}
          </p>
          <select
            id={ADMIN_SETTINGS_SEMANTIC_IDS.DEFAULT_LOCALE_SELECT}
            value={settings.defaultLocale}
            onChange={(e) =>
              onUpdate(
                "defaultLocale",
                e.target.value as "id" | "en" | "zh"
              )
            }
            className="mt-3 w-full rounded-xl border border-[rgba(103,102,255,0.35)] bg-[#0F0927] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#6766FF] cursor-pointer"
          >
            <option value="id">{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_LOCALE_ID)}</option>
            <option value="en">{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_LOCALE_EN)}</option>
            <option value="zh">{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_LOCALE_ZH)}</option>
          </select>
        </div>
      </div>
    </section>
  );
}
