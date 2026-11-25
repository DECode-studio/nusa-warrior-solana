"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Coins,
  Compass,
  Link2,
  LogOut,
  Menu,
  Music,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ROUTES, USER_NAV_ITEMS } from "@/core/constants/routes";
import { API_ROUTES } from "@/core/constants/api-routes";
import { isPanelNavItemActive } from "@/core/utils/panel-navigation";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { USER_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";

export interface UserHeaderProps {
  readonly onOpenMobileDrawer: () => void;
  readonly isLoading: boolean;
  readonly onRefresh: () => void;
  readonly isLoggingOut: boolean;
  readonly onLogout: () => Promise<void>;
  readonly onOpenTourModal?: () => void;
  readonly userName?: string | null;
  readonly userWalletAddress?: string | null;
  readonly userPoints?: number;
  readonly avatarUrl?: string | null;
}

function getInitials(name?: string | null, walletAddress?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (walletAddress?.trim()) {
    return walletAddress.trim().slice(0, 2).toUpperCase();
  }
  return "NW";
}

function shortenWallet(address?: string | null): string {
  if (!address) return "Solana Devnet";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function UserHeader({
  onOpenMobileDrawer,
  isLoading,
  onRefresh,
  isLoggingOut,
  onLogout,
  onOpenTourModal,
  userName,
  userWalletAddress,
  userPoints = 0,
  avatarUrl,
}: UserHeaderProps): React.ReactElement {
  const pathname = usePathname();
  const { locale, t } = useTranslator();
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefs = gamelanAudio.getPreferences();
    setSfxEnabled(prefs.sfxEnabled);
    setMusicEnabled(prefs.musicEnabled);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

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

  const currentItem = USER_NAV_ITEMS.find((item) =>
    isPanelNavItemActive(pathname, item, locale)
  );
  const currentLabel = pathname?.includes("/leagues")
    ? t("league.title")
    : t(currentItem?.labelKey ?? "userPanel.dashboardTitle");

  const displayName = userName ?? t(USER_LAYOUT_TEXT_CONSTANT.DEFAULT_WARRIOR_NAME);
  const initials = getInitials(userName, userWalletAddress);

  return (
    <header
      id={USER_LAYOUT_SEMANTIC_IDS.HEADER}
      className="fixed top-0 left-0 right-0 md:left-72 lg:left-80 z-30 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300"
    >
      <div className="max-w-[1400px] w-full mx-auto pointer-events-auto">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4 rounded-[40px] border border-white/10 bg-[#07011F]/90 backdrop-blur-xl px-3.5 sm:px-7 py-2 sm:py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          {/* Left Side: Mobile Hamburger & Page Title / Breadcrumbs */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileDrawer}
              aria-label={t(USER_LAYOUT_TEXT_CONSTANT.MOBILE_NAV_ARIA)}
              className="inline-flex h-9 w-9 shrink-0 md:hidden items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-[#F8F5F0]/60 leading-tight">
                <Link
                  href={ROUTES.USER_DASHBOARD(locale)}
                  className="hover:text-white transition-colors truncate max-w-[85px] sm:max-w-none"
                >
                  Warrior Console
                </Link>
                <span>/</span>
                <span className="text-[#6766FF] font-semibold truncate max-w-[100px] sm:max-w-none">
                  {currentLabel}
                </span>
              </div>
              <h1 className="font-display text-base sm:text-xl font-bold text-white leading-tight truncate">
                {currentLabel}
              </h1>
            </div>
          </div>

          {/* Right Side: Quick Action Pills & User Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Data */}
            <button
              type="button"
              onClick={onRefresh}
              aria-label={t(USER_LAYOUT_TEXT_CONSTANT.REFRESH_ARIA)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-base bg-surface-elevated text-cream hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoading ? "animate-spin text-primary" : ""
                }`}
              />
            </button>

            {/* User Avatar with Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                id={USER_LAYOUT_SEMANTIC_IDS.AVATAR_BTN}
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Menu Profil Pengguna"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                className="group flex items-center gap-2 rounded-full border border-border-base bg-surface-elevated p-1 pr-2 sm:pr-3 text-left transition-colors hover:border-border-strong hover:bg-surface-muted cursor-pointer focus:outline-hidden"
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-tr from-[#5856F2] to-[#8860FF] text-white shadow-[0_0_12px_rgba(103,102,255,0.35)]">
                  {avatarUrl && !avatarLoadError ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarLoadError(true)}
                    />
                  ) : (
                    <span className="font-display text-[11px] font-bold tracking-wider">
                      {initials}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[#0DB561] ring-1 ring-[#07011F]" />
                </div>

                <div className="hidden sm:flex flex-col min-w-0 max-w-[95px] lg:max-w-[125px]">
                  <span className="truncate font-display text-xs font-bold text-white leading-tight">
                    {displayName}
                  </span>
                  <span className="truncate text-[10px] text-amber-300 font-semibold leading-tight">
                    {userPoints.toLocaleString("id-ID")} Poin
                  </span>
                </div>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/60 transition-transform duration-200 group-hover:text-white ${
                    isMenuOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* Avatar Dropdown Menu */}
              {isMenuOpen && (
                <div
                  id={USER_LAYOUT_SEMANTIC_IDS.AVATAR_DROPDOWN}
                  className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 rounded-2xl border border-white/15 bg-[#0B0527]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* 1. Nama & Email User */}
                  <div className="flex items-center gap-3 pb-3.5 border-b border-white/10">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[rgba(103,102,255,0.4)] bg-gradient-to-tr from-[#5856F2]/40 to-[#6766FF]/30 text-white shadow-[0_0_16px_rgba(103,102,255,0.25)]">
                      {avatarUrl && !avatarLoadError ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                          onError={() => setAvatarLoadError(true)}
                        />
                      ) : (
                        <span className="font-display text-sm font-bold tracking-wider">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold text-white">
                        {displayName}
                      </p>
                      <p className="truncate font-mono text-xs text-[#CFCBE2]/75">
                        {shortenWallet(userWalletAddress)}
                      </p>
                    </div>
                  </div>

                  {/* 2. User Point */}
                  <div className="mt-3 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-[#FF9F31]/10 to-amber-500/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300">
                          <Coins className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
                            Nusa Point
                          </span>
                          <span className="font-display text-base font-extrabold text-white">
                            {userPoints.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-display text-[10px] font-bold text-amber-300">
                          POIN
                        </span>
                        <Link
                          href={`${ROUTES.USER_SHOP(locale)}?tab=topup`}
                          onClick={() => setIsMenuOpen(false)}
                          className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-2.5 py-0.5 font-display text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,159,49,0.3)] transition-all"
                        >
                          + Top Up
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* 3. Audio Toggles: Sound Toggle & Music Toggle */}
                  <div className="mt-3 flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1.5">
                    {/* Sound Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleSfx}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/5 cursor-pointer"
                      aria-pressed={sfxEnabled}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            sfxEnabled
                              ? "border border-[#FF9F31]/50 bg-[#FF9F31]/20 text-[#FF9F31]"
                              : "border border-white/10 bg-white/5 text-white/40"
                          }`}
                        >
                          {sfxEnabled ? (
                            <Volume2 className="h-3.5 w-3.5" />
                          ) : (
                            <VolumeX className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-white/90">
                          Efek Suara
                        </span>
                      </div>
                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                          sfxEnabled ? "bg-[#FF9F31]" : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 my-0.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            sfxEnabled ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Music Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleMusic}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/5 cursor-pointer"
                      aria-pressed={musicEnabled}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            musicEnabled
                              ? "border border-[#0DB561]/50 bg-[#0DB561]/20 text-[#0DB561]"
                              : "border border-white/10 bg-white/5 text-white/40"
                          }`}
                        >
                          <Music className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-white/90">
                          Musik Gamelan
                        </span>
                      </div>
                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                          musicEnabled ? "bg-[#0DB561]" : "bg-white/20"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 my-0.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            musicEnabled ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  </div>

                  {/* 4. Tour Guide CTA */}
                  {onOpenTourModal && (
                    <div className="mt-2">
                      <button
                        id="user-header-tour-btn"
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenTourModal();
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-[#FFBD70] transition-colors hover:bg-[#FFBD70]/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFBD70]/20 text-[#FFBD70]">
                            <Compass className="h-3.5 w-3.5" />
                          </div>
                          <span>{t("tour.headerBtnLabel")}</span>
                        </div>
                        <Sparkles className="h-3.5 w-3.5 text-[#FFBD70]" />
                      </button>
                    </div>
                  )}

                  {/* 5. Sign Out Button */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <button
                      id={USER_LAYOUT_SEMANTIC_IDS.LOGOUT_BTN}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void onLogout();
                      }}
                      disabled={isLoggingOut}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-400" />
                      <span>
                        {isLoggingOut
                          ? t(USER_LAYOUT_TEXT_CONSTANT.LOGGING_OUT)
                          : t(USER_LAYOUT_TEXT_CONSTANT.LOGOUT)}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
