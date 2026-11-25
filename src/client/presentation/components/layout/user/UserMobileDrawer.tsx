"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Compass,
  Globe,
  Link2,
  LogOut,
  Music,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { APP_CONFIG } from "@/core/constants/app-config";
import { ROUTES } from "@/core/constants/routes";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { USER_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { UserNavigation } from "./UserNavigation";
import { UserAccountStatus } from "./UserAccountStatus";
import { useUserLocaleSwitch } from "./hooks/useUserLocaleSwitch";

export interface UserMobileDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly savedDecksCount: number | null;
  readonly userName: string;
  readonly isGuest?: boolean;
  readonly isLoggingOut: boolean;
  readonly onLogout: () => Promise<void>;
  readonly onOpenTourModal?: () => void;
}

export function UserMobileDrawer({
  isOpen,
  onClose,
  savedDecksCount,
  userName,
  isGuest,
  isLoggingOut,
  onLogout,
  onOpenTourModal,
}: UserMobileDrawerProps): React.ReactElement | null {
  const pathname = usePathname();
  const { locale, t } = useTranslator();
  const cycleLocale = useUserLocaleSwitch();

  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prefs = gamelanAudio.getPreferences();
    setSfxEnabled(prefs.sfxEnabled);
    setMusicEnabled(prefs.musicEnabled);
  }, [isOpen]);

  const handleToggleSfx = (): void => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    gamelanAudio.setPreferences({ sfxEnabled: next });
    if (next) {
      gamelanAudio.playCardSelect();
    }
  };

  const handleToggleMusic = (): void => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    gamelanAudio.setPreferences({ musicEnabled: next });
    if (next) {
      gamelanAudio.playGamelanChord();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const onLogoutClick = async (): Promise<void> => {
    onClose();
    await onLogout();
  };

  return (
    <div
      id={USER_LAYOUT_SEMANTIC_IDS.MOBILE_DRAWER}
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t(USER_LAYOUT_TEXT_CONSTANT.MOBILE_NAV_ARIA)}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#07011F] border-r border-white/10 shadow-2xl flex flex-col justify-between p-5 overflow-y-auto z-10">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <Link
              href={ROUTES.USER_DASHBOARD(locale)}
              onClick={onClose}
              className="flex items-center gap-2.5"
            >
              <Image
                src={APP_CONFIG.logos.transparent}
                alt={APP_CONFIG.brandName}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                unoptimized
              />
              <span className="font-display text-lg font-bold text-white">
                {APP_CONFIG.brandName}
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label={t(USER_LAYOUT_TEXT_CONSTANT.MOBILE_CLOSE_ARIA)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Top Up Shortcut in Mobile Drawer */}
          <Link
            href={`${ROUTES.USER_SHOP(locale)}?tab=topup`}
            onClick={onClose}
            className="mt-3 flex items-center justify-between rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-[#FF9F31]/10 to-amber-500/5 px-3.5 py-2.5 transition-all hover:border-amber-400/60 hover:bg-amber-500/20 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 group-hover:scale-105 transition-transform">
                <Coins className="h-4 w-4" />
              </div>
              <span className="font-display text-sm font-bold text-cream group-hover:text-amber-light">
                Top Up Nusa Point
              </span>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-display text-[10px] font-bold text-amber-300">
              FEE 500
            </span>
          </Link>

          <UserNavigation
            pathname={pathname}
            locale={locale}
            savedDecksCount={savedDecksCount}
            onNavigate={onClose}
            variant="drawer"
          />
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
          {/* SFX & Gamelan Music Audio Control Bar */}
          <div className="flex items-center justify-between rounded-[40px] border border-white/10 bg-white/[0.03] px-3.5 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F8F5F0]/80">
              <Volume2 className="h-4 w-4 text-[#FF9F31]" />
              <span>Audio & Suara</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSfx}
                aria-label={t(USER_LAYOUT_TEXT_CONSTANT.TOGGLE_SFX_ARIA)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all cursor-pointer ${
                  sfxEnabled
                    ? "border-[#FF9F31]/60 bg-[#FF9F31]/20 text-[#FF9F31]"
                    : "border-white/15 bg-white/5 text-white/50"
                }`}
                title="Toggle SFX"
              >
                {sfxEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleMusic}
                aria-label={t(USER_LAYOUT_TEXT_CONSTANT.TOGGLE_MUSIC_ARIA)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all cursor-pointer ${
                  musicEnabled
                    ? "border-[#0DB561]/60 bg-[#0DB561]/20 text-[#0DB561]"
                    : "border-white/15 bg-white/5 text-white/50"
                }`}
                title="Toggle Gamelan Music"
              >
                <Music className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {onOpenTourModal && (
            <button
              id="user-drawer-tour-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenTourModal();
              }}
              className="flex items-center justify-between w-full rounded-[40px] border border-[#FFBD70]/30 bg-[#FFBD70]/10 px-3.5 py-2.5 text-xs font-semibold text-[#FFBD70]"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#FFBD70]" />
                <span>{t("tour.sidebarBtnLabel")}</span>
              </div>
              <Sparkles className="h-3.5 w-3.5 text-[#FFBD70]" />
            </button>
          )}

          <button
            id={USER_LAYOUT_SEMANTIC_IDS.LOCALE_SWITCH_BTN}
            type="button"
            onClick={cycleLocale}
            className="flex items-center justify-between w-full rounded-[40px] border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-[#F8F5F0]/80"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#6766FF]" />
              <span>{t(USER_LAYOUT_TEXT_CONSTANT.LANGUAGE_SWITCH)}</span>
            </div>
            <span className="font-display font-bold text-[#6766FF]">
              {locale.toUpperCase()}
            </span>
          </button>

          <button
            id={USER_LAYOUT_SEMANTIC_IDS.LOGOUT_BTN}
            type="button"
            onClick={() => void onLogoutClick()}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-[40px] border border-[#FF9F31]/30 bg-[#FF9F31]/10 px-3.5 py-2 text-xs font-semibold text-[#FF9F31] hover:bg-[#FF9F31]/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-[#FF9F31]" />
            <span>
              {isLoggingOut
                ? t(USER_LAYOUT_TEXT_CONSTANT.LOGGING_OUT)
                : t(USER_LAYOUT_TEXT_CONSTANT.LOGOUT)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

