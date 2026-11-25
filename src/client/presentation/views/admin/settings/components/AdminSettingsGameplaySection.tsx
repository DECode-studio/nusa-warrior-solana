"use client";

import React from "react";
import { Coins, Music, Swords, Timer } from "lucide-react";
import { InputField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_SETTINGS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_SETTINGS_TEXT_CONSTANT } from "../constants/TextConstant";
import type { AdminSettings } from "../hooks/useAdminSettings";

export interface AdminSettingsGameplaySectionProps {
  readonly settings: AdminSettings;
  readonly onUpdate: <K extends keyof AdminSettings>(
    key: K,
    value: AdminSettings[K]
  ) => void;
}

export function AdminSettingsGameplaySection({
  settings,
  onUpdate,
}: AdminSettingsGameplaySectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={ADMIN_SETTINGS_SEMANTIC_IDS.GAMEPLAY_SECTION}
      className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 border-b border-[rgba(103,102,255,0.18)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0DB561]/20 text-[#0DB561]">
          <Swords className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.GAMEPLAY_TITLE)}
          </h2>
          <p className="text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.GAMEPLAY_SUBTITLE)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Turn Timeout Selection */}
        <div className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[#A9A8FF]" />
            <label className="text-xs font-bold text-white">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.TURN_TIMEOUT_TITLE)}
            </label>
          </div>
          <p className="mt-1 text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.TURN_TIMEOUT_DESC)}
          </p>
          <select
            id={ADMIN_SETTINGS_SEMANTIC_IDS.TURN_TIMEOUT_SELECT}
            value={settings.turnTimeoutSeconds}
            onChange={(e) =>
              onUpdate("turnTimeoutSeconds", parseInt(e.target.value, 10))
            }
            className="mt-3 w-full rounded-xl border border-[rgba(103,102,255,0.35)] bg-[#0F0927] px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-[#6766FF] cursor-pointer"
          >
            <option value={30}>{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_TIMEOUT_30)}</option>
            <option value={45}>{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_TIMEOUT_45)}</option>
            <option value={60}>{t(ADMIN_SETTINGS_TEXT_CONSTANT.OPT_TIMEOUT_60)}</option>
          </select>
        </div>

        {/* Max Deck Cards */}
        <div className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-[#0DB561]" />
            <span className="text-xs font-bold text-white">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.MAX_CARDS_TITLE)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.MAX_CARDS_DESC)}
          </p>
          <InputField
            id={ADMIN_SETTINGS_SEMANTIC_IDS.MAX_DECK_CARDS_INPUT}
            aria-label={t(ADMIN_SETTINGS_TEXT_CONSTANT.MAX_CARDS_TITLE)}
            type="number"
            min={5}
            max={20}
            value={settings.maxDeckCards}
            onChange={(e) =>
              onUpdate("maxDeckCards", Math.max(5, parseInt(e.target.value, 10) || 10))
            }
            containerClassName="mt-3"
            sizeVariant="sm"
            className="!bg-[#0F0927] !font-semibold"
          />
        </div>

        {/* Starter Coins Allocation */}
        <div className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#FF9F31]" />
            <span className="text-xs font-bold text-white">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.STARTER_COINS_TITLE)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#CFCBE2]">
            {t(ADMIN_SETTINGS_TEXT_CONSTANT.STARTER_COINS_DESC)}
          </p>
          <InputField
            id={ADMIN_SETTINGS_SEMANTIC_IDS.STARTER_COINS_INPUT}
            aria-label={t(ADMIN_SETTINGS_TEXT_CONSTANT.STARTER_COINS_TITLE)}
            type="number"
            min={0}
            step={100}
            value={settings.starterCoins}
            onChange={(e) =>
              onUpdate("starterCoins", Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            containerClassName="mt-3"
            sizeVariant="sm"
            className="!bg-[#0F0927] !font-semibold"
          />
        </div>

        {/* BGM Audio Engine Toggle */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/70 p-4">
          <div>
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-[#A9A8FF]" />
              <span className="text-xs font-bold text-white">
                {t(ADMIN_SETTINGS_TEXT_CONSTANT.BGM_TITLE)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#CFCBE2] leading-relaxed">
              {t(ADMIN_SETTINGS_TEXT_CONSTANT.BGM_DESC)}
            </p>
          </div>
          <button
            id={ADMIN_SETTINGS_SEMANTIC_IDS.BGM_TOGGLE}
            type="button"
            role="switch"
            aria-checked={settings.defaultBgmEnabled}
            onClick={() =>
              onUpdate("defaultBgmEnabled", !settings.defaultBgmEnabled)
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              settings.defaultBgmEnabled ? "bg-[#0DB561]" : "bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                settings.defaultBgmEnabled
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
