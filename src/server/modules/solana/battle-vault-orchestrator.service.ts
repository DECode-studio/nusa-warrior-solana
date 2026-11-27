import "server-only";
import { createHash, randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { logServerEvent } from "@/server/shared/logging/server-logger";
import {
  deriveBattleVaultPda,
  getSolanaExplorerTxUrl,
} from "./solana-config";
import {
  buildChunkedLockDeckTransactions,
  type VaultLockCardInput,
} from "./nusa-vault-tx-builder.service";
import {
  ensureBattleVaultInitializedOnChain,
  settleBattleDrawOnChain,
  settleBattleWinOnChain,
  verifyPlayerVaultDepositsOnChain,
} from "./battle-vault-settlement.service";
import {
  getVerifiedWalletCards,
  invalidateWalletAssetCache,
} from "./wallet-asset-reader.service";

export interface LockedVaultCardManifest extends VaultLockCardInput {
  cardSlug: string;
}

export type VaultBattleSide = "PLAYER" | "OPPONENT";

export interface VaultEventsState {
  preparedBySide: Partial<Record<VaultBattleSide, LockedVaultCardManifest[]>>;
  lockedBySide: Partial<Record<VaultBattleSide, LockedVaultCardManifest[]>>;
  allCardsBySide: Partial<Record<VaultBattleSide, LockedVaultCardManifest[]>>;
}

const inFlightSettlements = new Map<string, Promise<void>>();
const inFlightUserReconciliations = new Map<string, Promise<number>>();
const reconcileCleanUntilByUser = new Map<string, number>();
const RECONCILE_CLEAN_COOLDOWN_MS = 10_000;

function appendAuditEvent(
  eventsJson: string,
  event: Record<string, unknown>
): string {
  const events = JSON.parse(eventsJson || "[]") as Array<
    Record<string, unknown>
  >;
  const previousHash =
    typeof events.at(-1)?.hash === "string"
      ? String(events.at(-1)?.hash)
      : null;
  const hash = createHash("sha256")
    .update(JSON.stringify({ previousHash, event }), "utf8")
    .digest("hex");
  events.push({ ...event, hash });
  return JSON.stringify(events);
}

function isLockedManifestItem(value: unknown): value is LockedVaultCardManifest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.cardSlug === "string" &&
    typeof record.mintOrAsset === "string" &&
    (record.tokenStandard === "TOKEN_2022" ||
      record.tokenStandard === "MPL_CORE") &&
    typeof record.quantity === "number" &&
    Number.isInteger(record.quantity) &&
    record.quantity > 0
  );
}

export function extractVaultEventsState(eventsJson: string): VaultEventsState {
  const result: VaultEventsState = {
    preparedBySide: {},
    lockedBySide: {},
    allCardsBySide: {},
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(eventsJson || "[]");
  } catch {
    return result;
  }
  if (!Array.isArray(parsed)) return result;

  const mergedBySide: Record<
    VaultBattleSide,
    Map<string, LockedVaultCardManifest>
  > = {
    PLAYER: new Map(),
    OPPONENT: new Map(),
  };

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const ev = item as Record<string, unknown>;
    const side = ev.side;
    if (side !== "PLAYER" && side !== "OPPONENT") continue;
    if (!Array.isArray(ev.cards)) continue;
    const cards = ev.cards.filter(isLockedManifestItem);
    if (cards.length === 0) continue;

    if (ev.type === "VAULT_LOCK_PREPARED") {
      result.preparedBySide[side] = cards;
    } else if (ev.type === "VAULT_LOCKED") {
      result.lockedBySide[side] = cards;
    } else {
      continue;
    }

    const sideMap = mergedBySide[side];
    for (const card of cards) {
      const existing = sideMap.get(card.mintOrAsset);
      if (!existing || card.quantity > existing.quantity) {
        sideMap.set(card.mintOrAsset, card);
      }
    }
  }

  for (const side of ["PLAYER", "OPPONENT"] as const) {
    const merged = [...mergedBySide[side].values()];
    if (merged.length > 0) {
      result.allCardsBySide[side] = merged;
    }
  }

  return result;
}

export function computeRemainingCardsToLock(
  prepared: LockedVaultCardManifest[],
  depositedAmounts: Record<string, number>
): LockedVaultCardManifest[] {
  const remainingCards: LockedVaultCardManifest[] = [];
  for (const card of prepared) {
    const deposited = Math.max(0, depositedAmounts[card.mintOrAsset] ?? 0);
    const remaining = card.quantity - deposited;
    if (remaining > 0) {
      remainingCards.push({
        ...card,
        quantity: remaining,
      });
    }
  }
  return remainingCards;
}

export function pickRandomLockedRewardCard(
  loserLockedCards: LockedVaultCardManifest[]
): LockedVaultCardManifest | null {
  if (loserLockedCards.length === 0) return null;
  const totalCopies = loserLockedCards.reduce(
    (sum, item) => sum + Math.max(0, item.quantity),
    0
  );
  if (totalCopies <= 0) return null;

  let target = randomInt(totalCopies);
  for (const item of loserLockedCards) {
    if (item.quantity <= 0) continue;
    if (target < item.quantity) return item;
    target -= item.quantity;
  }
  return loserLockedCards[0] ?? null;
}

export function isOnChainVaultRequiredForSession(input: {
  isQuickMatch: boolean;
  playerAWallet?: string | null;
  playerBWallet?: string | null;
}): boolean {
  if (!isPrismaDriverEnabled() || !input.isQuickMatch) return false;
  const onChainEnabled =
    process.env.NUSA_STRICT_ONCHAIN_OWNERSHIP === "true" ||
    Boolean(process.env.SOLANA_SETTLER_PRIVATE_KEY?.trim());
  if (!onChainEnabled) return false;
  return Boolean(input.playerAWallet && input.playerBWallet);
}

async function resolveDeckManifestForWallet(input: {
  userId: string;
  walletAddress: string;
  deckSlugs: string[];
}): Promise<LockedVaultCardManifest[]> {
  const copyCountBySlug = new Map<string, number>();
  for (const slug of input.deckSlugs) {
    copyCountBySlug.set(slug, (copyCountBySlug.get(slug) ?? 0) + 1);
  }

  const verifiedCards = await getVerifiedWalletCards({
    userId: input.userId,
    walletAddress: input.walletAddress,
    bypassCache: true,
  });
  const bySlug = new Map(
    verifiedCards.map((item) => [item.card.slug, item])
  );

  const cardsToLock: LockedVaultCardManifest[] = [];
  for (const [slug, qty] of copyCountBySlug.entries()) {
    const owned = bySlug.get(slug);
    if (!owned || owned.walletQuantity < qty) {
      throw AppError.conflict(
        `Kartu '${slug}' di dompet Solana tidak mencukupi untuk dikunci ke Vault.`
      );
    }

    if (owned.tokenStandard === "MPL_CORE") {
      const assets = owned.mintOrAssetAddresses.slice(0, qty);
      if (assets.length < qty) {
        throw AppError.conflict(
          `Aset NFT '${slug}' di dompet Solana tidak mencukupi untuk dikunci ke Vault.`
        );
      }
      for (const assetAddress of assets) {
        cardsToLock.push({
          cardSlug: slug,
          mintOrAsset: assetAddress,
          tokenStandard: "MPL_CORE",
          quantity: 1,
          collectionAddress: owned.card.collectionAddress,
        });
      }
    } else if (owned.card.mintAddress) {
      cardsToLock.push({
        cardSlug: slug,
        mintOrAsset: owned.card.mintAddress,
        tokenStandard: "TOKEN_2022",
        quantity: qty,
      });
    }
  }

  return cardsToLock;
}

export async function prepareBattleVaultLock(input: {
  matchId: string;
  userId: string;
}): Promise<{
  matchId: string;
  vaultPda: string;
  cardCount: number;
  alreadyLocked: boolean;
  serializedTransactions: string[];
}> {
  if (!isPrismaDriverEnabled()) {
    throw AppError.badRequest(
      "Vault transaksi on-chain membutuhkan driver database Prisma."
    );
  }

  const battle = await prisma.battleSession.findFirst({
    where: {
      id: input.matchId,
      OR: [{ userId: input.userId }, { opponentUserId: input.userId }],
    },
    include: {
      user: { select: { walletAddress: true } },
      opponentUser: { select: { walletAddress: true } },
    },
  });

  if (!battle || !battle.isQuickMatch) {
    throw AppError.notFound(
      "Sesi PvP / League tidak ditemukan untuk penguncian vault."
    );
  }

  const playerAWallet = battle.user.walletAddress;
  const playerBWallet = battle.opponentUser?.walletAddress ?? null;
  const isPlayerOne = battle.userId === input.userId;
  const side: VaultBattleSide = isPlayerOne ? "PLAYER" : "OPPONENT";
  const playerWallet = isPlayerOne ? playerAWallet : playerBWallet;

  if (!playerWallet || !playerAWallet || !playerBWallet) {
    throw AppError.badRequest(
      "Dompet Solana kedua pemain harus terhubung untuk mengunci kartu ke Battle Vault."
    );
  }

  const existingLockSig = isPlayerOne
    ? battle.playerLockTxSignature
    : battle.opponentLockTxSignature;

  const vaultInit = await ensureBattleVaultInitializedOnChain({
    matchId: battle.id,
    playerAWallet,
    playerBWallet,
  });

  if (existingLockSig) {
    const eventsState = extractVaultEventsState(battle.eventsJson);
    const lockedCount = (eventsState.lockedBySide[side] ?? []).reduce(
      (sum, card) => sum + card.quantity,
      0
    );
    return {
      matchId: battle.id,
      vaultPda: vaultInit.vaultPda,
      cardCount: lockedCount,
      alreadyLocked: true,
      serializedTransactions: [],
    };
  }

  // If the player previously prepared and already submitted lock txs on-chain before /confirm ran,
  // auto-verify and mark them locked (or build tx only for remaining undeposited cards) so they aren't stuck.
  const priorEventsState = extractVaultEventsState(battle.eventsJson);
  const priorPrepared = priorEventsState.preparedBySide[side];
  if (priorPrepared && priorPrepared.length > 0) {
    const onChainCheck = await verifyPlayerVaultDepositsOnChain({
      matchId: battle.id,
      playerWallet,
      expectedCards: priorPrepared,
    }).catch(() => ({
      verified: false,
      missingMints: [] as string[],
      depositedAmounts: {} as Record<string, number>,
      depositedCount: 0,
    }));

    if (onChainCheck.verified) {
      await recordPlayerVaultLockedInDb({
        matchId: battle.id,
        userId: input.userId,
        side,
        isPlayerOne,
        walletAddress: playerWallet,
        vaultPda: vaultInit.vaultPda,
        txSignatures: ["onchain-verified"],
        cards: priorPrepared,
      });
      return {
        matchId: battle.id,
        vaultPda: vaultInit.vaultPda,
        cardCount: priorPrepared.reduce((sum, c) => sum + c.quantity, 0),
        alreadyLocked: true,
        serializedTransactions: [],
      };
    }

    if (onChainCheck.depositedCount > 0) {
      const remainingCards = computeRemainingCardsToLock(
        priorPrepared,
        onChainCheck.depositedAmounts
      );
      if (remainingCards.length > 0) {
        const prepared = await buildChunkedLockDeckTransactions({
          matchId: battle.id,
          playerWallet,
          cards: remainingCards,
        });
        return {
          matchId: battle.id,
          vaultPda: prepared.vaultPda,
          cardCount: remainingCards.reduce((sum, card) => sum + card.quantity, 0),
          alreadyLocked: false,
          serializedTransactions: prepared.serializedTransactions,
        };
      }
    }
  }

  const deckSlugsRaw = isPlayerOne
    ? battle.playerDeckCardSlugsJson
    : battle.opponentDeckCardSlugsJson;
  const deckSlugs: string[] = deckSlugsRaw ? JSON.parse(deckSlugsRaw) : [];

  const cardsToLock = await resolveDeckManifestForWallet({
    userId: input.userId,
    walletAddress: playerWallet,
    deckSlugs,
  });

  if (cardsToLock.length === 0) {
    throw AppError.badRequest(
      "Belum ada kartu ter-tokenisasi pada deck ini untuk dikunci ke Vault."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT "id" FROM "battle_sessions" WHERE "id" = ${battle.id} FOR UPDATE`
    );
    const fresh = await tx.battleSession.findUnique({
      where: { id: battle.id },
      select: { eventsJson: true, vaultPda: true },
    });
    if (!fresh) return;
    const updatedEvents = appendAuditEvent(fresh.eventsJson, {
      type: "VAULT_LOCK_PREPARED",
      side,
      actorUserId: input.userId,
      walletAddress: playerWallet,
      vaultPda: vaultInit.vaultPda,
      cards: cardsToLock,
      at: new Date().toISOString(),
    });
    await tx.battleSession.update({
      where: { id: battle.id },
      data: {
        vaultPda: fresh.vaultPda ?? vaultInit.vaultPda,
        eventsJson: updatedEvents,
      },
    });
  });

  const prepared = await buildChunkedLockDeckTransactions({
    matchId: battle.id,
    playerWallet,
    cards: cardsToLock,
  });

  return {
    matchId: battle.id,
    vaultPda: prepared.vaultPda,
    cardCount: cardsToLock.reduce((sum, card) => sum + card.quantity, 0),
    alreadyLocked: false,
    serializedTransactions: prepared.serializedTransactions,
  };
}

async function recordPlayerVaultLockedInDb(input: {
  matchId: string;
  userId: string;
  side: VaultBattleSide;
  isPlayerOne: boolean;
  walletAddress: string;
  vaultPda: string;
  txSignatures: string[];
  cards: LockedVaultCardManifest[];
}): Promise<{ bothLocked: boolean }> {
  const primarySignature = input.txSignatures[0] ?? "onchain-verified";
  const now = new Date();

  const bothLocked = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT "id" FROM "battle_sessions" WHERE "id" = ${input.matchId} FOR UPDATE`
    );
    const fresh = await tx.battleSession.findUnique({
      where: { id: input.matchId },
      select: {
        eventsJson: true,
        playerLockTxSignature: true,
        opponentLockTxSignature: true,
      },
    });
    if (!fresh) {
      throw AppError.notFound("Sesi PvP / League tidak ditemukan.");
    }

    const updatedEvents = appendAuditEvent(fresh.eventsJson, {
      type: "VAULT_LOCKED",
      side: input.side,
      actorUserId: input.userId,
      walletAddress: input.walletAddress,
      vaultPda: input.vaultPda,
      txSignatures: input.txSignatures,
      cards: input.cards,
      at: now.toISOString(),
    });

    const nextPlayerLocked = input.isPlayerOne
      ? primarySignature
      : fresh.playerLockTxSignature;
    const nextOpponentLocked = !input.isPlayerOne
      ? primarySignature
      : fresh.opponentLockTxSignature;
    const allLocked = Boolean(nextPlayerLocked && nextOpponentLocked);

    await tx.battleSession.update({
      where: { id: input.matchId },
      data: {
        vaultPda: input.vaultPda,
        eventsJson: updatedEvents,
        ...(input.isPlayerOne
          ? { playerLockTxSignature: primarySignature, lastSeenAt: now }
          : {
              opponentLockTxSignature: primarySignature,
              opponentLastSeenAt: now,
            }),
        ...(allLocked
          ? {
              lastSeenAt: now,
              opponentLastSeenAt: now,
              disconnectedAt: null,
              opponentDisconnectedAt: null,
              reconnectDeadlineAt: null,
              opponentReconnectDeadlineAt: null,
              turnDeadlineAt: new Date(now.getTime() + 5 * 60_000),
            }
          : {}),
      },
    });

    const coreAssets = input.cards
      .filter((card) => card.tokenStandard === "MPL_CORE")
      .map((card) => card.mintOrAsset);
    if (coreAssets.length > 0) {
      await tx.cardNftInstance.updateMany({
        where: { assetAddress: { in: coreAssets } },
        data: { status: "IN_VAULT" },
      });
    }

    return allLocked;
  });

  invalidateWalletAssetCache(input.walletAddress);
  return { bothLocked };
}

export async function confirmBattleVaultLock(input: {
  matchId: string;
  userId: string;
  txSignatures: string[];
}): Promise<{
  matchId: string;
  vaultPda: string;
  txSignatures: string[];
  primaryTxSignature: string;
  explorerUrls: string[];
  bothLocked: boolean;
}> {
  if (!isPrismaDriverEnabled()) {
    throw AppError.badRequest(
      "Konfirmasi vault on-chain membutuhkan driver database Prisma."
    );
  }

  const battle = await prisma.battleSession.findFirst({
    where: {
      id: input.matchId,
      OR: [{ userId: input.userId }, { opponentUserId: input.userId }],
    },
    include: {
      user: { select: { walletAddress: true } },
      opponentUser: { select: { walletAddress: true } },
    },
  });

  if (!battle || !battle.isQuickMatch) {
    throw AppError.notFound("Sesi PvP / League tidak ditemukan.");
  }

  const isPlayerOne = battle.userId === input.userId;
  const side: VaultBattleSide = isPlayerOne ? "PLAYER" : "OPPONENT";
  const playerWallet = isPlayerOne
    ? battle.user.walletAddress
    : battle.opponentUser?.walletAddress;

  if (!playerWallet) {
    throw AppError.badRequest(
      "Dompet Solana Anda belum terhubung pada sesi ini."
    );
  }

  const [vaultPdaKey] = await deriveBattleVaultPda(battle.id);
  const vaultPda = vaultPdaKey.toBase58();

  if (input.txSignatures.length === 0) {
    throw AppError.badRequest(
      "Signature transaksi penguncian vault wajib disertakan."
    );
  }

  const eventsState = extractVaultEventsState(battle.eventsJson);
  let expectedCards =
    eventsState.preparedBySide[side] ?? eventsState.lockedBySide[side] ?? [];

  if (expectedCards.length === 0) {
    const deckSlugsRaw = isPlayerOne
      ? battle.playerDeckCardSlugsJson
      : battle.opponentDeckCardSlugsJson;
    const deckSlugs: string[] = deckSlugsRaw ? JSON.parse(deckSlugsRaw) : [];
    const copyCountBySlug = new Map<string, number>();
    for (const slug of deckSlugs) {
      copyCountBySlug.set(slug, (copyCountBySlug.get(slug) ?? 0) + 1);
    }
    const cards = await prisma.card.findMany({
      where: { slug: { in: [...copyCountBySlug.keys()] } },
      select: {
        id: true,
        slug: true,
        mintAddress: true,
        tokenStandard: true,
        collectionAddress: true,
      },
    });
    const cardsBySlug = new Map(cards.map((c) => [c.slug, c]));
    const reconstructed: LockedVaultCardManifest[] = [];
    for (const [slug, qty] of copyCountBySlug.entries()) {
      const card = cardsBySlug.get(slug);
      if (card?.tokenStandard === "TOKEN_2022" && card.mintAddress) {
        reconstructed.push({
          cardSlug: slug,
          mintOrAsset: card.mintAddress,
          tokenStandard: "TOKEN_2022",
          quantity: qty,
        });
      }
    }
    expectedCards = reconstructed;
  }

  if (expectedCards.length === 0) {
    throw AppError.badRequest(
      "Data kartu untuk penguncian vault tidak ditemukan. Silakan prepare ulang."
    );
  }

  const depositCheck = await verifyPlayerVaultDepositsOnChain({
    matchId: battle.id,
    playerWallet,
    expectedCards,
  });
  if (!depositCheck.verified) {
    throw AppError.badRequest(
      "Deposit kartu on-chain di Battle Vault belum lengkap atau belum terkonfirmasi."
    );
  }

  const primarySignature = input.txSignatures[0];
  const { bothLocked } = await recordPlayerVaultLockedInDb({
    matchId: battle.id,
    userId: input.userId,
    side,
    isPlayerOne,
    walletAddress: playerWallet,
    vaultPda,
    txSignatures: input.txSignatures,
    cards: expectedCards,
  });

  return {
    matchId: battle.id,
    vaultPda,
    txSignatures: input.txSignatures,
    primaryTxSignature: primarySignature,
    explorerUrls: input.txSignatures.map((sig) => getSolanaExplorerTxUrl(sig)),
    bothLocked,
  };
}

export async function settleCompletedBattleVaultOnChain(input: {
  matchId: string;
}): Promise<void> {
  if (!isPrismaDriverEnabled()) return;

  const existingPromise = inFlightSettlements.get(input.matchId);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const runPromise = (async () => {
    try {
      const battle = await prisma.battleSession.findUnique({
        where: { id: input.matchId },
        include: {
          user: { select: { walletAddress: true } },
          opponentUser: { select: { walletAddress: true } },
        },
      });

      if (!battle || !battle.isQuickMatch || !battle.vaultPda) return;
      if (battle.settleTxSignature) return;

      const playerAWallet = battle.user.walletAddress;
      const playerBWallet = battle.opponentUser?.walletAddress;
      if (!playerAWallet || !playerBWallet) return;

      const eventsState = extractVaultEventsState(battle.eventsJson);
      const lockedPlayerACards = eventsState.lockedBySide.PLAYER ?? [];
      const lockedPlayerBCards = eventsState.lockedBySide.OPPONENT ?? [];
      const refundablePlayerACards = eventsState.allCardsBySide.PLAYER ?? [];
      const refundablePlayerBCards = eventsState.allCardsBySide.OPPONENT ?? [];

      if (
        refundablePlayerACards.length === 0 &&
        refundablePlayerBCards.length === 0
      ) {
        if (battle.status !== "ACTIVE") {
          await prisma.battleSession.updateMany({
            where: { id: battle.id, settleTxSignature: null },
            data: { settleTxSignature: "no-vault-deposits" },
          });
        }
        return;
      }

      const parsedState = JSON.parse(battle.stateJson) as {
        winner?: "PLAYER" | "BOT" | null;
      };
      const winnerSide = parsedState.winner ?? null;
      const bothPlayersLocked =
        lockedPlayerACards.length > 0 && lockedPlayerBCards.length > 0;

      // If match was abandoned/drawn or ended before both players locked,
      // mark draw and release any locked OR prepared-and-deposited cards back to their original owner(s).
      if (
        battle.status === "ABANDONED" ||
        !winnerSide ||
        !bothPlayersLocked
      ) {
        const drawResult = await settleBattleDrawOnChain({
          matchId: battle.id,
          playerAWallet,
          playerBWallet,
          playerACards: refundablePlayerACards,
          playerBCards: refundablePlayerBCards,
        });
        if (!drawResult.settledOnChain) {
          if (
            drawResult.reason === "BATTLE_VAULT_NOT_INITIALIZED" &&
            battle.status !== "ACTIVE"
          ) {
            await prisma.battleSession.updateMany({
              where: { id: battle.id, settleTxSignature: null },
              data: { settleTxSignature: "vault-not-initialized" },
            });
          }
          logServerEvent("warn", "battle.vault.draw_settlement_skipped", {
            matchId: battle.id,
            reason: drawResult.reason ?? "UNKNOWN",
          });
          return;
        }

        const allCoreAssets = [
          ...refundablePlayerACards,
          ...refundablePlayerBCards,
        ]
          .filter((card) => card.tokenStandard === "MPL_CORE")
          .map((card) => card.mintOrAsset);

        await prisma.$transaction(async (tx) => {
          await tx.battleSession.updateMany({
            where: { id: battle.id, settleTxSignature: null },
            data: { settleTxSignature: drawResult.settleTxSignature },
          });
          if (allCoreAssets.length > 0) {
            await tx.cardNftInstance.updateMany({
              where: { assetAddress: { in: allCoreAssets } },
              data: { status: "ACTIVE" },
            });
          }
        });

        invalidateWalletAssetCache(playerAWallet);
        invalidateWalletAssetCache(playerBWallet);
        logServerEvent("info", "battle.vault.draw_settled", {
          matchId: battle.id,
          settleTxSignature: drawResult.settleTxSignature,
        });
        return;
      }

      const playerOneWon = winnerSide === "PLAYER";
      const winnerWallet = playerOneWon ? playerAWallet : playerBWallet;
      const loserWallet = playerOneWon ? playerBWallet : playerAWallet;
      const winnerCards = playerOneWon
        ? lockedPlayerACards
        : lockedPlayerBCards;
      const loserCards = playerOneWon
        ? lockedPlayerBCards
        : lockedPlayerACards;

      const rewardCard =
        (battle.rewardCardSlug
          ? loserCards.find((card) => card.cardSlug === battle.rewardCardSlug)
          : undefined) ?? pickRandomLockedRewardCard(loserCards);

      if (!rewardCard) return;

      const winResult = await settleBattleWinOnChain({
        matchId: battle.id,
        winnerWallet,
        loserWallet,
        rewardCard,
        winnerCards,
        loserRemainingCards: loserCards,
      });

      if (!winResult.settledOnChain) {
        logServerEvent("warn", "battle.vault.win_settlement_skipped", {
          matchId: battle.id,
          reason: winResult.reason ?? "UNKNOWN",
        });
        return;
      }

      const coreAssetsToRestore = [...winnerCards, ...loserCards]
        .filter(
          (card) =>
            card.tokenStandard === "MPL_CORE" &&
            !(
              rewardCard.tokenStandard === "MPL_CORE" &&
              card.mintOrAsset === rewardCard.mintOrAsset
            )
        )
        .map((card) => card.mintOrAsset);

      await prisma.$transaction(async (tx) => {
        await tx.battleSession.updateMany({
          where: { id: battle.id, settleTxSignature: null },
          data: {
            settleTxSignature: winResult.settleTxSignature,
            rewardCardSlug: battle.rewardCardSlug ?? rewardCard.cardSlug,
          },
        });
        if (rewardCard.tokenStandard === "MPL_CORE") {
          await tx.cardNftInstance.updateMany({
            where: { assetAddress: rewardCard.mintOrAsset },
            data: {
              ownerWallet: winnerWallet,
              status: "ACTIVE",
            },
          });
        }
        if (coreAssetsToRestore.length > 0) {
          await tx.cardNftInstance.updateMany({
            where: { assetAddress: { in: coreAssetsToRestore } },
            data: { status: "ACTIVE" },
          });
        }
      });

      invalidateWalletAssetCache(winnerWallet);
      invalidateWalletAssetCache(loserWallet);
      logServerEvent("info", "battle.vault.win_settled", {
        matchId: battle.id,
        winnerWallet,
        loserWallet,
        rewardCardSlug: rewardCard.cardSlug,
        rewardMintOrAsset: rewardCard.mintOrAsset,
        settleTxSignature: winResult.settleTxSignature,
      });
    } catch (error: unknown) {
      logServerEvent("error", "battle.vault.settlement_failed", {
        matchId: input.matchId,
        errorName: error instanceof Error ? error.name : "UnknownError",
        message:
          error instanceof Error
            ? error.message
            : "Unknown battle vault settlement error",
      });
    } finally {
      inFlightSettlements.delete(input.matchId);
    }
  })();

  inFlightSettlements.set(input.matchId, runPromise);
  await runPromise;
}

export async function reconcileUnsettledUserBattleVaults(
  userId: string
): Promise<number> {
  if (!isPrismaDriverEnabled()) return 0;

  const cleanUntil = reconcileCleanUntilByUser.get(userId);
  if (cleanUntil && cleanUntil > Date.now()) {
    return 0;
  }

  const existing = inFlightUserReconciliations.get(userId);
  if (existing) {
    return existing;
  }

  const runPromise = (async (): Promise<number> => {
    try {
      const now = new Date();
      const stalePreLockSessions = await prisma.battleSession.findMany({
        where: {
          isQuickMatch: true,
          status: "ACTIVE",
          vaultPda: { not: null },
          OR: [
            { playerLockTxSignature: null },
            { opponentLockTxSignature: null },
          ],
          AND: [
            {
              OR: [{ userId }, { opponentUserId: userId }],
            },
          ],
        },
        select: {
          id: true,
          sequence: true,
          eventsJson: true,
          rulesVersion: true,
          lastSeenAt: true,
          opponentLastSeenAt: true,
          createdAt: true,
          reconnectDeadlineAt: true,
          opponentReconnectDeadlineAt: true,
          turnDeadlineAt: true,
        },
        take: 10,
      });

      for (const row of stalePreLockSessions) {
        const graceCutoffMs =
          row.rulesVersion === "league-v1" ? 180_000 : 75_000;
        const isExpired =
          Boolean(
            row.turnDeadlineAt && row.turnDeadlineAt.getTime() <= now.getTime()
          ) ||
          Boolean(
            row.reconnectDeadlineAt &&
              row.reconnectDeadlineAt.getTime() <= now.getTime()
          ) ||
          Boolean(
            row.opponentReconnectDeadlineAt &&
              row.opponentReconnectDeadlineAt.getTime() <= now.getTime()
          ) ||
          row.lastSeenAt.getTime() + graceCutoffMs <= now.getTime() ||
          (row.opponentLastSeenAt ?? row.createdAt).getTime() + graceCutoffMs <=
            now.getTime();

        if (!isExpired) continue;

        await prisma.battleSession.updateMany({
          where: {
            id: row.id,
            status: "ACTIVE",
            sequence: row.sequence,
          },
          data: {
            sequence: { increment: 1 },
            eventsJson: appendAuditEvent(row.eventsJson, {
              type: "PRE_LOCK_TIMEOUT",
              cause: "VAULT_RECONCILE_EXPIRED",
              at: now.toISOString(),
            }),
            status: "ABANDONED",
            turnDeadlineAt: null,
            updatedAt: now,
          },
        });
      }

      const unsettled = await prisma.battleSession.findMany({
        where: {
          isQuickMatch: true,
          status: { in: ["ABANDONED", "COMPLETED"] },
          vaultPda: { not: null },
          settleTxSignature: null,
          OR: [{ userId }, { opponentUserId: userId }],
        },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });

      if (unsettled.length === 0) {
        reconcileCleanUntilByUser.set(
          userId,
          Date.now() + RECONCILE_CLEAN_COOLDOWN_MS
        );
        return 0;
      }

      for (const row of unsettled) {
        await settleCompletedBattleVaultOnChain({ matchId: row.id });
      }
      return unsettled.length;
    } catch (error: unknown) {
      logServerEvent("warn", "battle.vault.reconcile_failed", {
        userId,
        message:
          error instanceof Error
            ? error.message
            : "Unknown battle vault reconcile error",
      });
      return 0;
    } finally {
      inFlightUserReconciliations.delete(userId);
    }
  })();

  inFlightUserReconciliations.set(userId, runPromise);
  return runPromise;
}
