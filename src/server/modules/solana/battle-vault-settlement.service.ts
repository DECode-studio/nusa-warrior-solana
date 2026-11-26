import "server-only";
import { createHash } from "node:crypto";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  MPL_CORE_PROGRAM_ID,
  NUSA_CARD_VAULT_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  deriveBattleVaultPda,
  deriveVaultAuthorityPda,
  deriveVaultConfigPda,
  deriveVaultDepositPda,
  getSolanaConnection,
  getSolanaExplorerTxUrl,
} from "./solana-config";
import {
  deriveAssociatedTokenAddress,
  getSettlerKeypairFromEnv,
  type VaultLockCardInput,
} from "./nusa-vault-tx-builder.service";

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

export interface VaultSettlementResult {
  settledOnChain: boolean;
  settleTxSignature: string | null;
  explorerUrl: string | null;
  reason?: string;
}

export async function verifyVaultLockTransaction(input: {
  txSignature: string;
  expectedVaultPda: string;
}): Promise<boolean> {
  const connection = getSolanaConnection();
  const tx = await connection.getTransaction(input.txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || tx.meta?.err) return false;

  const accountKeys = tx.transaction.message
    .getAccountKeys()
    .staticAccountKeys.map((k) => k.toString());

  return (
    accountKeys.includes(NUSA_CARD_VAULT_PROGRAM_ID.toBase58()) &&
    accountKeys.includes(input.expectedVaultPda)
  );
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

  const connection = getSolanaConnection();
  const winner = new PublicKey(input.winnerWallet);
  const loser = new PublicKey(input.loserWallet);
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(input.matchId);
  const [vaultAuthorityPda] = await deriveVaultAuthorityPda();

  const rewardMint = new PublicKey(input.rewardCard.mintOrAsset);
  const [loserDepositPda] = await deriveVaultDepositPda(
    battleVaultPda,
    loser,
    rewardMint
  );

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
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          anchorDiscriminator("settle_core_reward"),
          encodeBorshString(input.matchId),
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
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
          {
            pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          anchorDiscriminator("settle_token_2022_reward"),
          encodeBorshString(input.matchId),
        ]),
      })
    );
  }

  const signature = await sendAndConfirmTransaction(connection, tx, [settler], {
    commitment: "confirmed",
  });

  // Release remaining cards for winner and loser in background batches
  await releasePlayerCardsBatch({
    matchId: input.matchId,
    owner: winner,
    cards: input.winnerCards,
  });
  await releasePlayerCardsBatch({
    matchId: input.matchId,
    owner: loser,
    cards: input.loserRemainingCards,
  });

  return {
    settledOnChain: true,
    settleTxSignature: signature,
    explorerUrl: getSolanaExplorerTxUrl(signature),
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

  const connection = getSolanaConnection();
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(input.matchId);

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
        encodeBorshString(input.matchId),
      ]),
    })
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [settler], {
    commitment: "confirmed",
  });

  await releasePlayerCardsBatch({
    matchId: input.matchId,
    owner: new PublicKey(input.playerAWallet),
    cards: input.playerACards,
  });
  await releasePlayerCardsBatch({
    matchId: input.matchId,
    owner: new PublicKey(input.playerBWallet),
    cards: input.playerBCards,
  });

  return {
    settledOnChain: true,
    settleTxSignature: signature,
    explorerUrl: getSolanaExplorerTxUrl(signature),
  };
}

async function releasePlayerCardsBatch(input: {
  matchId: string;
  owner: PublicKey;
  cards: VaultLockCardInput[];
}): Promise<void> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler || input.cards.length === 0) return;

  const connection = getSolanaConnection();
  const [configPda] = await deriveVaultConfigPda();
  const [battleVaultPda] = await deriveBattleVaultPda(input.matchId);
  const [vaultAuthorityPda] = await deriveVaultAuthorityPda();

  const CHUNK_SIZE = 4;
  for (let i = 0; i < input.cards.length; i += CHUNK_SIZE) {
    const chunk = input.cards.slice(i, i + CHUNK_SIZE);
    const tx = new Transaction();
    for (const card of chunk) {
      const mintOrAsset = new PublicKey(card.mintOrAsset);
      const [vaultDepositPda] = await deriveVaultDepositPda(
        battleVaultPda,
        input.owner,
        mintOrAsset
      );

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
              encodeBorshString(input.matchId),
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
              encodeBorshString(input.matchId),
            ]),
          })
        );
      }
    }
    await sendAndConfirmTransaction(connection, tx, [settler], {
      commitment: "confirmed",
    });
  }
}
