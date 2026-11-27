import "server-only";
import { createHash } from "node:crypto";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  MPL_CORE_PROGRAM_ID,
  NUSA_CARD_VAULT_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  deriveBattleVaultPda,
  deriveVaultAuthorityPda,
  deriveVaultConfigPda,
  deriveVaultDepositPda,
  executeWithSolanaConnection,
  toVaultMatchId,
} from "./solana-config";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

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

function encodeU64LE(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value), 0);
  return buf;
}

function encodeI64LE(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value), 0);
  return buf;
}

export async function deriveAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey,
  tokenProgramId: PublicKey = TOKEN_2022_PROGRAM_ID
): Promise<PublicKey> {
  const [ata] = await PublicKey.findProgramAddress(
    [owner.toBytes(), tokenProgramId.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}

export async function getSettlerKeypairFromEnv(): Promise<Keypair | null> {
  const raw = process.env.SOLANA_SETTLER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  try {
    if (raw.startsWith("[")) {
      return await Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(raw) as number[])
      );
    }
    return await Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
}

export interface VaultLockCardInput {
  mintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  quantity: number;
  collectionAddress?: string | null;
}

export async function buildCreateBattleVaultInstruction(input: {
  payer: PublicKey;
  settler: PublicKey;
  matchId: string;
  playerA: PublicKey;
  playerB: PublicKey;
  expiresAtUnix: number;
}): Promise<TransactionInstruction> {
  const vaultMatchId = toVaultMatchId(input.matchId);
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);

  const data = Buffer.concat([
    anchorDiscriminator("create_battle_vault"),
    encodeBorshString(vaultMatchId),
    Buffer.from(input.playerA.toBytes()),
    Buffer.from(input.playerB.toBytes()),
    encodeI64LE(input.expiresAtUnix),
  ]);

  return new TransactionInstruction({
    programId: NUSA_CARD_VAULT_PROGRAM_ID,
    keys: [
      { pubkey: input.payer, isSigner: true, isWritable: true },
      { pubkey: input.settler, isSigner: true, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: battleVaultPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function buildLockToken2022Instruction(input: {
  owner: PublicKey;
  matchId: string;
  mint: PublicKey;
  amount: number;
}): Promise<TransactionInstruction> {
  const vaultMatchId = toVaultMatchId(input.matchId);
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const [vaultAuthorityPda] = await deriveVaultAuthorityPda();
  const [ownerAta, vaultAta, [vaultDepositPda]] = await Promise.all([
    deriveAssociatedTokenAddress(input.owner, input.mint, TOKEN_2022_PROGRAM_ID),
    deriveAssociatedTokenAddress(
      vaultAuthorityPda,
      input.mint,
      TOKEN_2022_PROGRAM_ID
    ),
    deriveVaultDepositPda(battleVaultPda, input.owner, input.mint),
  ]);

  const data = Buffer.concat([
    anchorDiscriminator("lock_token_2022_card"),
    encodeBorshString(vaultMatchId),
    encodeU64LE(input.amount),
  ]);

  return new TransactionInstruction({
    programId: NUSA_CARD_VAULT_PROGRAM_ID,
    keys: [
      { pubkey: input.owner, isSigner: true, isWritable: true },
      { pubkey: battleVaultPda, isSigner: false, isWritable: true },
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: input.mint, isSigner: false, isWritable: false },
      { pubkey: ownerAta, isSigner: false, isWritable: true },
      { pubkey: vaultAta, isSigner: false, isWritable: true },
      { pubkey: vaultDepositPda, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function buildLockCoreCardInstruction(input: {
  owner: PublicKey;
  matchId: string;
  asset: PublicKey;
  collection?: PublicKey | null;
}): Promise<TransactionInstruction> {
  const vaultMatchId = toVaultMatchId(input.matchId);
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const [vaultAuthorityPda] = await deriveVaultAuthorityPda();
  const [vaultDepositPda] = await deriveVaultDepositPda(
    battleVaultPda,
    input.owner,
    input.asset
  );

  const data = Buffer.concat([
    anchorDiscriminator("lock_core_card"),
    encodeBorshString(vaultMatchId),
  ]);

  return new TransactionInstruction({
    programId: NUSA_CARD_VAULT_PROGRAM_ID,
    keys: [
      { pubkey: input.owner, isSigner: true, isWritable: true },
      { pubkey: battleVaultPda, isSigner: false, isWritable: true },
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: input.asset, isSigner: false, isWritable: true },
      {
        pubkey: input.collection ?? NUSA_CARD_VAULT_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: vaultDepositPda, isSigner: false, isWritable: true },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Splits up to 20 deck cards into chunked transactions (max 3 cards per tx)
 * so the player can approve all of them in a single `signAllTransactions()` call
 * without exceeding Solana's 1232-byte transaction limit or compute budget.
 */
export async function buildChunkedLockDeckTransactions(input: {
  matchId: string;
  playerWallet: string;
  cards: VaultLockCardInput[];
}): Promise<{
  vaultPda: string;
  serializedTransactions: string[];
}> {
  const vaultMatchId = toVaultMatchId(input.matchId);
  const owner = new PublicKey(input.playerWallet);
  const [battleVaultPda] = await deriveBattleVaultPda(vaultMatchId);
  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );

  const instructions: TransactionInstruction[] = [];
  for (const card of input.cards) {
    const mintOrAsset = new PublicKey(card.mintOrAsset);
    if (card.tokenStandard === "MPL_CORE") {
      instructions.push(
        await buildLockCoreCardInstruction({
          owner,
          matchId: vaultMatchId,
          asset: mintOrAsset,
          collection: card.collectionAddress
            ? new PublicKey(card.collectionAddress)
            : null,
        })
      );
    } else {
      instructions.push(
        await buildLockToken2022Instruction({
          owner,
          matchId: vaultMatchId,
          mint: mintOrAsset,
          amount: card.quantity,
        })
      );
    }
  }

  const CHUNK_SIZE = 3;
  const serializedTransactions: string[] = [];
  for (let i = 0; i < instructions.length; i += CHUNK_SIZE) {
    const tx = new Transaction({
      feePayer: owner,
      recentBlockhash: blockhash,
    });
    for (const ix of instructions.slice(i, i + CHUNK_SIZE)) {
      tx.add(ix);
    }
    serializedTransactions.push(
      Buffer.from(
        await tx.serialize({ requireAllSignatures: false })
      ).toString("base64")
    );
  }

  return {
    vaultPda: battleVaultPda.toBase58(),
    serializedTransactions,
  };
}
