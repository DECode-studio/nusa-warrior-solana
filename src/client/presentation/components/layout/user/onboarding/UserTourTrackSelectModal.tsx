"use client";

import React from "react";
import {
  Compass,
  GraduationCap,
  Layers,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  Swords,
} from "lucide-react";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { BaseModal } from "@/client/presentation/components/ui";
import {
  TourTrackId,
  useUserOnboardingStore,
} from "@/client/presentation/stores/onboardingStore";
import { TOUR_TRACKS_REGISTRY } from "./tourStepsRegistry";

export function UserTourTrackSelectModal(): React.ReactElement | null {
  const { t } = useTranslator();
  const {
    trackSelectModalOpen,
    closeTrackSelectModal,
    startTourTrack,
    completedTrackIds,
    resetAllTours,
  } = useUserOnboardingStore();

  const tracks = Object.values(TOUR_TRACKS_REGISTRY);

  const handleSelectTrack = (trackId: TourTrackId) => {
    gamelanAudio.playCardSelect();
    closeTrackSelectModal();
    startTourTrack(trackId);
  };

  const handleReset = () => {
    gamelanAudio.playCardSelect();
    closeTrackSelectModal();
    resetAllTours();
  };

  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="h-5 w-5 text-[#FFBD70]" />;
      case "LayoutDashboard":
        return <LayoutDashboard className="h-5 w-5 text-[#6766FF]" />;
      case "GraduationCap":
        return <GraduationCap className="h-5 w-5 text-amber-400" />;
      case "Layers":
        return <Layers className="h-5 w-5 text-emerald-400" />;
      default:
        return <Swords className="h-5 w-5 text-[#FFBD70]" />;
    }
  };

  return (
    <BaseModal
      id="user-tour-track-select-modal"
      isOpen={trackSelectModalOpen}
      onClose={closeTrackSelectModal}
      size="lg"
      mobileBehavior="bottomsheet"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FFBD70]/30 bg-[#FFBD70]/10 text-[#FFBD70]">
            <Compass className="h-5 w-5" />
          </div>
          <span>{t("tour.selectModalTitle")}</span>
        </div>
      }
      description={t("tour.selectModalSubtitle")}
      footer={
        <div className="flex w-full items-center justify-between text-xs text-white/50">
          <span>{t("tour.resetHint")}</span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t("tour.actionResetAll")}</span>
          </button>
        </div>
      }
    >
      {/* Tracks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {tracks.map((track) => {
          const isCompleted = completedTrackIds.includes(track.id);

          return (
            <div
              key={track.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 transition-all duration-300 hover:border-[#FFBD70]/50 hover:bg-white/[0.06]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    {getTrackIcon(track.iconName)}
                  </div>
                  {isCompleted ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {t("tour.completedBadge")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#FFBD70]/15 px-2 py-0.5 text-[10px] font-semibold text-[#FFBD70]">
                      {track.steps.length} {t("tour.stepsLabel")}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-display text-sm font-bold text-white group-hover:text-[#FFBD70] transition-colors">
                    {t(track.titleKey)}
                  </h4>
                  <p className="mt-1 text-xs text-[#CFCBE2]/80 leading-relaxed">
                    {t(track.descKey)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleSelectTrack(track.id)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#6766FF] hover:text-white cursor-pointer"
                >
                  <span>
                    {isCompleted
                      ? t("tour.actionReplayTrack")
                      : t("tour.actionStartTrack")}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </BaseModal>
  );
}
