"use client";

import { useEffect, useState } from "react";
import { useTranslator } from "@/core/translator";
import { ADMIN_SETTINGS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminSettings {
  readonly strictVerification: boolean;
  readonly autoAlertCorrection: boolean;
  readonly defaultPublicationStatus: "ACTIVE" | "WITHDRAWN";
  readonly defaultLocale: "id" | "en" | "zh";
  readonly turnTimeoutSeconds: number;
  readonly maxDeckCards: number;
  readonly starterCoins: number;
  readonly defaultBgmEnabled: boolean;
  readonly sessionTimeoutMinutes: number;
  readonly maintenanceMode: boolean;
  readonly csrfProtection: boolean;
  readonly lastSaved: string | null;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  strictVerification: true,
  autoAlertCorrection: true,
  defaultPublicationStatus: "ACTIVE",
  defaultLocale: "id",
  turnTimeoutSeconds: 45,
  maxDeckCards: 10,
  starterCoins: 1000,
  defaultBgmEnabled: true,
  sessionTimeoutMinutes: 30,
  maintenanceMode: false,
  csrfProtection: true,
  lastSaved: null,
};

const STORAGE_KEY = "nusantara_admin_system_settings";

export function useAdminSettings() {
  const { t } = useTranslator();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    readonly message: string;
    readonly variant: "success" | "error";
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings(JSON.parse(saved) as AdminSettings);
      }
    } catch {
      // ignore
    }
  }, []);

  const updateSetting = <K extends keyof AdminSettings>(
    key: K,
    value: AdminSettings[K]
  ): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (): void => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated: AdminSettings = {
        ...settings,
        lastSaved: new Date().toISOString(),
      };
      setSettings(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setFeedback({
        message: t(ADMIN_SETTINGS_TEXT_CONSTANT.FEEDBACK_SAVED),
        variant: "success",
      });
    } catch {
      setFeedback({
        message: t(ADMIN_SETTINGS_TEXT_CONSTANT.FEEDBACK_ERROR),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = (): void => {
    setSettings(DEFAULT_ADMIN_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setFeedback({
      message: t(ADMIN_SETTINGS_TEXT_CONSTANT.FEEDBACK_RESET),
      variant: "success",
    });
  };

  return {
    settings,
    updateSetting,
    handleSave,
    handleReset,
    isSaving,
    feedback,
  };
}
