export const ADMIN_TEAM_SEMANTIC_IDS = {
  ROOT: "admin-team-view-root",
  HEADING: "admin-team-heading",
  FEEDBACK: "admin-team-feedback",
  SEARCH_INPUT: "admin-team-search-input",
  ADD_BTN: "admin-team-add-btn",
  RETRY_BTN: "admin-team-retry-btn",

  // Table
  TABLE: "admin-team-table",
  TABLE_ROW: (id: string) => `admin-team-row-${id}`,
  EDIT_BTN: (id: string) => `admin-team-edit-btn-${id}`,
  DELETE_BTN: (id: string) => `admin-team-delete-btn-${id}`,
  STATUS_TOGGLE: (id: string) => `admin-team-status-toggle-${id}`,

  // Modal Form
  MODAL_FORM: "admin-team-modal-form",
  MODAL_FORM_TITLE: "admin-team-modal-form-title",
  INPUT_NAME: "admin-team-input-name",
  INPUT_EMAIL: "admin-team-input-email",
  INPUT_ROLE: "admin-team-input-role",
  INPUT_DESCRIPTION: "admin-team-input-description",
  INPUT_IMAGE: "admin-team-input-image",
  INPUT_FILE: "admin-team-input-file",
  INPUT_IMAGE_POSITION_X: "admin-team-input-image-position-x",
  INPUT_IMAGE_POSITION_Y: "admin-team-input-image-position-y",
  INPUT_DISPLAY_ORDER: "admin-team-input-display-order",
  INPUT_IS_ACTIVE: "admin-team-input-is-active",
  SUBMIT_BTN: "admin-team-submit-btn",
  CANCEL_BTN: "admin-team-cancel-btn",

  // Delete Modal
  DELETE_MODAL: "admin-team-delete-modal",
  DELETE_CONFIRM_BTN: "admin-team-delete-confirm-btn",
  DELETE_CANCEL_BTN: "admin-team-delete-cancel-btn",

  // States
  LOADING_STATE: "admin-team-loading-state",
  ERROR_ALERT: "admin-team-error-alert",
} as const;
