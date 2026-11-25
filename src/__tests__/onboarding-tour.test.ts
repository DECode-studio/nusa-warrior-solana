import { beforeEach, describe, expect, it } from "vitest";
import { useUserOnboardingStore } from "@/client/presentation/stores/onboardingStore";
import { TOUR_TRACKS_REGISTRY } from "@/client/presentation/components/layout/user/onboarding/tourStepsRegistry";

describe("Nusa Warrior Onboarding Tour & Guidance", () => {
  beforeEach(() => {
    // Clear localStorage mockup
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("should initialize with welcome modal open for first-time user without cards", () => {
    const store = useUserOnboardingStore.getState();
    store.initialize(false);

    const state = useUserOnboardingStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.hasClaimedFreePack).toBe(false);
    expect(state.welcomeModalOpen).toBe(true);
  });

  it("should start a specific multi-track tour", () => {
    const store = useUserOnboardingStore.getState();
    store.initialize(false);
    store.startTourTrack("new-warrior-journey");

    const state = useUserOnboardingStore.getState();
    expect(state.tourActive).toBe(true);
    expect(state.activeTrackId).toBe("new-warrior-journey");
    expect(state.activeTrackStepIndex).toBe(0);
    expect(state.welcomeModalOpen).toBe(false);
  });

  it("should progress steps and complete track", () => {
    const store = useUserOnboardingStore.getState();
    store.initialize(false);
    store.startTourTrack("console-menus");

    store.completeStep("menu-dashboard");
    expect(useUserOnboardingStore.getState().completedStepIds).toContain("menu-dashboard");

    store.setTrackStepIndex(2);
    expect(useUserOnboardingStore.getState().activeTrackStepIndex).toBe(2);

    store.completeTrack("console-menus");
    const updated = useUserOnboardingStore.getState();
    expect(updated.tourActive).toBe(false);
    expect(updated.completedTrackIds).toContain("console-menus");
  });

  it("should prompt unclaimed pack modal if welcome modal is dismissed without claiming", () => {
    const store = useUserOnboardingStore.getState();
    store.initialize(false);
    expect(useUserOnboardingStore.getState().welcomeModalOpen).toBe(true);

    store.closeWelcomeModal();
    const state = useUserOnboardingStore.getState();
    expect(state.welcomeModalOpen).toBe(false);
    expect(state.unclaimedPackModalOpen).toBe(true);
  });

  it("should clear unclaimed pack modal once free pack is claimed", () => {
    const store = useUserOnboardingStore.getState();
    store.initialize(false);
    store.closeWelcomeModal();

    expect(useUserOnboardingStore.getState().unclaimedPackModalOpen).toBe(true);

    store.setClaimedFreePack(true);
    const state = useUserOnboardingStore.getState();
    expect(state.hasClaimedFreePack).toBe(true);
    expect(state.unclaimedPackModalOpen).toBe(false);
  });

  it("should reset all tours and reopen welcome modal", () => {
    const store = useUserOnboardingStore.getState();
    store.initialize(true);
    store.completeTrack("new-warrior-journey");

    expect(useUserOnboardingStore.getState().completedTrackIds).toContain("new-warrior-journey");

    store.resetAllTours();
    const resetState = useUserOnboardingStore.getState();
    expect(resetState.completedTrackIds.length).toBe(0);
    expect(resetState.welcomeModalOpen).toBe(true);
  });

  it("should have all 4 multi-track modules registered with valid steps", () => {
    const tracks = Object.keys(TOUR_TRACKS_REGISTRY);
    expect(tracks).toContain("new-warrior-journey");
    expect(tracks).toContain("console-menus");
    expect(tracks).toContain("battle-academy");
    expect(tracks).toContain("deck-strategy");

    for (const trackId of tracks) {
      const meta = TOUR_TRACKS_REGISTRY[trackId as keyof typeof TOUR_TRACKS_REGISTRY];
      expect(meta.steps.length).toBeGreaterThan(0);
      for (const step of meta.steps) {
        expect(step.id).toBeDefined();
        expect(step.target).toBeDefined();
        expect(step.titleKey).toBeDefined();
        expect(step.contentKey).toBeDefined();
      }
    }
  });
});

