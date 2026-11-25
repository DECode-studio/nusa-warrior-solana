"use client";

import React from "react";
import { AlertTriangle, Clock, Lock, Shield } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { ADMIN_SETTINGS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_SETTINGS_TEXT_CONSTANT } from "../constants/TextConstant";
import type { AdminSettings } from "../hooks/useAdminSettings";

export interface AdminSettingsSecuritySectionProps {
  readonly settings: AdminSettings;
  readonly onUpdate: <K extends keyof AdminSettings>(
    key: K,
    value: AdminSettings[K]
  ) => void;
}

export function AdminSettingsSecuritySection({
  settings,
  onUpdate,
}: AdminSettingsSecuritySectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_SETTINGS_SEMANTIC_IDS.SECURITY_SECTION}
      className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 border-b border-[rgba(103,102,255,0.18)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9F31]/20 text-[#FF9F31]">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SECURITY_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SECURITY_SUBTITLE)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Session Timeout */}
        <div className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#A9A8FF]" />
            <label className="text-xs font-bold text-white">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.SESSION_TIMEOUT_TITLE)}
            </label>
          </div>
          <p className="mt-1 text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SESSION_TIMEOUT_DESC)}
          </p>
          <select
            id={ADMIN_SETTINGS_SEMANTIC_IDS.SESSION_TIMEOUT_SELECT}
            value={settings.sessionTimeoutMinutes}
            onChange={(e) =>
              onUpdate("sessionTimeoutMinutes", parseInt(e.target.value, 10))
            }
            className="mt-3 w-full rounded-xl border border-[rgba(103,102,255,0.35)] bg-[#0F0927] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#6766FF] cursor-pointer"
          >
            <option value={15}>{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_SESSION_15)}</option>
            <option value={30}>{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_SESSION_30)}</option>
            <option value={60}>{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_SESSION_60)}</option>
          </select>
        </div>

        {/* CSRF & Same-Origin Protection */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#0DB561]" />
              <span className="text-xs font-bold text-white">
                {t(ADMIN_SETTINGS_TEXT_CONSTANT.CSRF_TITLE)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#CFCBE2] leading-relaxed">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.CSRF_DESC)}
            </p>
          </div>
          <button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.CSRF_CHECK_TOGGLE}
            type="button"
            role="switch"
            aria-checked={settings.csrfProtection}
            onClick={() =>
              onUpdate("csrfProtection", !settings.csrfProtection)
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              settings.csrfProtection ? "bg-[#0DB561]" : "bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.csrfProtection
                  ? "translate-x-5.5 mt-0.5"
                  : "translate-x-0.5 mt-0.5"
              }`}
            />
          </button>
        </div>

        {/* Maintenance Mode */}
        <div className="md:col-span-2 flex items-start justify-between gap-4 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-bold text-rose-300">
                {t(ADMIN_SETTINGS_TEXT_CONSTANT.MAINTENANCE_TITLE)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#CFCBE2] leading-relaxed">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.MAINTENANCE_DESC)}
            </p>
          </div>
          <button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.MAINTENANCE_TOGGLE}
            type="button"
            role="switch"
            aria-checked={settings.maintenanceMode}
            onClick={() =>
              onUpdate("maintenanceMode", !settings.maintenanceMode)
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              settings.maintenanceMode ? "bg-rose-500" : "bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.maintenanceMode
                  ? "translate-x-5.5 mt-0.5"
                  : "translate-x-0.5 mt-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
