import "server-only";
import { createHash } from "node:crypto";
import {
  type Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AppError } from "@/server/shared/errors/app-error";
import {
  MPL_CORE_PROGRAM_ID,
  NUSA_CARD_VAULT_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  deriveBattleVaultPda,
  deriveVaultAuthorityPda,
  deriveVaultConfigPda,
  deriveVaultDepositPda,
  executeWithSolanaConnection,
  getSolanaExplorerTxUrl,
  toVaultMatchId,
} from "./solana-config";
import {
  buildCreateBattleVaultInstruction,
  deriveAssociatedTokenAddress,
  getSettlerKeypairFromEnv,
  type VaultLockCardInput,
} from "./nusa-vault-tx-builder.service";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export type OnChainVaultStatus = "Active" | "SettledWin" | "SettledDraw" | "Cancelled";

export interface ParsedVaultDeposit {
  battleVault: string;
  owner: string;
  mint: string;
  amount: bigint;
  isCoreNft: boolean;
  bump: number;
}

function anchorDiscriminator(ixName: string): Buffer {
  return createHash("sha256")
    .update(`global:${ixName}`)
    .digest()
    .subarray(0, 8);
}

function encodeBorshString(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

async function confirmSignaturesHttp(
  signatures: string[],
  maxAttempts = 45,
  intervalMs = 800
): Promise<void> {
  const pending = new Set(signatures);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (pending.size === 0) return;
    const pendingList = [...pending];
    const response = await executeWithSolanaConnection((connection) =>
      connection.getSignatureStatuses(pendingList)
    );
    const statuses = response?.value ?? [];
    for (let i = 0; i < pendingList.length; i += 1) {
      const sig = pendingList[i];
      const status = statuses[i];
      if (status?.err) {
        throw new Error(
          `Transaksi Solana '${sig}' gagal: ${JSON.stringify(status.err)}`
        );
      }
      if (
        status?.confirmationStatus === "confirmed" ||
        status?.confirmationStatus === "finalized"
      ) {
        pending.delete(sig);
      }
    }
    if (pending.size === 0) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `Konfirmasi transaksi Solana timeout (${[...pending].join(", ")}).`
  );
}

async function sendAndConfirmTxHttp(
  tx: Transaction,
  signers: Keypair[]
): Promise<string> {
  if (signers.length === 0) {
    throw new Error("Minimal satu signer diperlukan untuk mengirim transaksi.");
  }

  const broadcastOnce = async (): Promise<string> => {
    const { blockhash } = await executeWithSolanaConnection((connection) =>
      connection.getLatestBlockhash("confirmed")
    );
    tx.feePayer = signers[0].publicKey;
    tx.recentBlockhash = blockhash;
    await tx.sign(...signers);
    const raw = await tx.serialize();
    return executeWithSolanaConnection((connection) =>
      connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: BigInt(3),
      })
    );
  };

  let signature: string;
  try {
    signature = await broadcastOnce();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes("Blockhash not found")) {
      throw error;
    }
    signature = await broadcastOnce();
  }

  await confirmSignaturesHttp([signature]);
  return signature;
}

export function parseVaultDepositAccountData(
  data: Buffer | Uint8Array
): ParsedVaultDeposit | null {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buf.length < 114) return null;
  const battleVault = new PublicKey(buf.subarray(8, 40)).toBase58();
  const owner = new PublicKey(buf.subarray(40, 72)).toBase58();
  const mint = new PublicKey(buf.subarray(72, 104)).toBase58();
  const amount = buf.readBigUInt64LE(104);
  const isCoreNft = buf[112] === 1;
  const bump = buf[113];
  return { battleVault, owner, mint, amount, isCoreNft, bump };
}

export function parseBattleVaultStatus(
  data: Buffer | Uint8Array
): OnChainVaultStatus | null {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buf.length < 12) return null;
  const matchIdLen = buf.readUInt32LE(8);
  const statusOffset = 12 + matchIdLen + 32 + 32;
  if (buf.length <= statusOffset) return null;
  const statusByte = buf[statusOffset];
  if (statusByte === 0) return "Active";
  if (statusByte === 1) return "SettledWin";
  if (statusByte === 2) return "SettledDraw";
  if (statusByte === 3) return "Cancelled";
  return null;
}

export interface VaultSettlementResult {
  settledOnChain: boolean;
  settleTxSignature: string | null;
  explorerUrl: string | null;
  reason?: string;
}

export async function ensureBattleVaultInitializedOnChain(input: {
  matchId: string;
  playerAWallet: string;
  playerBWallet: string;
  expiresAtUnix?: number;
}): Promise<{
  vaultPda: string;
  created: boolean;
  createTxSignature: string | null;
}> {
  const vaultMatchId = toVaultMatchId(input.matchId);
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const [configPda] = await deriveVaultConfigPda();
  const vaultPda = battleVaultPda.toBase58();

  const existingVault = await executeWithSolanaConnection((connection) =>
    connection.getAccountInfo(battleVaultPda, "confirmed")
  );
  if (existingVault) {
    return { vaultPda, created: false, createTxSignature: null };
  }

  const configAccount = await executeWithSolanaConnection((connection) =>
    connection.getAccountInfo(configPda, "confirmed")
  );
  if (!configAccount) {
    throw AppError.internal(
      "VaultConfig PDA belum diinisialisasi di Solana. Jalankan scripts/init-vault-config-devnet.mjs terlebih dahulu."
    );
  }

  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi untuk membuat Battle Vault."
    );
  }

  const ix = await buildCreateBattleVaultInstruction({
    payer: settler.publicKey,
    settler: settler.publicKey,
    matchId: vaultMatchId,
    playerA: new PublicKey(input.playerAWallet),
    playerB: new PublicKey(input.playerBWallet),
    expiresAtUnix: input.expiresAtUnix ?? Math.floor(Date.now() / 1000) + 7200,
  });

  const tx = new Transaction().add(ix);
  try {
    const createTxSignature = await sendAndConfirmTxHttp(tx, [settler]);
    return { vaultPda, created: true, createTxSignature };
  } catch (error: unknown) {
    // Handle concurrent /vault/prepare race where the other player initialized it first.
    const afterRace = await executeWithSolanaConnection((connection) =>
      connection.getAccountInfo(battleVaultPda, "confirmed")
    ).catch(() => null);
    if (afterRace) {
      return { vaultPda, created: false, createTxSignature: null };
    }
    throw error;
  }
}

export async function verifyVaultLockTransaction(input: {
  txSignature: string;
  expectedVaultPda: string;
  expectedSignerWallet: string;
}): Promise<boolean> {
  const tx = await executeWithSolanaConnection((connection) =>
    connection.getTransaction(input.txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    })
  );
  if (!tx || tx.meta?.err) return false;

  const accountKeys = tx.transaction.message
    .getAccountKeys()
    .staticAccountKeys.map((k) => k.toString());

  return (
    accountKeys.includes(NUSA_CARD_VAULT_PROGRAM_ID.toBase58()) &&
    accountKeys.includes(input.expectedVaultPda) &&
    accountKeys.includes(input.expectedSignerWallet)
  );
}

export async function verifyPlayerVaultDepositsOnChain(input: {
  matchId: string;
  playerWallet: string;
  expectedCards: VaultLockCardInput[];
}): Promise<{
  verified: boolean;
  missingMints: string[];
  depositedAmounts: Record<string, number>;
  depositedCount: number;
}> {
  if (input.expectedCards.length === 0) {
    return {
      verified: false,
      missingMints: [],
      depositedAmounts: {},
      depositedCount: 0,
    };
  }
  const vaultMatchId = toVaultMatchId(input.matchId);
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const playerPubkey = new PublicKey(input.playerWallet);
  const expectedVaultStr = battleVaultPda.toBase58();

  const depositPdas = await Promise.all(
    input.expectedCards.map((card) =>
      deriveVaultDepositPda(
        battleVaultPda,
        playerPubkey,
        new PublicKey(card.mintOrAsset)
      ).then(([pda]) => pda)
    )
  );

  const accountInfos = await executeWithSolanaConnection((connection) =>
    connection.getMultipleAccountsInfo(depositPdas, "confirmed")
  );

  const missingMints: string[] = [];
  const depositedAmounts: Record<string, number> = {};
  let depositedCount = 0;

  for (let i = 0; i < input.expectedCards.length; i += 1) {
    const card = input.expectedCards[i];
    const info = accountInfos[i];
    if (!info || !info.owner.equals(NUSA_CARD_VAULT_PROGRAM_ID)) {
      missingMints.push(card.mintOrAsset);
      continue;
    }
    const parsed = parseVaultDepositAccountData(info.data);
    if (
      parsed &&
      parsed.battleVault === expectedVaultStr &&
      parsed.owner === input.playerWallet &&
      parsed.mint === card.mintOrAsset &&
      parsed.isCoreNft === (card.tokenStandard === "MPL_CORE") &&
      parsed.amount > BigInt(0)
    ) {
      const depositedQty = Number(parsed.amount);
      depositedAmounts[card.mintOrAsset] = depositedQty;
      depositedCount += depositedQty;
      if (parsed.amount < BigInt(card.quantity)) {
        missingMints.push(card.mintOrAsset);
      }
    } else {
      missingMints.push(card.mintOrAsset);
    }
  }

  return {
    verified: missingMints.length === 0,
    missingMints,
    depositedAmounts,
    depositedCount,
  };
}

export async function settleBattleWinOnChain(input: {
  matchId: string;
  winnerWallet: string;
  loserWallet: string;
  rewardCard: VaultLockCardInput;
  winnerCards: VaultLockCardInput[];
  loserRemainingCards: VaultLockCardInput[];
}): Promise<VaultSettlementResult> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    return {
      settledOnChain: false,
      settleTxSignature: null,
      explorerUrl: null,
      reason: "SOLANA_SETTLER_PRIVATE_KEY_NOT_CONFIGURED",
    };
  }

  const vaultMatchId = toVaultMatchId(input.matchId);
  const winner = new PublicKey(input.winnerWallet);
  const loser = new PublicKey(input.loserWallet);
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const [vaultAuthorityPda] = await deriveVaultAuthorityPda();

  const rewardMint = new PublicKey(input.rewardCard.mintOrAsset);
  const [loserDepositPda] = await deriveVaultDepositPda(
    battleVaultPda,
    loser,
    rewardMint
  );

  const [vaultInfo, loserDepositInfo] = await executeWithSolanaConnection(
    (connection) =>
      connection.getMultipleAccountsInfo(
        [battleVaultPda, loserDepositPda],
        "confirmed"
      )
  );

  const vaultStatus = vaultInfo ? parseBattleVaultStatus(vaultInfo.data) : null;
  const alreadySettledOnChain = vaultStatus === "SettledWin";

  let signature: string | null = null;

  if (!alreadySettledOnChain) {
    const tx = new Transaction();
    if (input.rewardCard.tokenStandard === "MPL_CORE") {
      tx.add(
        new TransactionInstruction({
          programId: NUSA_CARD_VAULT_PROGRAM_ID,
          keys: [
            { pubkey: settler.publicKey, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: false },
            { pubkey: battleVaultPda, isSigner: false, isWritable: true },
            { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
            { pubkey: winner, isSigner: false, isWritable: false },
            { pubkey: loser, isSigner: false, isWritable: false },
            { pubkey: rewardMint, isSigner: false, isWritable: true },
            {
              pubkey: input.rewardCard.collectionAddress
                ? new PublicKey(input.rewardCard.collectionAddress)
                : NUSA_CARD_VAULT_PROGRAM_ID,
              isSigner: false,
              isWritable: false,
            },
            { pubkey: loserDepositPda, isSigner: false, isWritable: true },
            { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
          data: Buffer.concat([
            anchorDiscriminator("settle_core_reward"),
            encodeBorshString(vaultMatchId),
          ]),
        })
      );
    } else {
      const [vaultAta, winnerAta] = await Promise.all([
        deriveAssociatedTokenAddress(
          vaultAuthorityPda,
          rewardMint,
          TOKEN_2022_PROGRAM_ID
        ),
        deriveAssociatedTokenAddress(winner, rewardMint, TOKEN_2022_PROGRAM_ID),
      ]);

      tx.add(
        new TransactionInstruction({
          programId: NUSA_CARD_VAULT_PROGRAM_ID,
          keys: [
            { pubkey: settler.publicKey, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: false },
            { pubkey: battleVaultPda, isSigner: false, isWritable: true },
            { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
            { pubkey: winner, isSigner: false, isWritable: false },
            { pubkey: loser, isSigner: false, isWritable: false },
            { pubkey: rewardMint, isSigner: false, isWritable: false },
            { pubkey: vaultAta, isSigner: false, isWritable: true },
            { pubkey: winnerAta, isSigner: false, isWritable: true },
            { pubkey: loserDepositPda, isSigner: false, isWritable: true },
            {
              pubkey: TOKEN_2022_PROGRAM_ID,
              isSigner: false,
              isWritable: false,
            },
            {
              pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
              isSigner: false,
              isWritable: false,
            },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
          data: Buffer.concat([
            anchorDiscriminator("settle_token_2022_reward"),
            encodeBorshString(vaultMatchId),
          ]),
        })
      );
    }

    signature = await sendAndConfirmTxHttp(tx, [settler]);
  }

  // Release remaining cards for winner and loser in background batches
  await releasePlayerCardsBatch({
    matchId: vaultMatchId,
    owner: winner,
    cards: input.winnerCards,
  });
  await releasePlayerCardsBatch({
    matchId: vaultMatchId,
    owner: loser,
    cards: input.loserRemainingCards,
  });

  return {
    settledOnChain: true,
    settleTxSignature: signature ?? "onchain-settled",
    explorerUrl: signature ? getSolanaExplorerTxUrl(signature) : null,
  };
}

export async function settleBattleDrawOnChain(input: {
  matchId: string;
  playerAWallet: string;
  playerBWallet: string;
  playerACards: VaultLockCardInput[];
  playerBCards: VaultLockCardInput[];
}): Promise<VaultSettlementResult> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    return {
      settledOnChain: false,
      settleTxSignature: null,
      explorerUrl: null,
      reason: "SOLANA_SETTLER_PRIVATE_KEY_NOT_CONFIGURED",
    };
  }

  const vaultMatchId = toVaultMatchId(input.matchId);
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);

  const vaultInfo = await executeWithSolanaConnection((connection) =>
    connection.getAccountInfo(battleVaultPda, "confirmed")
  );
  if (!vaultInfo) {
    return {
      settledOnChain: false,
      settleTxSignature: null,
      explorerUrl: null,
      reason: "BATTLE_VAULT_NOT_INITIALIZED",
    };
  }

  const vaultStatus = parseBattleVaultStatus(vaultInfo.data);
  let signature: string | null = null;

  if (vaultStatus === "Active" || vaultStatus === null) {
    const tx = new Transaction().add(
      new TransactionInstruction({
        programId: NUSA_CARD_VAULT_PROGRAM_ID,
        keys: [
          { pubkey: settler.publicKey, isSigner: true, isWritable: false },
          { pubkey: configPda, isSigner: false, isWritable: false },
          { pubkey: battleVaultPda, isSigner: false, isWritable: true },
        ],
        data: Buffer.concat([
          anchorDiscriminator("mark_battle_draw"),
          encodeBorshString(vaultMatchId),
        ]),
      })
    );

    signature = await sendAndConfirmTxHttp(tx, [settler]);
  }

  if (input.playerACards.length > 0) {
    await releasePlayerCardsBatch({
      matchId: vaultMatchId,
      owner: new PublicKey(input.playerAWallet),
      cards: input.playerACards,
    });
  }
  if (input.playerBCards.length > 0) {
    await releasePlayerCardsBatch({
      matchId: vaultMatchId,
      owner: new PublicKey(input.playerBWallet),
      cards: input.playerBCards,
    });
  }

  return {
    settledOnChain: true,
    settleTxSignature: signature ?? "onchain-draw-released",
    explorerUrl: signature ? getSolanaExplorerTxUrl(signature) : null,
  };
}

async function releasePlayerCardsBatch(input: {
  matchId: string;
  owner: PublicKey;
  cards: VaultLockCardInput[];
}): Promise<void> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler || input.cards.length === 0) return;

  const vaultMatchId = toVaultMatchId(input.matchId);
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const [vaultAuthorityPda] = await deriveVaultAuthorityPda();

  const depositEntries = await Promise.all(
    input.cards.map(async (card) => {
      const mintOrAsset = new PublicKey(card.mintOrAsset);
      const [vaultDepositPda] = await deriveVaultDepositPda(
        battleVaultPda,
        input.owner,
        mintOrAsset
      );
      return { card, mintOrAsset, vaultDepositPda };
    })
  );

  // Filter out deposits that were already released & closed on-chain so retries stay idempotent.
  const depositInfos = await executeWithSolanaConnection((connection) =>
    connection.getMultipleAccountsInfo(
      depositEntries.map((entry) => entry.vaultDepositPda),
      "confirmed"
    )
  );
  const openDeposits = depositEntries.filter(
    (_, index) => depositInfos[index] !== null
  );
  if (openDeposits.length === 0) return;

  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );
  const CHUNK_SIZE = 3;
  const chunkSignatures: string[] = [];
  for (let i = 0; i < openDeposits.length; i += CHUNK_SIZE) {
    const chunk = openDeposits.slice(i, i + CHUNK_SIZE);
    const tx = new Transaction({
      feePayer: settler.publicKey,
      recentBlockhash: blockhash,
    });
    for (const { card, mintOrAsset, vaultDepositPda } of chunk) {
      if (card.tokenStandard === "MPL_CORE") {
        tx.add(
          new TransactionInstruction({
            programId: NUSA_CARD_VAULT_PROGRAM_ID,
            keys: [
              { pubkey: settler.publicKey, isSigner: true, isWritable: true },
              { pubkey: configPda, isSigner: false, isWritable: false },
              { pubkey: battleVaultPda, isSigner: false, isWritable: false },
              { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
              { pubkey: input.owner, isSigner: false, isWritable: true },
              { pubkey: mintOrAsset, isSigner: false, isWritable: true },
              {
                pubkey: card.collectionAddress
                  ? new PublicKey(card.collectionAddress)
                  : NUSA_CARD_VAULT_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
              },
              { pubkey: vaultDepositPda, isSigner: false, isWritable: true },
              { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
              {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
              },
            ],
            data: Buffer.concat([
              anchorDiscriminator("release_core_card"),
              encodeBorshString(vaultMatchId),
            ]),
          })
        );
      } else {
        const [vaultAta, ownerAta] = await Promise.all([
          deriveAssociatedTokenAddress(
            vaultAuthorityPda,
            mintOrAsset,
            TOKEN_2022_PROGRAM_ID
          ),
          deriveAssociatedTokenAddress(
            input.owner,
            mintOrAsset,
            TOKEN_2022_PROGRAM_ID
          ),
        ]);

        tx.add(
          new TransactionInstruction({
            programId: NUSA_CARD_VAULT_PROGRAM_ID,
            keys: [
              { pubkey: settler.publicKey, isSigner: true, isWritable: true },
              { pubkey: configPda, isSigner: false, isWritable: false },
              { pubkey: battleVaultPda, isSigner: false, isWritable: false },
              { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
              { pubkey: input.owner, isSigner: false, isWritable: true },
              { pubkey: mintOrAsset, isSigner: false, isWritable: false },
              { pubkey: vaultAta, isSigner: false, isWritable: true },
              { pubkey: ownerAta, isSigner: false, isWritable: true },
              { pubkey: vaultDepositPda, isSigner: false, isWritable: true },
              {
                pubkey: TOKEN_2022_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
              },
              {
                pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
              },
              {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
              },
            ],
            data: Buffer.concat([
              anchorDiscriminator("release_token_2022_card"),
              encodeBorshString(vaultMatchId),
            ]),
          })
        );
      }
    }
    await tx.sign(settler);
    const raw = await tx.serialize();
    const sig = await executeWithSolanaConnection((connection) =>
      connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: BigInt(3),
      })
    );
    chunkSignatures.push(sig);
  }
  await confirmSignaturesHttp(chunkSignatures);
}
