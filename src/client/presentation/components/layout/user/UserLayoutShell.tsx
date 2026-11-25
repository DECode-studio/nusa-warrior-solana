"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN, DECK_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { USER_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { USER_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { UserHeader } from "./UserHeader";
import { UserMobileDrawer } from "./UserMobileDrawer";
import { UserSidebar } from "./UserSidebar";
import { SessionHeartbeat } from "@/client/presentation/components/SessionHeartbeat";
import {
  UserCoachMarkTour,
  UserTourTrackSelectModal,
  UserUnclaimedPackModal,
  UserWelcomeTourModal,
} from "./onboarding";
import { useUserOnboardingStore } from "../../../stores/onboardingStore";

export interface UserLayoutShellProps {
  readonly children: React.ReactNode;
}

export function UserLayoutShell({
  children,
}: UserLayoutShellProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useTranslator();

  const isInBattleView =
    (pathname?.includes("/battle") || pathname?.includes("/leagues")) ?? false;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [savedDecksCount, setSavedDecksCount] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const fetchUserConsoleSummary = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const deckUseCase = getService(DECK_USECASE_TOKEN);
      const [me, decks] = await Promise.all([
        authUseCase.getCurrentUser(),
        deckUseCase.getDecks(),
      ]);
      if (me) {
        setUserName(me.name ?? null);
        setUserWalletAddress(me.walletAddress ?? null);
        setUserPoints(me.nusaPoints ?? 0);
        setAvatarUrl(me.avatarUrl ?? null);
      }
      setSavedDecksCount(decks.filter((deck) => !deck.isPreset && !deck.isTemporary).length);

      // Initialize onboarding guidance state directly from user account properties (server-driven)
      const userHasClaimed = Boolean(me?.hasClaimedStarterPack);
      useUserOnboardingStore.getState().initialize(userHasClaimed);
    } catch {
      // Keep fallback state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUserConsoleSummary();
  }, [fetchUserConsoleSummary]);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      await authUseCase.logout();
      router.push(ROUTES.USER_LOGIN(locale));
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const { openTrackSelectModal } = useUserOnboardingStore();

  return (
    <div
      id={USER_LAYOUT_SEMANTIC_IDS.ROOT}
      className="relative min-h-screen bg-[#080220] text-white"
    >
      <SessionHeartbeat />

      {/* Onboarding Tour Overlay & Guidance Modals */}
      <UserCoachMarkTour />
      {!isInBattleView && (
        <>
          <UserWelcomeTourModal userName={userName} />
          <UserUnclaimedPackModal />
        </>
      )}
      <UserTourTrackSelectModal />

      {/* Fixed Left Rounded Desktop Sidebar */}
      <UserSidebar
        savedDecksCount={savedDecksCount}
        userName={userName ?? t(USER_LAYOUT_TEXT_CONSTANT.DEFAULT_WARRIOR_NAME)}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        onOpenTourModal={openTrackSelectModal}
      />

      {/* Mobile Slide-Over Drawer */}
      <UserMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        savedDecksCount={savedDecksCount}
        userName={userName ?? t(USER_LAYOUT_TEXT_CONSTANT.DEFAULT_WARRIOR_NAME)}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        onOpenTourModal={openTrackSelectModal}
      />

      {/* Main Content Area offset by fixed sidebar width */}
      <div className="flex flex-1 flex-col min-w-0 md:pl-72 lg:pl-80 transition-all">
        {/* Floating Rounded Navbar (Fixed Top) */}
        <UserHeader
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          isLoading={isLoading}
          onRefresh={() => void fetchUserConsoleSummary()}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          userName={userName}
          userWalletAddress={userWalletAddress}
          userPoints={userPoints}
          avatarUrl={avatarUrl}
          onOpenTourModal={openTrackSelectModal}
        />

        {/* Inner Page View with top padding to clear fixed navbar */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

