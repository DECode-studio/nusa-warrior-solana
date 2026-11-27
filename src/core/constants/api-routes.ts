export const API_BASE_PATHS = {
  v1: "/api/v1",
} as const;

export const AUTH_API_ROUTES = {
  solanaNonce: `${API_BASE_PATHS.v1}/auth/solana/nonce`,
  solanaVerify: `${API_BASE_PATHS.v1}/auth/solana/verify`,
  solanaRegister: `${API_BASE_PATHS.v1}/auth/solana/register`,
  login: `${API_BASE_PATHS.v1}/auth/login`,
  logout: `${API_BASE_PATHS.v1}/auth/logout`,
  me: `${API_BASE_PATHS.v1}/auth/me`,
} as const;

export const CARD_API_ROUTES = {
  list: `${API_BASE_PATHS.v1}/cards`,
  detail: (slug: string) => `${API_BASE_PATHS.v1}/cards/${slug}`,
  reports: (slug: string) => `${API_BASE_PATHS.v1}/cards/${slug}/reports`,
} as const;

export const CUSTOM_CARD_API_ROUTES = {
  pricing: `${API_BASE_PATHS.v1}/user/custom-cards/pricing`,
  prepare: `${API_BASE_PATHS.v1}/user/custom-cards/prepare`,
  cards: `${API_BASE_PATHS.v1}/user/custom-cards`,
  adminPending: `${API_BASE_PATHS.v1}/admin/custom-cards`,
  adminReview: (id: string) => `${API_BASE_PATHS.v1}/admin/custom-cards/${id}`,
} as const;

export const DECK_API_ROUTES = {
  list: `${API_BASE_PATHS.v1}/decks`,
  create: `${API_BASE_PATHS.v1}/decks`,
  detail: (id: string) => `${API_BASE_PATHS.v1}/decks/${id}`,
} as const;

export const COLLECTION_API_ROUTES = {
  list: `${API_BASE_PATHS.v1}/collection`,
} as const;

export const MATCH_API_ROUTES = {
  list: `${API_BASE_PATHS.v1}/matches`,
} as const;

export const BATTLE_API_ROUTES = {
  create: `${API_BASE_PATHS.v1}/battles`,
  active: `${API_BASE_PATHS.v1}/battles/active`,
  detail: (id: string) => `${API_BASE_PATHS.v1}/battles/${id}`,
  actions: (id: string) => `${API_BASE_PATHS.v1}/battles/${id}/actions`,
  reconnect: (id: string) => `${API_BASE_PATHS.v1}/battles/${id}/reconnect`,
  quickMatch: `${API_BASE_PATHS.v1}/battles/quick-match`,
  quickMatchSearch: `${API_BASE_PATHS.v1}/battles/quick-match/search`,
  vaultPrepare: (id: string) => `${API_BASE_PATHS.v1}/battles/${id}/vault/prepare`,
  vaultConfirm: (id: string) => `${API_BASE_PATHS.v1}/battles/${id}/vault/confirm`,
} as const;

export const LEAGUE_API_ROUTES = {
  list: `${API_BASE_PATHS.v1}/leagues`,
  mine: `${API_BASE_PATHS.v1}/leagues/mine`,
  create: `${API_BASE_PATHS.v1}/leagues`,
  detail: (id: string) => `${API_BASE_PATHS.v1}/leagues/${id}`,
  join: (id: string) => `${API_BASE_PATHS.v1}/leagues/${id}/join`,
  joinByCode: `${API_BASE_PATHS.v1}/leagues/join`,
  registration: (id: string) => `${API_BASE_PATHS.v1}/leagues/${id}/registration`,
  start: (id: string) => `${API_BASE_PATHS.v1}/leagues/${id}/start`,
  cancel: (id: string) => `${API_BASE_PATHS.v1}/leagues/${id}/cancel`,
} as const;

export const STORY_MODE_API_ROUTES = {
  state: `${API_BASE_PATHS.v1}/story-mode`,
  start: `${API_BASE_PATHS.v1}/story-mode/start`,
  complete: `${API_BASE_PATHS.v1}/story-mode/complete`,
  media: (assetId: string) => `${API_BASE_PATHS.v1}/story-mode/assets/${encodeURIComponent(assetId)}`,
  admin: `${API_BASE_PATHS.v1}/admin/story-mode`,
  adminAssets: `${API_BASE_PATHS.v1}/admin/story-mode/assets`,
} as const;

export const SOLANA_API_ROUTES = {
  faucetSol: `${API_BASE_PATHS.v1}/solana/faucet`,
  tokenBalances: `${API_BASE_PATHS.v1}/solana/tokens/balances`,
  tokenFaucet: `${API_BASE_PATHS.v1}/solana/tokens/faucet`,
  claimPrepare: `${API_BASE_PATHS.v1}/solana/tokens/claim/prepare`,
  claimConfirm: `${API_BASE_PATHS.v1}/solana/tokens/claim/confirm`,
  dexPools: `${API_BASE_PATHS.v1}/solana/dex/pools`,
  dexQuote: `${API_BASE_PATHS.v1}/solana/dex/quote`,
  dexSwap: `${API_BASE_PATHS.v1}/solana/dex/swap`,
} as const;

export const SHOP_API_ROUTES = {
  decks: `${API_BASE_PATHS.v1}/shop/decks`,
  checkoutPrepare: `${API_BASE_PATHS.v1}/shop/checkout/prepare`,
  checkout: `${API_BASE_PATHS.v1}/shop/checkout`,
  paymentMethods: `${API_BASE_PATHS.v1}/shop/payment-methods`,
  transactions: `${API_BASE_PATHS.v1}/shop/transactions`,
  order: (id: string) => `${API_BASE_PATHS.v1}/shop/orders/${id}`,
  paymentCallback: `${API_BASE_PATHS.v1}/shop/payments/menu-kita/callback`,
  claimStarter: `${API_BASE_PATHS.v1}/shop/claim-starter`,
  topupTiers: `${API_BASE_PATHS.v1}/shop/topup/tiers`,
  topupCheckout: `${API_BASE_PATHS.v1}/shop/topup/checkout`,
  topupOrder: (id: string) => `${API_BASE_PATHS.v1}/shop/topup/orders/${id}`,
} as const;

export const TEAM_API_ROUTES = {
  list: `${API_BASE_PATHS.v1}/team`,
} as const;

export const ADMIN_API_ROUTES = {
  cards: `${API_BASE_PATHS.v1}/admin/cards`,
  reports: `${API_BASE_PATHS.v1}/admin/reports`,
  users: `${API_BASE_PATHS.v1}/admin/users`,
  paymentGateway: `${API_BASE_PATHS.v1}/admin/payment-gateway`,
  team: `${API_BASE_PATHS.v1}/admin/team`,
  teamMember: (id: string) => `${API_BASE_PATHS.v1}/admin/team/${id}`,
  teamUpload: `${API_BASE_PATHS.v1}/admin/team/upload`,
} as const;

export const API_ROUTES = {
  AUTH: {
    SOLANA_NONCE: AUTH_API_ROUTES.solanaNonce,
    SOLANA_VERIFY: AUTH_API_ROUTES.solanaVerify,
    SOLANA_REGISTER: AUTH_API_ROUTES.solanaRegister,
    LOGIN: AUTH_API_ROUTES.login,
    LOGOUT: AUTH_API_ROUTES.logout,
    ME: AUTH_API_ROUTES.me,
  },
  CARDS: {
    LIST: CARD_API_ROUTES.list,
    DETAIL: CARD_API_ROUTES.detail,
    REPORTS: CARD_API_ROUTES.reports,
  },
  CUSTOM_CARDS: CUSTOM_CARD_API_ROUTES,
  DECKS: {
    LIST: DECK_API_ROUTES.list,
    CREATE: DECK_API_ROUTES.create,
    DETAIL: DECK_API_ROUTES.detail,
  },
  COLLECTION: COLLECTION_API_ROUTES,
  MATCHES: {
    LIST: MATCH_API_ROUTES.list,
  },
  BATTLES: BATTLE_API_ROUTES,
  LEAGUES: LEAGUE_API_ROUTES,
  STORY_MODE: STORY_MODE_API_ROUTES,
  TEAM: TEAM_API_ROUTES,
  SHOP: {
    DECKS: SHOP_API_ROUTES.decks,
    CHECKOUT_PREPARE: SHOP_API_ROUTES.checkoutPrepare,
    CHECKOUT: SHOP_API_ROUTES.checkout,
    PAYMENT_METHODS: SHOP_API_ROUTES.paymentMethods,
    TRANSACTIONS: SHOP_API_ROUTES.transactions,
    ORDER: SHOP_API_ROUTES.order,
    PAYMENT_CALLBACK: SHOP_API_ROUTES.paymentCallback,
    CLAIM_STARTER: SHOP_API_ROUTES.claimStarter,
    TOPUP_TIERS: SHOP_API_ROUTES.topupTiers,
    TOPUP_CHECKOUT: SHOP_API_ROUTES.topupCheckout,
    TOPUP_ORDER: SHOP_API_ROUTES.topupOrder,
  },
  SOLANA: SOLANA_API_ROUTES,
  ADMIN: {
    CARDS: ADMIN_API_ROUTES.cards,
    REPORTS: ADMIN_API_ROUTES.reports,
    USERS: ADMIN_API_ROUTES.users,
    PAYMENT_GATEWAY: ADMIN_API_ROUTES.paymentGateway,
    TEAM: ADMIN_API_ROUTES.team,
    TEAM_MEMBER: ADMIN_API_ROUTES.teamMember,
    TEAM_UPLOAD: ADMIN_API_ROUTES.teamUpload,
  },
} as const;
