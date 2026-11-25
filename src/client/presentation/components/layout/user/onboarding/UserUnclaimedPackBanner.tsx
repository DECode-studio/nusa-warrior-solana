"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gift, Sparkles } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { useUserOnboardingStore } from "@/client/presentation/stores/onboardingStore";

export function UserUnclaimedPackBanner(): React.ReactElement | null {
  const router = useRouter();
  const { locale, t } = useTranslator();
  const { hasClaimedFreePack, startTourTrack, isInitialized } = useUserOnboardingStore();

  if (!isInitialized || hasClaimedFreePack) return null;

  const handleClaim = () => {
    gamelanAudio.playGamelanChord();
    router.push(ROUTES.USER_SHOP(locale));
  };

  const handleStartTour = () => {
    gamelanAudio.playGamelanChord();
    startTourTrack("new-warrior-journey");
  };

  return (
    <div
      id="user-unclaimed-pack-banner"
      className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-[#0a0320]/80 to-[#150a30]/80 p-4 sm:p-5 shadow-[0_8px_30px_rgba(16,185,129,0.2)] backdrop-blur-xl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Pack Artwork & Notice */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-400/40 bg-black/40 shadow-md">
            <Image
              src="/assets/pack/pack-starter.png"
              alt="Free Starter Pack"
              fill
              className="object-contain p-1"
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <Gift className="h-3 w-3" />
                <span>{t("tour.bannerBadge")}</span>
              </span>
              <span className="text-[11px] font-bold text-amber-300">
                {t("tour.bannerFreeTag")}
              </span>
            </div>
            <h4 className="font-display text-base font-bold text-white">
              {t("tour.bannerTitle")}
            </h4>
            <p className="text-xs text-[#CFCBE2]/80 max-w-xl">
              {t("tour.bannerDesc")}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleClaim}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 font-display text-xs font-bold text-white shadow-lg transition-transform hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <Gift className="h-4 w-4" />
            <span>{t("tour.bannerCtaClaim")}</span>
          </button>

          <button
            type="button"
            onClick={handleStartTour}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 font-display text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FFBD70]" />
            <span>{t("tour.bannerCtaTour")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
