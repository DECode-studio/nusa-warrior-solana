"use client";

import { create } from "zustand";

export type TourTrackId =
  | "new-warrior-journey"
  | "console-menus"
  | "battle-academy"
  | "deck-strategy";

export const ONBOARDING_STORAGE_KEY = "nusa_warriors_onboarding_v2";

export interface StoredOnboardingState {
  completedTrackIds: string[];
  completedStepIds: string[];
  welcomeDismissed: boolean;
}

interface UserOnboardingState {
  // Tour overlay state
  tourActive: boolean;
  activeTrackId: TourTrackId | null;
  activeTrackStepIndex: number;
  completedTrackIds: string[];
  completedStepIds: string[];
  isInitialized: boolean;

  // Modals & Account claim status
  welcomeModalOpen: boolean;
  unclaimedPackModalOpen: boolean;
  trackSelectModalOpen: boolean;
  hasClaimedFreePack: boolean;

  // Actions
  initialize: (hasClaimedFreePackFromUser: boolean) => void;
  startTourTrack: (trackId: TourTrackId) => void;
  setTrackStepIndex: (index: number) => void;
  completeStep: (stepId: string) => void;
  completeTrack: (trackId: TourTrackId) => void;
  stopTour: () => void;
  resetAllTours: () => void;

  // Modal triggers
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
  openUnclaimedPackModal: () => void;
  closeUnclaimedPackModal: () => void;
  openTrackSelectModal: () => void;
  closeTrackSelectModal: () => void;
  setClaimedFreePack: (claimed: boolean) => void;
}

const readStoredState = (): StoredOnboardingState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOnboardingState & { hasClaimedFreePack?: boolean }>;
    // Clean legacy local-storage claim flag if present
    if ("hasClaimedFreePack" in parsed) {
      delete parsed.hasClaimedFreePack;
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(parsed));
    }
    return {
      completedTrackIds: Array.isArray(parsed.completedTrackIds)
        ? parsed.completedTrackIds
        : [],
      completedStepIds: Array.isArray(parsed.completedStepIds)
        ? parsed.completedStepIds
        : [],
      welcomeDismissed: Boolean(parsed.welcomeDismissed),
    };
  } catch {
    return null;
  }
};

const persistState = (state: StoredOnboardingState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors in private browsing modes
  }
};

export const useUserOnboardingStore = create<UserOnboardingState>((set, get) => ({
  tourActive: false,
  activeTrackId: null,
  activeTrackStepIndex: 0,
  completedTrackIds: [],
  completedStepIds: [],
  isInitialized: false,

  welcomeModalOpen: false,
  unclaimedPackModalOpen: false,
  trackSelectModalOpen: false,
  hasClaimedFreePack: false,

  initialize: (hasClaimedFreePackFromUser: boolean) => {
    const stored = readStoredState();
    const hasClaimed = Boolean(hasClaimedFreePackFromUser);

    if (stored) {
      set({
        completedTrackIds: stored.completedTrackIds,
        completedStepIds: stored.completedStepIds,
        hasClaimedFreePack: hasClaimed,
        isInitialized: true,
        // If user hasn't dismissed welcome modal yet, open it
        welcomeModalOpen: !stored.welcomeDismissed,
        // If user already dismissed welcome modal, but has NOT claimed free pack, show unclaimed modal
        unclaimedPackModalOpen: stored.welcomeDismissed && !hasClaimed,
      });
      return;
    }

    // First time user: show welcome modal
    const initialStored: StoredOnboardingState = {
      completedTrackIds: [],
      completedStepIds: [],
      welcomeDismissed: false,
    };
    persistState(initialStored);

    set({
      completedTrackIds: [],
      completedStepIds: [],
      welcomeModalOpen: true,
      hasClaimedFreePack: hasClaimed,
      isInitialized: true,
    });
  },

  startTourTrack: (trackId: TourTrackId) => {
    set({
      activeTrackId: trackId,
      activeTrackStepIndex: 0,
      tourActive: true,
      welcomeModalOpen: false,
      unclaimedPackModalOpen: false,
      trackSelectModalOpen: false,
    });
  },

  setTrackStepIndex: (index: number) => {
    set({ activeTrackStepIndex: Math.max(0, index) });
  },

  completeStep: (stepId: string) => {
    const current = get().completedStepIds;
    if (current.includes(stepId)) return;

    const next = [...current, stepId];
    set({ completedStepIds: next });

    const stored = readStoredState() ?? {
      completedTrackIds: get().completedTrackIds,
      completedStepIds: [],
      welcomeDismissed: true,
    };
    persistState({ ...stored, completedStepIds: next });
  },

  completeTrack: (trackId: TourTrackId) => {
    const nextTracks = Array.from(new Set([...get().completedTrackIds, trackId]));
    set({
      completedTrackIds: nextTracks,
      tourActive: false,
      activeTrackId: null,
      activeTrackStepIndex: 0,
    });

    const stored = readStoredState() ?? {
      completedTrackIds: [],
      completedStepIds: get().completedStepIds,
      welcomeDismissed: true,
    };
    persistState({ ...stored, completedTrackIds: nextTracks });
  },

  stopTour: () => {
    set({
      tourActive: false,
      activeTrackId: null,
      activeTrackStepIndex: 0,
    });
  },

  resetAllTours: () => {
    const resetState: StoredOnboardingState = {
      completedTrackIds: [],
      completedStepIds: [],
      welcomeDismissed: false,
    };
    persistState(resetState);
    set({
      completedTrackIds: [],
      completedStepIds: [],
      tourActive: false,
      activeTrackId: null,
      activeTrackStepIndex: 0,
      welcomeModalOpen: true,
    });
  },

  openWelcomeModal: () => set({ welcomeModalOpen: true }),
  closeWelcomeModal: () => {
    const hasClaimed = get().hasClaimedFreePack;
    set({
      welcomeModalOpen: false,
      // If user dismisses welcome modal without claiming, prompt with unclaimed pack notice
      unclaimedPackModalOpen: !hasClaimed,
    });
    const stored = readStoredState() ?? {
      completedTrackIds: get().completedTrackIds,
      completedStepIds: get().completedStepIds,
      welcomeDismissed: false,
    };
    persistState({ ...stored, welcomeDismissed: true });
  },

  openUnclaimedPackModal: () => set({ unclaimedPackModalOpen: true }),
  closeUnclaimedPackModal: () => set({ unclaimedPackModalOpen: false }),

  openTrackSelectModal: () => set({ trackSelectModalOpen: true }),
  closeTrackSelectModal: () => set({ trackSelectModalOpen: false }),

  setClaimedFreePack: (claimed: boolean) => {
    set({
      hasClaimedFreePack: claimed,
      unclaimedPackModalOpen: claimed ? false : get().unclaimedPackModalOpen,
    });
  },
}));
