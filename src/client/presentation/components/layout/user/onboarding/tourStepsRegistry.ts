import { ROUTES, type SupportedLocale } from "@/core/constants/routes";
import { USER_LAYOUT_SEMANTIC_IDS } from "@/client/presentation/components/layout/user/constants/SemanticIdConstant";
import { USER_DASHBOARD_SEMANTIC_IDS } from "@/client/presentation/views/user/dashboard/constants/SemanticIdConstant";
import { SHOP_SEMANTIC_IDS } from "@/client/presentation/views/user/shop/constants/SemanticIdConstant";
import { TUTORIAL_SEMANTIC_IDS } from "@/client/presentation/views/user/tutorial/constants/SemanticIdConstant";
import { DECK_BUILDER_SEMANTIC_IDS } from "@/client/presentation/views/user/deck-builder/constants/SemanticIdConstant";
import { BATTLE_SEMANTIC_IDS } from "@/client/presentation/views/user/battle/battle-lobby/constants/SemanticIdConstant";
import type { TourTrackId } from "@/client/presentation/stores/onboardingStore";

export interface TourStepDefinition {
  id: string;
  target: string;
  mode: "info" | "click";
  titleKey: string;
  contentKey: string;
  targetPath?: (locale: SupportedLocale) => string;
}

export interface TourTrackMetadata {
  id: TourTrackId;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  iconName: string;
  steps: TourStepDefinition[];
}

export const TOUR_TRACKS_REGISTRY: Record<TourTrackId, TourTrackMetadata> = {
  "new-warrior-journey": {
    id: "new-warrior-journey",
    titleKey: "tour.trackNewWarrior.title",
    descKey: "tour.trackNewWarrior.desc",
    badgeKey: "tour.trackNewWarrior.badge",
    iconName: "Sparkles",
    steps: [
      {
        id: "nwj-welcome",
        target: `#${USER_DASHBOARD_SEMANTIC_IDS.HEADING}`,
        mode: "info",
        titleKey: "tour.step.nwjWelcome.title",
        contentKey: "tour.step.nwjWelcome.content",
        targetPath: (locale) => ROUTES.USER_DASHBOARD(locale),
      },
      {
        id: "nwj-go-shop",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}shop`,
        mode: "info",
        titleKey: "tour.step.nwjGoShop.title",
        contentKey: "tour.step.nwjGoShop.content",
        targetPath: (locale) => ROUTES.USER_DASHBOARD(locale),
      },
      {
        id: "nwj-shop-packs",
        target: `#${SHOP_SEMANTIC_IDS.PACKS_GRID}`,
        mode: "info",
        titleKey: "tour.step.nwjShopPacks.title",
        contentKey: "tour.step.nwjShopPacks.content",
        targetPath: (locale) => ROUTES.USER_SHOP(locale),
      },
      {
        id: "nwj-shop-claim",
        target: `#${SHOP_SEMANTIC_IDS.CHECKOUT_PANEL}`,
        mode: "info",
        titleKey: "tour.step.nwjShopClaim.title",
        contentKey: "tour.step.nwjShopClaim.content",
        targetPath: (locale) => ROUTES.USER_SHOP(locale),
      },
      {
        id: "nwj-go-tutorial",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}tutorial`,
        mode: "info",
        titleKey: "tour.step.nwjGoTutorial.title",
        contentKey: "tour.step.nwjGoTutorial.content",
        targetPath: (locale) => ROUTES.USER_SHOP(locale),
      },
      {
        id: "nwj-tutorial-progress",
        target: `#${TUTORIAL_SEMANTIC_IDS.STEP_PROGRESS}`,
        mode: "info",
        titleKey: "tour.step.nwjTutorialProgress.title",
        contentKey: "tour.step.nwjTutorialProgress.content",
        targetPath: (locale) => ROUTES.USER_TUTORIAL(locale),
      },
      {
        id: "nwj-go-decks",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}decks`,
        mode: "info",
        titleKey: "tour.step.nwjGoDecks.title",
        contentKey: "tour.step.nwjGoDecks.content",
        targetPath: (locale) => ROUTES.USER_TUTORIAL(locale),
      },
      {
        id: "nwj-deck-editor",
        target: `#${DECK_BUILDER_SEMANTIC_IDS.EDITOR_PANEL}`,
        mode: "info",
        titleKey: "tour.step.nwjDeckEditor.title",
        contentKey: "tour.step.nwjDeckEditor.content",
        targetPath: (locale) => ROUTES.USER_DECKS(locale),
      },
      {
        id: "nwj-go-battle",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}battle`,
        mode: "info",
        titleKey: "tour.step.nwjGoBattle.title",
        contentKey: "tour.step.nwjGoBattle.content",
        targetPath: (locale) => ROUTES.USER_DECKS(locale),
      },
      {
        id: "nwj-battle-lobby",
        target: `#${BATTLE_SEMANTIC_IDS.START_BATTLE_BTN}`,
        mode: "info",
        titleKey: "tour.step.nwjBattleLobby.title",
        contentKey: "tour.step.nwjBattleLobby.content",
        targetPath: (locale) => ROUTES.USER_BATTLE(locale),
      },
    ],
  },

  "console-menus": {
    id: "console-menus",
    titleKey: "tour.trackConsoleMenus.title",
    descKey: "tour.trackConsoleMenus.desc",
    badgeKey: "tour.trackConsoleMenus.badge",
    iconName: "LayoutDashboard",
    steps: [
      {
        id: "menu-dashboard",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}dashboard`,
        mode: "info",
        titleKey: "tour.step.menuDashboard.title",
        contentKey: "tour.step.menuDashboard.content",
        targetPath: (locale: SupportedLocale) => ROUTES.USER_DASHBOARD(locale),
      },
      {
        id: "menu-tutorial",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}tutorial`,
        mode: "info",
        titleKey: "tour.step.menuTutorial.title",
        contentKey: "tour.step.menuTutorial.content",
      },
      {
        id: "menu-battle",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}battle`,
        mode: "info",
        titleKey: "tour.step.menuBattle.title",
        contentKey: "tour.step.menuBattle.content",
      },
      {
        id: "menu-decks",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}decks`,
        mode: "info",
        titleKey: "tour.step.menuDecks.title",
        contentKey: "tour.step.menuDecks.content",
      },
      {
        id: "menu-shop",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.NAV_ITEM_PREFIX}shop`,
        mode: "info",
        titleKey: "tour.step.menuShop.title",
        contentKey: "tour.step.menuShop.content",
      },
      {
        id: "menu-audio-locale",
        target: `#${USER_LAYOUT_SEMANTIC_IDS.LOCALE_SWITCH_BTN}`,
        mode: "info",
        titleKey: "tour.step.menuAudioLocale.title",
        contentKey: "tour.step.menuAudioLocale.content",
      },
    ],
  },

  "battle-academy": {
    id: "battle-academy",
    titleKey: "tour.trackBattleAcademy.title",
    descKey: "tour.trackBattleAcademy.desc",
    badgeKey: "tour.trackBattleAcademy.badge",
    iconName: "GraduationCap",
    steps: [
      {
        id: "ba-progress",
        target: `#${TUTORIAL_SEMANTIC_IDS.STEP_PROGRESS}`,
        mode: "info",
        titleKey: "tour.step.baProgress.title",
        contentKey: "tour.step.baProgress.content",
        targetPath: (locale: SupportedLocale) => ROUTES.USER_TUTORIAL(locale),
      },
      {
        id: "ba-lesson",
        target: `#${TUTORIAL_SEMANTIC_IDS.LESSON_CARD}`,
        mode: "info",
        titleKey: "tour.step.baLesson.title",
        contentKey: "tour.step.baLesson.content",
        targetPath: (locale: SupportedLocale) => ROUTES.USER_TUTORIAL(locale),
      },
      {
        id: "ba-board",
        target: `#${TUTORIAL_SEMANTIC_IDS.BOARD_PREVIEW}`,
        mode: "info",
        titleKey: "tour.step.baBoard.title",
        contentKey: "tour.step.baBoard.content",
        targetPath: (locale: SupportedLocale) => ROUTES.USER_TUTORIAL(locale),
      },
      {
        id: "ba-start-battle",
        target: `#${TUTORIAL_SEMANTIC_IDS.START_REAL_BATTLE_BTN}`,
        mode: "info",
        titleKey: "tour.step.baStartBattle.title",
        contentKey: "tour.step.baStartBattle.content",
        targetPath: (locale: SupportedLocale) => ROUTES.USER_TUTORIAL(locale),
      },
    ],
  },

  "deck-strategy": {
    id: "deck-strategy",
    titleKey: "tour.trackDeckStrategy.title",
    descKey: "tour.trackDeckStrategy.desc",
    badgeKey: "tour.trackDeckStrategy.badge",
    iconName: "Layers",
    steps: [
      {
        id: "ds-slots",
        target: `#${DECK_BUILDER_SEMANTIC_IDS.EDITOR_PANEL}`,
        mode: "info",
        titleKey: "tour.step.dsSlots.title",
        contentKey: "tour.step.dsSlots.content",
        targetPath: (locale) => ROUTES.USER_DECKS(locale),
      },
      {
        id: "ds-filter",
        target: `#${DECK_BUILDER_SEMANTIC_IDS.FILTER_BAR}`,
        mode: "info",
        titleKey: "tour.step.dsFilter.title",
        contentKey: "tour.step.dsFilter.content",
        targetPath: (locale) => ROUTES.USER_DECKS(locale),
      },
      {
        id: "ds-autofill",
        target: `#${DECK_BUILDER_SEMANTIC_IDS.AUTO_FILL_BTN}`,
        mode: "info",
        titleKey: "tour.step.dsAutofill.title",
        contentKey: "tour.step.dsAutofill.content",
        targetPath: (locale) => ROUTES.USER_DECKS(locale),
      },
      {
        id: "ds-save",
        target: `#${DECK_BUILDER_SEMANTIC_IDS.SAVE_DECK_BTN}`,
        mode: "info",
        titleKey: "tour.step.dsSave.title",
        contentKey: "tour.step.dsSave.content",
        targetPath: (locale) => ROUTES.USER_DECKS(locale),
      },
    ],
  },
};
