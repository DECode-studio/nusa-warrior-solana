"use client";

import React from "react";
import Image from "next/image";
import { Compass, Gift, Sparkles, Swords } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { BaseModal } from "@/client/presentation/components/ui";
import { useUserOnboardingStore } from "@/client/presentation/stores/onboardingStore";

export interface UserWelcomeTourModalProps {
  readonly userName?: string | null;
}

export function UserWelcomeTourModal({
  userName,
}: UserWelcomeTourModalProps): React.ReactElement | null {
  const { t } = useTranslator();
  const {
    welcomeModalOpen,
    closeWelcomeModal,
    startTourTrack,
    openTrackSelectModal,
    isInitialized,
  } = useUserOnboardingStore();

  if (!isInitialized) return null;

  const displayName = userName || t("common.warrior");

  const handleStartPrimaryTour = () => {
    gamelanAudio.playGamelanChord();
    startTourTrack("new-warrior-journey");
  };

  const handleOpenMultiTrack = () => {
    gamelanAudio.playCardSelect();
    closeWelcomeModal();
    openTrackSelectModal();
  };

  const handleDismiss = () => {
    gamelanAudio.playCardSelect();
    closeWelcomeModal();
  };

  return (
    <BaseModal
      id="user-welcome-tour-modal"
      isOpen={welcomeModalOpen}
      onClose={handleDismiss}
      size="lg"
      mobileBehavior="bottomsheet"
      showCloseButton={true}
    >
      {/* 2-Column Symmetrical Layout */}
      <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-7">
        {/* Left: Royal Guide Avatar / Portrait Card */}
        <div className="shrink-0">
          <div className="relative w-48 sm:w-56 h-[320px] sm:h-[360px] overflow-hidden rounded-2xl border-2 border-[#FFBD70]/60 shadow-[0_12px_40px_rgba(255,189,112,0.25)]">
            <Image
              src="/images/onboarding/guide-citraresmi.png"
              alt="Putri Dyah Citraresmi"
              fill
              sizes="(max-width: 640px) 192px, 224px"
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07011F] via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-2.5 inset-x-2.5 rounded-xl bg-black/65 p-2 text-center backdrop-blur-xs border border-[#FFBD70]/20">
              <span className="block font-display text-xs font-bold text-[#FFBD70]">
                Putri Dyah Citraresmi
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-white/70">
                {t("tour.guideRole")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Welcome Greeting & Journey Highlights */}
        <div className="flex-1 flex flex-col justify-between space-y-4 text-center md:text-left min-w-0">
          {/* Header: Badge & Title */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FFBD70]/30 bg-[#FFBD70]/10 px-3 py-1 text-xs font-semibold text-[#FFBD70]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("tour.welcomeBadge")}</span>
            </div>
            <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold tracking-wide text-white leading-snug">
              {t("tour.welcomeTitle", { name: displayName })}
            </h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#CFCBE2]/85">
              {t("tour.welcomeGreeting")}
            </p>
          </div>

          {/* Symmetrical 2-Column Perk Cards with Equal Heights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 min-h-[64px]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                <Gift className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {t("tour.perkFreePackTitle")}
                </div>
                <div className="text-[11px] text-emerald-300 truncate">
                  {t("tour.perkFreePackSubtitle")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-[#6766FF]/30 bg-[#6766FF]/10 p-3 min-h-[64px]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6766FF]/15 border border-[#6766FF]/30">
                <Swords className="h-4.5 w-4.5 text-[#8C62FF]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {t("tour.perkCombatTitle")}
                </div>
                <div className="text-[11px] text-[#CFCBE2] truncate">
                  {t("tour.perkCombatSubtitle")}
                </div>
              </div>
            </div>
          </div>

          {/* Symmetrical Action Buttons with Equal Heights */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartPrimaryTour}
                className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFBD70] via-[#FFA229] to-[#FF8900] px-4 font-display text-xs sm:text-sm font-bold text-[#07011F] shadow-[0_4px_20px_rgba(255,189,112,0.4)] transition-all hover:brightness-110 active:scale-98 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{t("tour.ctaStartTour")}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMultiTrack}
                className="sm:w-auto h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 font-display text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Compass className="h-4 w-4 text-[#FFBD70] shrink-0" />
                <span>{t("tour.ctaExploreTracks")}</span>
              </button>
            </div>

            {/* Centered Subtle Skip Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline cursor-pointer transition-colors"
              >
                {t("tour.ctaSkip")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
