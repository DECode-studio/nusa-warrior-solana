import "server-only";
import { PublicKey } from "@solana/web3.js";
import { cardRepository } from "@/server/modules/card/infrastructure/card.repository.impl";
import type { StoredCardRecord } from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  MPL_CORE_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  executeWithSolanaConnection,
} from "./solana-config";

export interface WalletCardAssetSummary {
  card: StoredCardRecord;
  quantity: number;
  walletQuantity: number;
  inVaultQuantity: number;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  mintOrAssetAddresses: string[];
}

interface CacheEntry {
  expiresAt: number;
  assets: WalletCardAssetSummary[];
}

const WALLET_CACHE_TTL_MS = 45_000;
const walletAssetCache = new Map<string, CacheEntry>();
const inFlightWalletReads = new Map<
  string,
  Promise<WalletCardAssetSummary[]>
>();

export function invalidateWalletAssetCache(walletAddress?: string): void {
  if (walletAddress) {
    walletAssetCache.delete(walletAddress);
    return;
  }
  walletAssetCache.clear();
}

async function fetchToken2022Balances(
  owner: PublicKey
): Promise<Map<string, number>> {
  const response = await executeWithSolanaConnection((connection) =>
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_2022_PROGRAM_ID,
    })
  );

  const balances = new Map<string, number>();
  for (const item of response.value) {
    const parsedInfo = (
      item.account.data as {
        parsed?: {
          info?: {
            mint?: string;
            tokenAmount?: { uiAmount?: number | null; amount?: string };
          };
        };
      }
    )?.parsed?.info;

    const mint = parsedInfo?.mint;
    const rawAmount = parsedInfo?.tokenAmount?.amount;
    if (!mint || !rawAmount) continue;

    const qty = Number.parseInt(rawAmount, 10);
    if (Number.isFinite(qty) && qty > 0) {
      balances.set(mint, (balances.get(mint) ?? 0) + qty);
    }
  }
  return balances;
}

async function fetchMetaplexCoreAssets(
  ownerAddress: string
): Promise<string[]> {
  if (!isPrismaDriverEnabled()) return [];

  // Query known Metaplex Core NFT instances from registry, then verify
  // true on-chain ownership via lightweight getMultipleAccountsInfo (avoids
  // heavy getProgramAccounts scans that trigger 429 on public Devnet RPC).
  const candidateInstances = await prisma.cardNftInstance.findMany({
    where: {
      ownerWallet: ownerAddress,
      status: { in: ["ACTIVE", "IN_VAULT"] },
    },
    select: { assetAddress: true },
    take: 100,
  });

  if (candidateInstances.length === 0) return [];

  const ownerBytes = Buffer.from(new PublicKey(ownerAddress).toBytes());
  const pubkeys = candidateInstances.map(
    (item) => new PublicKey(item.assetAddress)
  );

  const accountInfos = await executeWithSolanaConnection((connection) =>
    connection.getMultipleAccountsInfo(pubkeys, "confirmed")
  );

  const verifiedAssets: string[] = [];
  for (let i = 0; i < accountInfos.length; i += 1) {
    const info = accountInfos[i];
    if (!info || info.data.length < 33) continue;
    if (!info.owner.equals(MPL_CORE_PROGRAM_ID)) continue;
    // Metaplex Core AssetV1: byte 0 = Key::AssetV1 (1), bytes 1..33 = owner Pubkey
    if (info.data[0] !== 1) continue;
    const onChainOwner = Buffer.from(info.data.subarray(1, 33));
    if (onChainOwner.equals(ownerBytes)) {
      verifiedAssets.push(candidateInstances[i].assetAddress);
    }
  }

  return verifiedAssets;
}

async function fetchActiveEscrowQuantities(
  userId: string
): Promise<Map<string, number>> {
  const quantities = new Map<string, number>();
  if (!isPrismaDriverEnabled()) return quantities;

  const openEscrows = await prisma.cardEscrow.findMany({
    where: { ownerUserId: userId, status: "OPEN" },
    include: { items: true },
  });

  for (const escrow of openEscrows) {
    for (const item of escrow.items) {
      quantities.set(
        item.cardId,
        (quantities.get(item.cardId) ?? 0) + item.quantity
      );
    }
  }
  return quantities;
}

/**
 * Reads Token-2022 and Metaplex Core card assets directly from the player's
 * Solana wallet (plus any cards currently locked in an active battle vault),
 * then verifies every mint/asset against the database Card registry.
 */
export async function getVerifiedWalletCards(input: {
  userId: string;
  walletAddress: string;
  bypassCache?: boolean;
}): Promise<WalletCardAssetSummary[]> {
  const cacheKey = `${input.userId}:${input.walletAddress}`;
  const cached = walletAssetCache.get(cacheKey);
  if (!input.bypassCache && cached && cached.expiresAt > Date.now()) {
    return cached.assets;
  }

  const existingInFlight = inFlightWalletReads.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const readPromise = (async (): Promise<WalletCardAssetSummary[]> => {
    try {
      const ownerPubkey = new PublicKey(input.walletAddress);
      const [token2022Balances, coreAssetAddresses, activeEscrows, allCards] =
        await Promise.all([
          fetchToken2022Balances(ownerPubkey),
          fetchMetaplexCoreAssets(input.walletAddress),
          fetchActiveEscrowQuantities(input.userId),
          cardRepository.findMany({ includeWithdrawn: false }),
        ]);

  const cardsById = new Map(allCards.map((card) => [card.id, card]));
  const cardsByMint = new Map<string, StoredCardRecord>();
  for (const card of allCards) {
    if (card.mintAddress) {
      cardsByMint.set(card.mintAddress, card);
    }
  }

  const verifiedCoreInstances = isPrismaDriverEnabled() && coreAssetAddresses.length > 0
    ? await prisma.cardNftInstance.findMany({
        where: {
          assetAddress: { in: coreAssetAddresses },
          status: { in: ["ACTIVE", "IN_VAULT"] },
        },
        select: { cardId: true, assetAddress: true, collectionAddress: true },
      })
    : [];

  const summaryByCardId = new Map<string, WalletCardAssetSummary>();

  const ensureEntry = (
    card: StoredCardRecord,
    tokenStandard: "TOKEN_2022" | "MPL_CORE"
  ): WalletCardAssetSummary => {
    const existing = summaryByCardId.get(card.id);
    if (existing) return existing;
    const created: WalletCardAssetSummary = {
      card,
      quantity: 0,
      walletQuantity: 0,
      inVaultQuantity: 0,
      tokenStandard,
      mintOrAssetAddresses: [],
    };
    summaryByCardId.set(card.id, created);
    return created;
  };

  // 1. Verify Token-2022 regular pack cards against DB mint registry
  for (const [mintAddress, qty] of token2022Balances.entries()) {
    const card = cardsByMint.get(mintAddress);
    if (!card) continue;
    const entry = ensureEntry(card, "TOKEN_2022");
    entry.walletQuantity += qty;
    entry.quantity += qty;
    entry.mintOrAssetAddresses.push(mintAddress);
  }

  // 2. Verify Metaplex Core 1/1 NFTs (Forge / Rare) against DB CardNftInstance / Card registry
  const matchedCoreSet = new Set<string>();
  for (const instance of verifiedCoreInstances) {
    const card = cardsById.get(instance.cardId);
    if (!card) continue;
    if (
      card.collectionAddress &&
      instance.collectionAddress &&
      card.collectionAddress !== instance.collectionAddress
    ) {
      continue;
    }
    matchedCoreSet.add(instance.assetAddress);
    const entry = ensureEntry(card, "MPL_CORE");
    entry.walletQuantity += 1;
    entry.quantity += 1;
    entry.mintOrAssetAddresses.push(instance.assetAddress);
  }

  // Fallback match if a single-edition MPL_CORE card was stored directly on Card.mintAddress
  for (const assetAddress of coreAssetAddresses) {
    if (matchedCoreSet.has(assetAddress)) continue;
    const card = cardsByMint.get(assetAddress);
    if (!card || card.tokenStandard !== "MPL_CORE") continue;
    const entry = ensureEntry(card, "MPL_CORE");
    entry.walletQuantity += 1;
    entry.quantity += 1;
    entry.mintOrAssetAddresses.push(assetAddress);
  }

  // 3. Include cards currently locked in an active battle vault so decks/collection stay intact
  for (const [cardId, inVaultQty] of activeEscrows.entries()) {
    const card = cardsById.get(cardId);
    if (!card || inVaultQty <= 0) continue;
    const entry = ensureEntry(
      card,
      card.tokenStandard === "MPL_CORE" ? "MPL_CORE" : "TOKEN_2022"
    );
    entry.inVaultQuantity += inVaultQty;
    entry.quantity += inVaultQty;
  }

      const assets = [...summaryByCardId.values()];
      walletAssetCache.set(cacheKey, {
        expiresAt: Date.now() + WALLET_CACHE_TTL_MS,
        assets,
      });

      return assets;
    } catch (error) {
      if (cached) {
        return cached.assets;
      }
      throw error;
    } finally {
      inFlightWalletReads.delete(cacheKey);
    }
  })();

  inFlightWalletReads.set(cacheKey, readPromise);
  return readPromise;
}
