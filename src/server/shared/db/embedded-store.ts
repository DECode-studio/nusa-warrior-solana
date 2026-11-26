import "server-only";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import {
  ALL_CARDS_CATALOG,
  STARTER_PACKS_CATALOG,
  type ApprovalStatusValue,
  type CardTypeValue,
  type EffectTypeValue,
  type GenderValue,
  type KingdomValue,
  type PublicationStatusValue,
  type RoleValue,
  type VerificationStatusValue,
} from "@/core/constants/cards-catalog";
import type { UserRoleValue } from "../auth/session";
import { logServerEvent } from "../logging/server-logger";

export interface StoredUserRecord {
  id: string;
  walletAddress?: string | null;
  name: string;
  avatarUrl?: string | null;
  passwordHash: string;
  role: UserRoleValue;
  lastActiveAt?: string;
  hasClaimedStarterPack?: boolean;
  paymentModeOverride?: "DEV" | "PROD" | null;
  createdAt: string;
}

export interface StoredCardAssetRecord {
  id: string;
  cardId: string;
  creator: string;
  rightsHolder: string;
  sourceOrigin: string;
  licenseType: string;
  commercialAllowed: boolean;
  creditText: string;
  approvalStatus: ApprovalStatusValue;
}

export interface StoredCardRecord {
  id: string;
  code: string;
  slug: string;
  name: string;
  cardType: CardTypeValue;
  kingdom: KingdomValue;
  role: RoleValue;
  secondaryRoles: RoleValue[];
  gender: GenderValue;
  baseAttack: number;
  baseDefense: number;
  effectName: string | null;
  effectType: EffectTypeValue | null;
  effectDescriptionId: string | null;
  effectDescriptionEn: string | null;
  effectDescriptionZh: string | null;
  attackMod: number;
  strikeAttackBonus: number;
  defenseMod: number;
  enemyAttackMod: number;
  ignoreDefenseAmount: number;
  affinityRole: RoleValue | null;
  affinityGender: GenderValue;
  affinityBonusAtk: number;
  affinityBonusDef: number;
  historicalSummaryId: string;
  historicalSummaryEn: string;
  historicalSummaryZh: string;
  illustrationNote: string;
  sourceCitation: string;
  sourceUrl: string | null;
  verificationStatus: VerificationStatusValue;
  publicationStatus: PublicationStatusValue;
  isCustom?: boolean;
  customStatus?: string | null;
  creatorId?: string | null;
  rejectionReason?: string | null;
  imagePath: string;
  tokenStandard?: "TOKEN_2022" | "MPL_CORE";
  mintAddress?: string | null;
  collectionAddress?: string | null;
  metadataUri?: string | null;
  isRareEdition?: boolean;
  asset: StoredCardAssetRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDeckCardRecord {
  id: string;
  deckId: string;
  cardId: string;
  slotType: CardTypeValue;
  position: number;
}

export interface StoredDeckRecord {
  id: string;
  name: string;
  description: string | null;
  kingdomFilter: KingdomValue | "MIXED" | null;
  isPreset: boolean;
  userId: string | null;
  cards: StoredDeckCardRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredCorrectionReportRecord {
  id: string;
  cardId: string;
  cardSlug: string;
  cardName: string;
  reporterName: string;
  reporterEmail: string | null;
  category: string;
  description: string;
  referenceUrl: string | null;
  status: "OPEN" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMatchLogRecord {
  id: string;
  userId: string | null;
  playerDeckName: string;
  botDifficulty: string;
  winner: "PLAYER" | "BOT";
  totalTurns: number;
  durationSec: number;
  playerScore: number;
  botScore: number;
  createdAt: string;
}

export interface StoredBattleSessionRecord {
  id: string;
  createRequestKey: string | null;
  userId: string;
  opponentUserId?: string | null;
  deckId: string;
  deckName: string;
  opponentDeckId?: string | null;
  opponentDeckName?: string | null;
  isQuickMatch?: boolean;
  playerDeckCardSlugsJson?: string | null;
  opponentDeckCardSlugsJson?: string | null;
  rewardCardSlug?: string | null;
  storyKingdom?: "MAJAPAHIT" | "PAJAJARAN" | null;
  storyMissionId?: string | null;
  storyChoiceId?: string | null;
  botDifficulty: string;
  rulesVersion: string;
  sequence: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  stateJson: string;
  eventsJson: string;
  lastSeenAt: string;
  opponentLastSeenAt?: string | null;
  disconnectedAt: string | null;
  opponentDisconnectedAt?: string | null;
  reconnectDeadlineAt: string | null;
  opponentReconnectDeadlineAt?: string | null;
  turnDeadlineAt: string | null;
  vaultPda?: string | null;
  playerLockTxSignature?: string | null;
  opponentLockTxSignature?: string | null;
  settleTxSignature?: string | null;
  rngCommitment: string | null;
  rngSecret: string | null;
  rngCounter: number;
  rngDrawsJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredStoryProgressRecord {
  id: string;
  userId: string;
  kingdom: KingdomValue;
  completedMissionIds: string[];
  replayCounts: Record<string, number>;
  choices: Record<string, string>;
  claimedBattleIds: string[];
  claimResults: Record<string, { nusaPoints: number; rewardCard: { slug: string; name: string; imagePath: string } | null }>;
  endingSeen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredQuickMatchQueueRecord {
  id: string;
  userId: string;
  deckId: string;
  deckName: string;
  battlePower: number;
  characterSlugsJson: string;
  instrumentSlugsJson: string;
  idempotencyKey: string;
  acceptedAt: string;
  status: "WAITING" | "MATCHED" | "CANCELLED";
  battleSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredLeagueRoomRecord {
  id: string;
  creatorId: string;
  joinCode: string;
  isPublic: boolean;
  status: string;
  maxParticipants: number | null;
  registrationClosesAt: string;
  startMode: string;
  startDelayMinutes: number;
  scheduledStartAt: string | null;
  manualStartDeadlineAt: string | null;
  rulesJson: string;
  createdAt: string;
  updatedAt: string;
  terminalAt: string | null;
  participants: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    deckId: string | null;
    stakeCardSlug: string | null;
    joinedAt: string;
    updatedAt: string;
  }>;
  rounds: Array<{
    id: string;
    roundNumber: number;
    status: string;
    createdAt: string;
    matches: Array<{
      id: string;
      playerOneId: string;
      playerTwoId: string | null;
      winnerId: string | null;
      status: string;
      battleSessionId: string | null;
      durationDeadlineAt: string | null;
      createdAt: string;
      completedAt: string | null;
    }>;
  }>;
}

export interface StoredStarterPackRecord {
  id: string;
  code: string;
  nameId: string;
  nameEn: string;
  nameZh: string;
  descriptionId: string;
  descriptionEn: string;
  descriptionZh: string;
  kingdomTheme: KingdomValue;
  priceIdr: number;
  cardSlugs: string[];
  isFairPlaySafe: boolean;
  imagePath?: string;
  packType?: "STARTER" | "BOOSTER";
  isStarter?: boolean;
  cardCount?: number;
}

export interface StoredPaymentOrderRecord {
  id: string;
  orderNumber: string;
  userId: string | null;
  buyerName: string;
  buyerEmail: string;
  starterPackId: string;
  starterPackCode: string;
  starterPackName: string;
  amountIdr: number;
  originalAmountIdr?: number;
  pointsSpent?: number;
  paymentMethod: string;
  paymentStatus: "PAID" | "PENDING" | "FAILED" | "EXPIRED";
  paymentProvider?: string;
  paymentMode?: "DEV" | "PROD";
  gatewayReference?: string | null;
  paymentUrl?: string | null;
  paymentInstructions?: Record<string, unknown> | null;
  expiresAt?: string | null;
  drawnCardSlugs?: string[];
  createdAt: string;
  paidAt: string | null;
}

export interface StoredTopupOrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: string;
  paymentChannel?: string | null;
  amountIdr: number;
  feeIdr: number;
  pointsAwarded: number;
  paymentStatus: "PAID" | "PENDING" | "FAILED" | "EXPIRED";
  paymentProvider?: string;
  paymentMode?: "DEV" | "PROD";
  gatewayReference?: string | null;
  paymentUrl?: string | null;
  paymentInstructions?: Record<string, unknown> | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  paidAt: string | null;
}

export interface StoredNusaPointTransactionRecord {
  id: string;
  userId: string;
  amount: number;
  source: string;
  sourceId: string;
  opponentUserId?: string | null;
  createdAt: string;
}

export interface StoredUserCardRecord {
  id: string;
  userId: string;
  cardId: string;
  quantity: number;
  source: string;
  createdAt: string;
}

export interface EmbeddedDatabaseState {
  users: StoredUserRecord[];
  cards: StoredCardRecord[];
  decks: StoredDeckRecord[];
  correctionReports: StoredCorrectionReportRecord[];
  matchLogs: StoredMatchLogRecord[];
  battleSessions: StoredBattleSessionRecord[];
  quickMatchQueue: StoredQuickMatchQueueRecord[];
  leagueRooms: StoredLeagueRoomRecord[];
  starterPacks: StoredStarterPackRecord[];
  paymentOrders: StoredPaymentOrderRecord[];
  topupOrders: StoredTopupOrderRecord[];
  nusaPointTransactions: StoredNusaPointTransactionRecord[];
  paymentGatewaySetting: {
    globalMode: "DEV" | "PROD";
    updatedByUserId: string | null;
    updatedAt: string;
  };
  userCards: StoredUserCardRecord[];
  storyProgress: StoredStoryProgressRecord[];
}

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "nusantara-db.json");

const globalStoreRef = globalThis as unknown as {
  nusantaraEmbeddedDb?: EmbeddedDatabaseState;
};

function countCardSlugQuantities(cardSlugs: string[]): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const slug of cardSlugs) {
    quantities.set(slug, (quantities.get(slug) ?? 0) + 1);
  }
  return quantities;
}

function createInitialSeedState(): EmbeddedDatabaseState {
  const nowIso = new Date().toISOString();
  const defaultPasswordHash = bcrypt.hashSync("Nusantara2026!", 8);

  const users: StoredUserRecord[] = [
    {
      id: "usr-admin-01",
      walletAddress: null,
      name: "Admin Nusantara Card",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      createdAt: nowIso,
    },
    {
      id: "usr-curator-01",
      walletAddress: null,
      name: "Kurator Sejarah Nusantara",
      passwordHash: defaultPasswordHash,
      role: "CURATOR",
      createdAt: nowIso,
    },
    {
      id: "usr-player-01",
      walletAddress: null,
      name: "Kesatria Dwipantara",
      passwordHash: defaultPasswordHash,
      role: "PLAYER",
      createdAt: nowIso,
    },
  ];

  const cardIdBySlug = new Map<string, string>();
  const cards: StoredCardRecord[] = ALL_CARDS_CATALOG.map((seed, index) => {
    const cardId = `crd-${String(index + 1).padStart(3, "0")}-${seed.slug}`;
    cardIdBySlug.set(seed.slug, cardId);
    return {
      id: cardId,
      code: seed.code,
      slug: seed.slug,
      name: seed.name,
      cardType: seed.cardType,
      kingdom: seed.kingdom,
      role: seed.role,
      secondaryRoles: [...seed.secondaryRoles],
      gender: seed.gender,
      baseAttack: seed.baseAttack,
      baseDefense: seed.baseDefense,
      effectName: seed.effectName,
      effectType: seed.effectType,
      effectDescriptionId: seed.effectDescriptionId,
      effectDescriptionEn: seed.effectDescriptionEn,
      effectDescriptionZh: seed.effectDescriptionZh,
      attackMod: seed.attackMod,
      strikeAttackBonus: seed.strikeAttackBonus ?? 0,
      defenseMod: seed.defenseMod,
      enemyAttackMod: seed.enemyAttackMod,
      ignoreDefenseAmount: seed.ignoreDefenseAmount,
      affinityRole: seed.affinityRole,
      affinityGender: seed.affinityGender,
      affinityBonusAtk: seed.affinityBonusAtk,
      affinityBonusDef: seed.affinityBonusDef,
      historicalSummaryId: seed.historicalSummaryId,
      historicalSummaryEn: seed.historicalSummaryEn,
      historicalSummaryZh: seed.historicalSummaryZh,
      illustrationNote: seed.illustrationNote,
      sourceCitation: seed.sourceCitation,
      sourceUrl: seed.sourceUrl,
      verificationStatus: seed.verificationStatus,
      publicationStatus: seed.publicationStatus,
      imagePath: seed.imagePath,
      asset: {
        id: `ast-${String(index + 1).padStart(3, "0")}`,
        cardId,
        creator: seed.assetMetadata.creator,
        rightsHolder: seed.assetMetadata.rightsHolder,
        sourceOrigin: seed.assetMetadata.sourceOrigin,
        licenseType: seed.assetMetadata.licenseType,
        commercialAllowed: seed.assetMetadata.commercialAllowed,
        creditText: seed.assetMetadata.creditText,
        approvalStatus: seed.assetMetadata.approvalStatus,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });

  const starterPacks: StoredStarterPackRecord[] = STARTER_PACKS_CATALOG.map(
    (pack, idx) => ({
      id: `pck-${idx + 1}-${pack.code.toLowerCase()}`,
      code: pack.code,
      nameId: pack.nameId,
      nameEn: pack.nameEn,
      nameZh: pack.nameZh,
      descriptionId: pack.descriptionId,
      descriptionEn: pack.descriptionEn,
      descriptionZh: pack.descriptionZh,
      kingdomTheme: pack.kingdomTheme,
      priceIdr: pack.priceIdr,
      cardSlugs: [...pack.cardSlugs],
      isFairPlaySafe: pack.isFairPlaySafe,
      imagePath: pack.imagePath,
      packType: pack.packType,
      isStarter: pack.isStarter,
      cardCount: pack.cardCount,
    })
  );

  const decks: StoredDeckRecord[] = STARTER_PACKS_CATALOG.map((pack, idx) => {
    const deckId = `dck-preset-${idx + 1}`;
    let charPos = 0;
    let instPos = 0;
    const deckCards: StoredDeckCardRecord[] = [];
    for (const slug of pack.cardSlugs) {
      const cardId = cardIdBySlug.get(slug);
      const cardRecord = cards.find((c) => c.slug === slug);
      if (cardId && cardRecord) {
        const isChar = cardRecord.cardType === "CHARACTER";
        if (isChar && charPos >= 10) continue;
        if (!isChar && instPos >= 10) continue;
        deckCards.push({
          id: `${deckId}-slot-${deckCards.length + 1}`,
          deckId,
          cardId,
          slotType: isChar ? "CHARACTER" : "INSTRUMENT",
          position: isChar ? charPos++ : instPos++,
        });
      }
    }
    return {
      id: deckId,
      name: pack.nameId,
      description: pack.descriptionId,
      kingdomFilter: pack.kingdomTheme,
      isPreset: true,
      userId: "usr-player-01",
      cards: deckCards,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });

  const correctionReports: StoredCorrectionReportRecord[] = [
    {
      id: "rep-initial-01",
      cardId: cardIdBySlug.get("patih-nambi") ?? "crd-008-patih-nambi",
      cardSlug: "patih-nambi",
      cardName: "Patih Nambi",
      reporterName: "Komunitas Kajian Epigrafi Jawa Timur",
      reporterEmail: "epigrafi@komunitas-sejarah.id",
      category: "HISTORICAL_SOURCE",
      description:
        "Usulan penambahan rujukan silang Prasasti Kudadu (1294 M) selain Pararaton dan Kidung Ranggalawe untuk memperkaya konteks awal pengabdian Nambi.",
      referenceUrl: "https://kebudayaan.kemdikbud.go.id/",
      status: "OPEN",
      resolutionNote: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const starterCards = STARTER_PACKS_CATALOG[0]?.cardSlugs ?? [];
  const userCards: StoredUserCardRecord[] = [...countCardSlugQuantities(starterCards)].flatMap(([slug, quantity]) => {
    const cardId = cardIdBySlug.get(slug);
    return cardId
      ? [{
          id: `uc-seed-player-${slug}`,
          userId: "usr-player-01",
          cardId,
          quantity,
          source: "STARTER_GRANT",
          createdAt: nowIso,
        }]
      : [];
  });

  return {
    users,
    cards,
    decks,
    correctionReports,
    matchLogs: [],
    battleSessions: [],
    quickMatchQueue: [],
    leagueRooms: [],
    starterPacks,
    paymentOrders: [],
    topupOrders: [],
    nusaPointTransactions: [],
    paymentGatewaySetting: {
      globalMode: "DEV",
      updatedByUserId: null,
      updatedAt: nowIso,
    },
    userCards,
    storyProgress: [],
  };
}

export function getEmbeddedStore(): EmbeddedDatabaseState {
  if (globalStoreRef.nusantaraEmbeddedDb) {
    return globalStoreRef.nusantaraEmbeddedDb;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as EmbeddedDatabaseState;
      if (parsed && Array.isArray(parsed.cards) && parsed.cards.length >= 60) {
        const needsOwnershipMigration = !Array.isArray(parsed.userCards);
        const existingCardSlugs = new Set(parsed.cards.map((card) => card.slug));
        const addedCatalogCards = ALL_CARDS_CATALOG.filter((seed) => !existingCardSlugs.has(seed.slug));
        if (addedCatalogCards.length > 0) {
          const nowIso = new Date().toISOString();
          for (const seed of addedCatalogCards) {
            const cardId = `crd-story-${seed.slug}`;
            parsed.cards.push({
              id: cardId,
              code: seed.code,
              slug: seed.slug,
              name: seed.name,
              cardType: seed.cardType,
              kingdom: seed.kingdom,
              role: seed.role,
              secondaryRoles: [...seed.secondaryRoles],
              gender: seed.gender,
              baseAttack: seed.baseAttack,
              baseDefense: seed.baseDefense,
              effectName: seed.effectName,
              effectType: seed.effectType,
              effectDescriptionId: seed.effectDescriptionId,
              effectDescriptionEn: seed.effectDescriptionEn,
              effectDescriptionZh: seed.effectDescriptionZh,
              attackMod: seed.attackMod,
              strikeAttackBonus: seed.strikeAttackBonus ?? 0,
              defenseMod: seed.defenseMod,
              enemyAttackMod: seed.enemyAttackMod,
              ignoreDefenseAmount: seed.ignoreDefenseAmount,
              affinityRole: seed.affinityRole,
              affinityGender: seed.affinityGender,
              affinityBonusAtk: seed.affinityBonusAtk,
              affinityBonusDef: seed.affinityBonusDef,
              historicalSummaryId: seed.historicalSummaryId,
              historicalSummaryEn: seed.historicalSummaryEn,
              historicalSummaryZh: seed.historicalSummaryZh,
              illustrationNote: seed.illustrationNote,
              sourceCitation: seed.sourceCitation,
              sourceUrl: seed.sourceUrl,
              verificationStatus: seed.verificationStatus,
              publicationStatus: seed.publicationStatus,
              imagePath: seed.imagePath,
              asset: {
                id: `ast-story-${seed.slug}`,
                cardId,
                creator: seed.assetMetadata.creator,
                rightsHolder: seed.assetMetadata.rightsHolder,
                sourceOrigin: seed.assetMetadata.sourceOrigin,
                licenseType: seed.assetMetadata.licenseType,
                commercialAllowed: seed.assetMetadata.commercialAllowed,
                creditText: seed.assetMetadata.creditText,
                approvalStatus: seed.assetMetadata.approvalStatus,
              },
              createdAt: nowIso,
              updatedAt: nowIso,
            });
          }
        }
        parsed.battleSessions ??= [];
        parsed.quickMatchQueue ??= [];
        parsed.leagueRooms ??= [];
        for (const room of parsed.leagueRooms) {
          room.terminalAt ??= ["CANCELLED", "COMPLETED"].includes(room.status) ? room.updatedAt : null;
        }
        for (const session of parsed.battleSessions) {
          session.createRequestKey ??= null;
          session.lastSeenAt ??= session.updatedAt;
          session.disconnectedAt ??= null;
          session.reconnectDeadlineAt ??= null;
          session.turnDeadlineAt ??= null;
          session.rngCommitment ??= null;
          session.rngSecret ??= null;
          session.rngCounter ??= 0;
          session.rngDrawsJson ??= "[]";
        }
        parsed.userCards ??= [];
        parsed.storyProgress ??= [];
        parsed.topupOrders ??= [];
        parsed.nusaPointTransactions ??= [];
        if (Array.isArray(parsed.paymentOrders)) {
          for (const order of parsed.paymentOrders) {
            order.originalAmountIdr ??= order.amountIdr;
            order.pointsSpent ??= 0;
            const legacy = order as StoredPaymentOrderRecord & { sandboxRef?: string };
            legacy.paymentStatus ??= "PAID";
            legacy.paymentProvider ??= "LEGACY_SANDBOX";
            legacy.paymentMode ??= "DEV";
            legacy.gatewayReference ??= null;
            legacy.paymentUrl ??= null;
            legacy.paymentInstructions ??= legacy.sandboxRef
              ? { legacySandboxReference: legacy.sandboxRef }
              : null;
            legacy.expiresAt ??= null;
            legacy.drawnCardSlugs ??= [];
            legacy.paidAt ??= legacy.paymentStatus === "PAID" ? legacy.createdAt : null;
            delete legacy.sandboxRef;
          }
        }
        parsed.paymentGatewaySetting ??= {
          globalMode: "DEV",
          updatedByUserId: null,
          updatedAt: new Date().toISOString(),
        };
        if (parsed.userCards.length === 0 && Array.isArray(parsed.paymentOrders)) {
          const cardsBySlug = new Map(parsed.cards.map((card) => [card.slug, card]));
          const starterPack = parsed.starterPacks[0];
          const demoPlayer = parsed.users.find((user) => user.id === "usr-player-01");
          if (starterPack && demoPlayer) {
            for (const [slug, quantity] of countCardSlugQuantities(starterPack.cardSlugs)) {
              const card = cardsBySlug.get(slug);
              if (!card) continue;
              parsed.userCards.push({
                id: `uc-migrated-starter-${slug}`,
                userId: demoPlayer.id,
                cardId: card.id,
                quantity,
                source: "STARTER_GRANT",
                createdAt: demoPlayer.createdAt,
              });
            }
          }
          for (const order of parsed.paymentOrders) {
            if (!order.userId || order.paymentStatus !== "PAID") continue;
            const pack = parsed.starterPacks.find((item) => item.id === order.starterPackId);
            if (!pack) continue;
            for (const [slug, quantity] of countCardSlugQuantities(pack.cardSlugs)) {
              const card = cardsBySlug.get(slug);
              if (!card) continue;
              const owned = parsed.userCards.find(
                (item) => item.userId === order.userId && item.cardId === card.id
              );
              if (owned) owned.quantity += quantity;
              else parsed.userCards.push({
                id: `uc-migrated-${order.id}-${slug}`,
                userId: order.userId,
                cardId: card.id,
                quantity,
                source: `ORDER:${order.orderNumber}`,
                createdAt: order.paidAt ?? order.createdAt,
              });
            }
          }
        }
        for (const user of parsed.users) {
          user.hasClaimedStarterPack = Array.isArray(parsed.paymentOrders)
            ? parsed.paymentOrders.some((order) => order.userId === user.id && order.amountIdr === 0 && order.paymentStatus === "PAID")
            : user.hasClaimedStarterPack ?? false;
          user.paymentModeOverride ??= null;
          user.walletAddress ??= null;
          user.lastActiveAt ??= user.createdAt ?? new Date().toISOString();
        }

        // Keep starter packs catalog up-to-date with current 4 packs & visual assets
        const catalogCodes = new Set(STARTER_PACKS_CATALOG.map((p) => p.code));
        const hasOutdatedPacks =
          !Array.isArray(parsed.starterPacks) ||
          parsed.starterPacks.length !== STARTER_PACKS_CATALOG.length ||
          parsed.starterPacks.some((p) => !catalogCodes.has(p.code) || !p.imagePath);

        if (hasOutdatedPacks) {
          parsed.starterPacks = STARTER_PACKS_CATALOG.map((pack, idx) => ({
            id: `pck-${idx + 1}-${pack.code.toLowerCase()}`,
            code: pack.code,
            nameId: pack.nameId,
            nameEn: pack.nameEn,
            nameZh: pack.nameZh,
            descriptionId: pack.descriptionId,
            descriptionEn: pack.descriptionEn,
            descriptionZh: pack.descriptionZh,
            kingdomTheme: pack.kingdomTheme,
            priceIdr: pack.priceIdr,
            cardSlugs: [...pack.cardSlugs],
            isFairPlaySafe: pack.isFairPlaySafe,
            imagePath: pack.imagePath,
            packType: pack.packType,
            isStarter: pack.isStarter,
            cardCount: pack.cardCount,
          }));
          persistEmbeddedStore(parsed);
        }

        if (needsOwnershipMigration || addedCatalogCards.length > 0) persistEmbeddedStore(parsed);
        globalStoreRef.nusantaraEmbeddedDb = parsed;
        return parsed;
      }
    }
  } catch (error) {
    // Initialize fresh seed if file is missing or corrupted
    logServerEvent("error", "storage.embedded.load_failed", {
      file: path.basename(DB_FILE),
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown storage read error",
    });
  }

  const seeded = createInitialSeedState();
  globalStoreRef.nusantaraEmbeddedDb = seeded;
  persistEmbeddedStore(seeded);
  return seeded;
}

export function persistEmbeddedStore(state: EmbeddedDatabaseState): void {
  globalStoreRef.nusantaraEmbeddedDb = state;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    // In read-only test sandboxes, keep state in memory
    logServerEvent("error", "storage.embedded.persist_failed", {
      file: path.basename(DB_FILE),
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown storage write error",
    });
  }
}

