"use client";

import React from "react";
import { Clock, RotateCcw, Save, Settings } from "lucide-react";
import { Button } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_SETTINGS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_SETTINGS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminSettingsHeadingProps {
  readonly lastSaved: string | null;
  readonly isSaving: boolean;
  readonly onSave: () => void;
  readonly onReset: () => void;
}

export function AdminSettingsHeading({
  lastSaved,
  isSaving,
  onSave,
  onReset,
}: AdminSettingsHeadingProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={ADMIN_SETTINGS_SEMANTIC_IDS.HEADER}
      className="relative overflow-hidden rounded-[24px] border border-[rgba(103,102,255,0.28)] bg-gradient-to-br from-[#0F0927] via-[#080220] to-[#1A1040] p-6 shadow-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#6766FF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[#0DB561]/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div
            id={ADMIN_SETTINGS_SEMANTIC_IDS.HEADER_TAG}
            className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#A9A8FF] uppercase"
          >
            <Settings className="h-4 w-4" />
            <span>{t(ADMIN_SETTINGS_TEXT_CONSTANT.HEADER_TAG)}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.TITLE)}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#CFCBE2] sm:text-sm">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.SUBTITLE)}
          </p>

          {lastSaved && (
            <div
              id={ADMIN_SETTINGS_SEMANTIC_IDS.HEADER_LAST_SAVED}
              className="mt-3 flex items-center gap-1.5 text-[11px] text-[#A5A1B9]"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                {t(ADMIN_SETTINGS_TEXT_CONSTANT.LAST_SAVED_PREFIX)}{" "}
                {new Date(lastSaved).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.RESET_BTN}
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw size={14} />}
          >
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.BTN_RESET)}
          </Button>

          <Button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.SAVE_BTN}
            type="button"
            size="sm"
            isLoading={isSaving}
            disabled={isSaving}
            onClick={onSave}
            leftIcon={<Save size={14} />}
          >
            {isSaving
              ? t(ADMIN_SETTINGS_TEXT_CONSTANT.SAVING)
              : t(ADMIN_SETTINGS_TEXT_CONSTANT.BTN_SAVE)}
          </Button>
        </div>
      </div>
    </div>
  );
}
