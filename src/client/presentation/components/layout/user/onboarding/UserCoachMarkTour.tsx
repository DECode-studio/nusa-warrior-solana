"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { useUserOnboardingStore } from "@/client/presentation/stores/onboardingStore";
import { TOUR_TRACKS_REGISTRY, TourStepDefinition } from "./tourStepsRegistry";

type RectLayout = {
  rect: DOMRect;
  tooltipTop: number;
  tooltipLeft: number;
  tooltipWidth: number;
  tooltipPlacement: "top" | "bottom";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const tooltipWidthFor = (viewportWidth: number) =>
  clamp(Math.round(viewportWidth * 0.38), 320, 440);

const tooltipHeightEstimate = 220;

const SpotlightFrame: React.FC<{ rect: DOMRect }> = ({ rect }) => (
  <>
    {/* Soft glowing ambient background pulse */}
    <div
      aria-hidden="true"
      className="fixed z-[9997] rounded-2xl pointer-events-none mix-blend-screen"
      style={{
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        boxShadow:
          "0 0 25px 6px rgba(255, 189, 112, 0.45), 0 0 50px 12px rgba(103, 102, 255, 0.3)",
        animation: "nusa-spotlight-glow 2.5s infinite ease-in-out",
        transition:
          "top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    />

    {/* SVG Animated Border */}
    <svg aria-hidden="true" className="fixed inset-0 z-[10000] pointer-events-none">
      <defs>
        <linearGradient id="nusa-spotlight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFBD70" />
          <stop offset="50%" stopColor="#6766FF" />
          <stop offset="100%" stopColor="#0DB561" />
        </linearGradient>
      </defs>
      {/* Outer blur glow */}
      <rect
        x={rect.left - 3}
        y={rect.top - 3}
        width={rect.width + 6}
        height={rect.height + 6}
        rx="16"
        ry="16"
        fill="none"
        stroke="url(#nusa-spotlight-grad)"
        strokeWidth="4"
        opacity="0.5"
        style={{
          filter: "blur(2px)",
          transition:
            "x 0.4s cubic-bezier(0.16, 1, 0.3, 1), y 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {/* Crawling dashed border */}
      <rect
        x={rect.left - 3}
        y={rect.top - 3}
        width={rect.width + 6}
        height={rect.height + 6}
        rx="16"
        ry="16"
        fill="none"
        stroke="url(#nusa-spotlight-grad)"
        strokeWidth="2.5"
        style={{
          strokeDasharray: "20 8",
          animation: "nusa-spotlight-dash 20s infinite linear",
          transition:
            "x 0.4s cubic-bezier(0.16, 1, 0.3, 1), y 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </svg>

    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes nusa-spotlight-glow {
        0%, 100% { opacity: 0.4; transform: scale(0.99); }
        50% { opacity: 0.8; transform: scale(1.01); }
      }
      @keyframes nusa-spotlight-dash {
        to { stroke-dashoffset: -1000; }
      }
    `,
      }}
    />
  </>
);

const BackdropSlice: React.FC<{
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  width?: number | string;
  height?: number | string;
  onBlock?: () => void;
}> = ({ top, left, right, bottom, width, height, onBlock }) => (
  <div
    className="fixed z-[9996] bg-[#07011F]/80 backdrop-blur-xs pointer-events-auto transition-all duration-300"
    style={{ top, left, right, bottom, width, height }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onBlock?.();
    }}
  />
);

export function UserCoachMarkTour(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useTranslator();

  const {
    tourActive,
    activeTrackId,
    activeTrackStepIndex,
    setTrackStepIndex,
    completeStep,
    completeTrack,
    stopTour,
  } = useUserOnboardingStore();

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<RectLayout | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const elevatedTargetRef = useRef<{
    element: HTMLElement;
    position: string;
    zIndex: string;
    pointerEvents: string;
    isolation: string;
  } | null>(null);

  const currentTrack = activeTrackId ? TOUR_TRACKS_REGISTRY[activeTrackId] : null;
  const steps: TourStepDefinition[] = useMemo(
    () => currentTrack?.steps ?? [],
    [currentTrack]
  );
  const currentStep = steps[activeTrackStepIndex] as TourStepDefinition | undefined;

  useEffect(() => {
    const updateViewport = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Auto-route if currentStep specifies a targetPath that differs from pathname
  useEffect(() => {
    if (!tourActive || !currentStep || !currentStep.targetPath) return;
    const requiredPath = currentStep.targetPath(locale);
    if (pathname && !pathname.endsWith(requiredPath) && pathname !== requiredPath) {
      router.push(requiredPath);
    }
  }, [currentStep, locale, pathname, router, tourActive]);

  // Dynamic positioning calculation
  useEffect(() => {
    if (!tourActive || !currentStep) {
      setLayout(null);
      return;
    }

    const update = () => {
      const element = document.querySelector<HTMLElement>(currentStep.target);
      if (!element) {
        setLayout(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const tooltipWidth = tooltipWidthFor(viewport.width || window.innerWidth);
      const centerX = rect.left + rect.width / 2;
      const placement = rect.top > (viewport.height || window.innerHeight) * 0.55 ? "top" : "bottom";
      const estimatedY =
        placement === "bottom"
          ? rect.bottom + 18
          : rect.top - tooltipHeightEstimate - 18;

      const top = clamp(
        estimatedY,
        16,
        Math.max(16, (viewport.height || window.innerHeight) - tooltipHeightEstimate - 16)
      );
      const left = clamp(
        centerX - tooltipWidth / 2,
        16,
        Math.max(16, (viewport.width || window.innerWidth) - tooltipWidth - 16)
      );

      setLayout({
        rect,
        tooltipTop: top,
        tooltipLeft: left,
        tooltipWidth,
        tooltipPlacement: placement,
      });
    };

    update();
    const interval = window.setInterval(update, 120);
    const onResize = () => update();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [currentStep, tourActive, viewport.height, viewport.width]);

  // Smooth scroll into view
  useEffect(() => {
    if (!currentStep || !layout) return;
    const el = document.querySelector<HTMLElement>(currentStep.target);
    if (!el) return;

    const inView =
      layout.rect.top >= 64 &&
      layout.rect.bottom <= (viewport.height || window.innerHeight) - 64;
    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [currentStep, layout, viewport.height]);

  // Elevate target element above backdrop
  useEffect(() => {
    const targetElement = currentStep
      ? document.querySelector<HTMLElement>(currentStep.target)
      : null;

    if (!targetElement) {
      if (elevatedTargetRef.current) {
        const prev = elevatedTargetRef.current;
        prev.element.style.position = prev.position;
        prev.element.style.zIndex = prev.zIndex;
        prev.element.style.pointerEvents = prev.pointerEvents;
        prev.element.style.isolation = prev.isolation;
        elevatedTargetRef.current = null;
      }
      return;
    }

    if (elevatedTargetRef.current?.element === targetElement) return;

    if (elevatedTargetRef.current) {
      const prev = elevatedTargetRef.current;
      prev.element.style.position = prev.position;
      prev.element.style.zIndex = prev.zIndex;
      prev.element.style.pointerEvents = prev.pointerEvents;
      prev.element.style.isolation = prev.isolation;
    }

    elevatedTargetRef.current = {
      element: targetElement,
      position: targetElement.style.position,
      zIndex: targetElement.style.zIndex,
      pointerEvents: targetElement.style.pointerEvents,
      isolation: targetElement.style.isolation,
    };

    targetElement.style.position = "relative";
    targetElement.style.zIndex = "10002";
    targetElement.style.pointerEvents = "auto";
    targetElement.style.isolation = "isolate";

    return () => {
      if (!elevatedTargetRef.current || elevatedTargetRef.current.element !== targetElement)
        return;
      targetElement.style.position = elevatedTargetRef.current.position;
      targetElement.style.zIndex = elevatedTargetRef.current.zIndex;
      targetElement.style.pointerEvents = elevatedTargetRef.current.pointerEvents;
      targetElement.style.isolation = elevatedTargetRef.current.isolation;
      elevatedTargetRef.current = null;
    };
  }, [currentStep]);

  if (
    !tourActive ||
    !currentTrack ||
    steps.length === 0 ||
    !currentStep ||
    !layout ||
    viewport.width === 0 ||
    viewport.height === 0 ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const isLastStep = activeTrackStepIndex >= steps.length - 1;
  const isFirstStep = activeTrackStepIndex === 0;

  const handleNext = () => {
    gamelanAudio.playCardSelect();
    completeStep(currentStep.id);

    if (isLastStep) {
      if (activeTrackId) {
        completeTrack(activeTrackId);
      }
      return;
    }
    setTrackStepIndex(activeTrackStepIndex + 1);
  };

  const handlePrev = () => {
    gamelanAudio.playCardSelect();
    setTrackStepIndex(Math.max(0, activeTrackStepIndex - 1));
  };

  const rect = layout.rect;
  const arrowLeft = clamp(
    rect.left + rect.width / 2 - layout.tooltipLeft,
    24,
    layout.tooltipWidth - 24
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* 4 Backdrop Slices */}
      <BackdropSlice top={0} left={0} right={0} height={Math.max(0, rect.top)} />
      <BackdropSlice
        top={Math.max(0, rect.top)}
        left={0}
        width={Math.max(0, rect.left)}
        height={Math.max(0, rect.height)}
      />
      <BackdropSlice
        top={Math.max(0, rect.top)}
        left={Math.max(0, rect.right)}
        right={0}
        height={Math.max(0, rect.height)}
      />
      <BackdropSlice
        top={Math.max(0, rect.bottom)}
        left={0}
        right={0}
        bottom={0}
      />

      {/* Animated Glowing Spotlight */}
      <SpotlightFrame rect={rect} />

      {/* Rigid Tooltip Card */}
      <div
        className="fixed z-[10001] pointer-events-auto"
        style={{
          top: layout.tooltipTop,
          left: layout.tooltipLeft,
          width: layout.tooltipWidth,
          transition:
            "top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        ref={tooltipRef}
      >
        <div className="rounded-2xl border border-[#FFBD70]/40 bg-[#07011F]/95 p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          {/* Header Track Indicator & Close */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFBD70]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FFBD70]">
                <Sparkles className="h-3 w-3" />
                <span>{t(currentTrack.titleKey)}</span>
              </span>
              <span className="font-mono text-xs text-white/50">
                {activeTrackStepIndex + 1}/{steps.length}
              </span>
            </div>
            <button
              type="button"
              onClick={stopTour}
              className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={t("tour.closeBtn")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title & Content */}
          <div className="mt-3 space-y-1.5">
            <h4 className="font-display text-base font-bold text-white">
              {t(currentStep.titleKey)}
            </h4>
            <p className="text-xs leading-relaxed text-[#CFCBE2]/90">
              {t(currentStep.contentKey)}
            </p>
          </div>

          {/* Step Progress Ticks */}
          <div className="mt-4 flex items-center gap-1.5">
            {steps.map((st, idx) => (
              <span
                key={st.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx < activeTrackStepIndex
                    ? "bg-[#0DB561]"
                    : idx === activeTrackStepIndex
                      ? "bg-[#FFBD70] ring-2 ring-[#FFBD70]/40"
                      : "bg-white/15"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={stopTour}
              className="text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              {t("tour.skipBtn")}
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{t("tour.prevBtn")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className={`inline-flex items-center gap-1 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-transform active:scale-95 cursor-pointer ${
                  isLastStep
                    ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400"
                    : "bg-gradient-to-r from-[#6766FF] to-[#8C62FF] hover:from-[#7877FF] hover:to-[#9D76FF]"
                }`}
              >
                <span>{isLastStep ? t("tour.finishBtn") : t("tour.nextBtn")}</span>
                {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tooltip Triangle Arrow */}
        <div
          aria-hidden="true"
          className={`absolute border-l-8 border-r-8 border-transparent ${
            layout.tooltipPlacement === "bottom"
              ? "-top-2 border-b-8 border-b-[#07011F]"
              : "-bottom-2 border-t-8 border-t-[#07011F]"
          }`}
          style={{
            left: arrowLeft,
            transform: "translateX(-50%)",
            transition: "left 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>,
    document.body
  );
}
