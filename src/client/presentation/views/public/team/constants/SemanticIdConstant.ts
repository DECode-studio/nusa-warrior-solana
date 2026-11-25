export const TEAM_SEMANTIC_IDS = {
  ROOT: "team-view-root",

  // Hero Section
  HERO: "team-hero-section",
  HERO_BADGE: "team-hero-badge",
  HERO_TITLE: "team-hero-title",
  HERO_DESCRIPTION: "team-hero-description",
  HERO_CONTACT_BTN: "team-hero-contact-btn",

  // Grid Section
  GRID_SECTION: "team-grid-section",
  GRID: "team-members-grid",
  MEMBER_CARD: (id: string) => `team-member-card-${id}`,
  MEMBER_IMAGE: (id: string) => `team-member-image-${id}`,
  MEMBER_NAME: (id: string) => `team-member-name-${id}`,
  MEMBER_ROLE: (id: string) => `team-member-role-${id}`,
  MEMBER_EMAIL: (id: string) => `team-member-email-${id}`,
  MEMBER_DESC: (id: string) => `team-member-desc-${id}`,

  // Empty & Loading State
  LOADING_STATE: "team-loading-state",
  ERROR_ALERT: "team-error-alert",
  EMPTY_STATE: "team-empty-state",

  // Detail Modal / BottomSheet
  MEMBER_MODAL: "team-member-detail-modal",
  MEMBER_MODAL_IMAGE: "team-member-modal-image",
  MEMBER_MODAL_NAME: "team-member-modal-name",
  MEMBER_MODAL_ROLE: "team-member-modal-role",
  MEMBER_MODAL_DESC: "team-member-modal-desc",
  MEMBER_MODAL_EMAIL_BTN: "team-member-modal-email-btn",
  MEMBER_MODAL_CLOSE_BTN: "team-member-modal-close-btn",
} as const;
