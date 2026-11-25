"use client";

import React from "react";
import { AdminFeedbackBanner } from "@/client/presentation/components/admin";
import {
  AdminSettingsCuratorialSection,
  AdminSettingsGameplaySection,
  AdminSettingsHeading,
  AdminSettingsSecuritySection,
  AdminSettingsSystemInfoSection,
} from "./components";
import { ADMIN_SETTINGS_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { useAdminSettings } from "./hooks/useAdminSettings";

export function AdminSettingsView(): React.ReactElement {
  const {
    settings,
    updateSetting,
    handleSave,
    handleReset,
    isSaving,
    feedback,
  } = useAdminSettings();

  return (
    <div id={ADMIN_SETTINGS_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* 1. Header Banner with Action Buttons */}
      <AdminSettingsHeading
        lastSaved={settings.lastSaved}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* 2. Action Feedback Alert */}
      {feedback && (
        <AdminFeedbackBanner
          id={ADMIN_SETTINGS_SEMANTIC_IDS.FEEDBACK}
          message={feedback.message}
          variant={feedback.variant}
        />
      )}

      {/* 3. Curatorial Integrity Settings */}
      <AdminSettingsCuratorialSection
        settings={settings}
        onUpdate={updateSetting}
      />

      {/* 4. Gameplay & Battle Rules */}
      <AdminSettingsGameplaySection
        settings={settings}
        onUpdate={updateSetting}
      />

      {/* 5. Security & Maintenance Controls */}
      <AdminSettingsSecuritySection
        settings={settings}
        onUpdate={updateSetting}
      />

      {/* 6. System Architecture & Environment Info */}
      <AdminSettingsSystemInfoSection />
    </div>
  );
}

