"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Gift, Sparkles } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { BaseModal } from "@/client/presentation/components/ui";
import { useUserOnboardingStore } from "@/client/presentation/stores/onboardingStore";

export function UserUnclaimedPackModal(): React.ReactElement | null {
  const router = useRouter();
  const { locale, t } = useTranslator();
  const {
    unclaimedPackModalOpen,
    closeUnclaimedPackModal,
    hasClaimedFreePack,
    isInitialized,
    startTourTrack,
  } = useUserOnboardingStore();

  if (!isInitialized || hasClaimedFreePack) return null;

  const handleClaimNow = () => {
    gamelanAudio.playGamelanChord();
    closeUnclaimedPackModal();
    // Navigate to shop and start the guide step directly at the shop
    router.push(ROUTES.USER_SHOP(locale));
    startTourTrack("new-warrior-journey");
  };

  const handleDismiss = () => {
    gamelanAudio.playCardSelect();
    closeUnclaimedPackModal();
  };

  return (
    <BaseModal
      id="user-unclaimed-pack-modal"
      isOpen={unclaimedPackModalOpen && !hasClaimedFreePack}
      onClose={handleDismiss}
      size="md"
      mobileBehavior="bottomsheet"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300">
            <Gift className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>{t("tour.unclaimedBadge")}</span>
            </div>
            <span className="font-display text-base sm:text-lg font-bold text-white">
              {t("tour.unclaimedTitle")}
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Body Notice */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center gap-3.5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-amber-400/30 bg-black/40 shadow-md">
              <Image
                src="/assets/pack/pack-starter.png"
                alt="Starter Pack Gratis"
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="font-display text-sm font-bold text-white">
                Starter Pack Perdana (20 Kartu)
              </div>
              <p className="text-xs text-[#CFCBE2]/80 leading-relaxed">
                {t("tour.unclaimedDesc")}
              </p>
              <div className="text-xs font-bold text-emerald-400">
                GRATIS (Rp 0) · Khusus Ksatria Baru
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/60 leading-relaxed">
          {t("tour.unclaimedHint")}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleClaimNow}
            className="w-full sm:flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 font-display text-xs sm:text-sm font-bold text-white shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all hover:brightness-110 active:scale-98 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{t("tour.unclaimedCtaClaim")}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto h-12 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {t("tour.unclaimedCtaLater")}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
