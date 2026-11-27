import { randomUUID } from "node:crypto";
import { Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  deriveBattleVaultPda,
  sortSolanaRpcEndpoints,
  toVaultMatchId,
} from "@/server/modules/solana/solana-config";
import { parseVaultDepositAccountData } from "@/server/modules/solana/battle-vault-settlement.service";
import {
  computeRemainingCardsToLock,
  extractVaultEventsState,
  pickRandomLockedRewardCard,
  type LockedVaultCardManifest,
} from "@/server/modules/solana/battle-vault-orchestrator.service";

describe("On-Chain Battle Vault Helpers", () => {
  it("normalizes 36-char UUIDs and long IDs into <=32-byte deterministic PDA seeds", async () => {
    const uuid = randomUUID();
    expect(Buffer.byteLength(uuid, "utf8")).toBe(36);

    const compact = toVaultMatchId(uuid);
    expect(Buffer.byteLength(compact, "utf8")).toBe(32);
    expect(compact).toBe(uuid.replace(/-/g, ""));
    expect(toVaultMatchId(uuid)).toBe(compact);

    const [pda, bump] = await deriveBattleVaultPda(uuid);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);

    const longId = "league-match-very-long-identifier-exceeding-thirty-two-bytes-123456";
    const hashed = toVaultMatchId(longId);
    expect(Buffer.byteLength(hashed, "utf8")).toBe(32);
    expect(toVaultMatchId(longId)).toBe(hashed);

    const [longPda] = await deriveBattleVaultPda(longId);
    expect(longPda).toBeInstanceOf(PublicKey);
  });

  it("decodes a synthetic 114-byte VaultDeposit account buffer accurately", async () => {
    const battleVault = (await Keypair.generate()).publicKey;
    const owner = (await Keypair.generate()).publicKey;
    const mint = (await Keypair.generate()).publicKey;
    const amount = BigInt(3);
    const isCoreNft = true;
    const bump = 251;

    const buf = Buffer.alloc(114);
    buf.fill(0xaa, 0, 8); // Anchor discriminator
    Buffer.from(battleVault.toBytes()).copy(buf, 8);
    Buffer.from(owner.toBytes()).copy(buf, 40);
    Buffer.from(mint.toBytes()).copy(buf, 72);
    buf.writeBigUInt64LE(amount, 104);
    buf[112] = isCoreNft ? 1 : 0;
    buf[113] = bump;

    const parsed = parseVaultDepositAccountData(buf);
    expect(parsed).not.toBeNull();
    expect(parsed?.battleVault).toBe(battleVault.toBase58());
    expect(parsed?.owner).toBe(owner.toBase58());
    expect(parsed?.mint).toBe(mint.toBase58());
    expect(parsed?.amount).toBe(BigInt(3));
    expect(parsed?.isCoreNft).toBe(true);
    expect(parsed?.bump).toBe(251);

    expect(parseVaultDepositAccountData(Buffer.alloc(113))).toBeNull();
  });

  it("extracts prepared/locked manifests from eventsJson and picks weighted reward cards", async () => {
    const playerCards: LockedVaultCardManifest[] = [
      {
        cardSlug: "hayam-wuruk",
        mintOrAsset: (await Keypair.generate()).publicKey.toBase58(),
        tokenStandard: "TOKEN_2022",
        quantity: 2,
      },
      {
        cardSlug: "gajah-mada-rare",
        mintOrAsset: (await Keypair.generate()).publicKey.toBase58(),
        tokenStandard: "MPL_CORE",
        quantity: 1,
        collectionAddress: (await Keypair.generate()).publicKey.toBase58(),
      },
    ];
    const opponentCards: LockedVaultCardManifest[] = [
      {
        cardSlug: "prabu-siliwangi",
        mintOrAsset: (await Keypair.generate()).publicKey.toBase58(),
        tokenStandard: "TOKEN_2022",
        quantity: 3,
      },
    ];

    const eventsJson = JSON.stringify([
      { sequence: 0, type: "RNG_COMMITMENT", commitment: "abc" },
      { type: "VAULT_LOCK_PREPARED", side: "PLAYER", cards: playerCards },
      { type: "VAULT_LOCKED", side: "PLAYER", cards: playerCards },
      { type: "VAULT_LOCKED", side: "OPPONENT", cards: opponentCards },
    ]);

    const state = extractVaultEventsState(eventsJson);
    expect(state.preparedBySide.PLAYER).toHaveLength(2);
    expect(state.lockedBySide.PLAYER).toHaveLength(2);
    expect(state.lockedBySide.OPPONENT).toHaveLength(1);
    expect(state.lockedBySide.OPPONENT?.[0]?.cardSlug).toBe("prabu-siliwangi");

    const picked = pickRandomLockedRewardCard(opponentCards);
    expect(picked?.cardSlug).toBe("prabu-siliwangi");
    expect(pickRandomLockedRewardCard([])).toBeNull();
  });

  it("retains VAULT_LOCK_PREPARED manifests in allCardsBySide and deduplicates by mintOrAsset", async () => {
    const mintA = (await Keypair.generate()).publicKey.toBase58();
    const assetB = (await Keypair.generate()).publicKey.toBase58();
    const preparedFirst: LockedVaultCardManifest[] = [
      {
        cardSlug: "hayam-wuruk",
        mintOrAsset: mintA,
        tokenStandard: "TOKEN_2022",
        quantity: 2,
      },
    ];
    const preparedRetry: LockedVaultCardManifest[] = [
      {
        cardSlug: "hayam-wuruk",
        mintOrAsset: mintA,
        tokenStandard: "TOKEN_2022",
        quantity: 2,
      },
      {
        cardSlug: "gajah-mada-rare",
        mintOrAsset: assetB,
        tokenStandard: "MPL_CORE",
        quantity: 1,
      },
    ];

    const eventsJson = JSON.stringify([
      { type: "VAULT_LOCK_PREPARED", side: "PLAYER", cards: preparedFirst },
      { type: "VAULT_LOCK_PREPARED", side: "PLAYER", cards: preparedRetry },
    ]);

    const state = extractVaultEventsState(eventsJson);
    expect(state.lockedBySide.PLAYER).toBeUndefined();
    expect(state.allCardsBySide.PLAYER).toHaveLength(2);
    expect(state.allCardsBySide.PLAYER?.find((c) => c.mintOrAsset === mintA)?.quantity).toBe(2);
    expect(state.allCardsBySide.PLAYER?.find((c) => c.mintOrAsset === assetB)?.quantity).toBe(1);
  });

  it("computes remaining cards to lock for zero, partial, and complete deposits", async () => {
    const mintA = (await Keypair.generate()).publicKey.toBase58();
    const assetB = (await Keypair.generate()).publicKey.toBase58();
    const prepared: LockedVaultCardManifest[] = [
      {
        cardSlug: "hayam-wuruk",
        mintOrAsset: mintA,
        tokenStandard: "TOKEN_2022",
        quantity: 3,
      },
      {
        cardSlug: "gajah-mada-rare",
        mintOrAsset: assetB,
        tokenStandard: "MPL_CORE",
        quantity: 1,
      },
    ];

    expect(computeRemainingCardsToLock(prepared, {})).toEqual(prepared);

    const afterPartial = computeRemainingCardsToLock(prepared, {
      [mintA]: 2,
      [assetB]: 1,
    });
    expect(afterPartial).toEqual([
      {
        cardSlug: "hayam-wuruk",
        mintOrAsset: mintA,
        tokenStandard: "TOKEN_2022",
        quantity: 1,
      },
    ]);

    expect(
      computeRemainingCardsToLock(prepared, {
        [mintA]: 3,
        [assetB]: 1,
      })
    ).toEqual([]);
  });

  it("prioritizes dedicated RPC endpoints ahead of public Solana RPC on equal priority", () => {
    const sorted = sortSolanaRpcEndpoints([
      {
        url: "https://api.devnet.solana.com",
        priority: 0,
        createdAt: "2026-11-20T00:00:00.000Z",
      },
      {
        url: "https://solana-devnet.g.alchemy.com/v2/demo-key",
        priority: 0,
        createdAt: "2026-11-20T00:01:00.000Z",
      },
      {
        url: "https://devnet.helius-rpc.com/?api-key=demo-key",
        priority: 0,
        createdAt: "2026-11-20T00:02:00.000Z",
      },
    ]);

    expect(sorted).toEqual([
      "https://solana-devnet.g.alchemy.com/v2/demo-key",
      "https://devnet.helius-rpc.com/?api-key=demo-key",
      "https://api.devnet.solana.com",
    ]);

    const explicitPriority = sortSolanaRpcEndpoints([
      {
        url: "https://api.devnet.solana.com",
        priority: 0,
        createdAt: "2026-11-20T00:00:00.000Z",
      },
      {
        url: "https://solana-devnet.g.alchemy.com/v2/demo-key",
        priority: 2,
        createdAt: "2026-11-20T00:01:00.000Z",
      },
    ]);

    expect(explicitPriority).toEqual([
      "https://api.devnet.solana.com",
      "https://solana-devnet.g.alchemy.com/v2/demo-key",
    ]);
  });
});
