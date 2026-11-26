import "server-only";
import { createHash } from "node:crypto";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  MPL_CORE_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  executeWithSolanaConnection,
  getSolanaConnection,
  getSolanaExplorerTxUrl,
} from "./solana-config";
import {
  deriveAssociatedTokenAddress,
  getSettlerKeypairFromEnv,
} from "./nusa-vault-tx-builder.service";
import { invalidateWalletAssetCache } from "./wallet-asset-reader.service";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

// Token-2022 Mint account base size (82) + AccountType/padding (83) + MetadataPointer TLV (68) = 234 bytes
// Additional space for TokenMetadata TLV is funded by rent-exempt lamports on the Mint account.
const TOKEN_2022_MINT_WITH_POINTER_SPACE = 234;

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

function buildMetadataPointerInitIx(
  mint: PublicKey,
  authority: PublicKey
): TransactionInstruction {
  // Token-2022 MetadataPointerExtension (39) -> Initialize (0)
  const data = Buffer.concat([
    Buffer.from([39, 0]),
    Buffer.from(authority.toBytes()),
    Buffer.from(mint.toBytes()),
  ]);
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data,
  });
}

function buildInitializeMint2Ix(
  mint: PublicKey,
  decimals: number,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey
): TransactionInstruction {
  // Token-2022 InitializeMint2 (20)
  const data = Buffer.concat([
    Buffer.from([20, decimals]),
    Buffer.from(mintAuthority.toBytes()),
    Buffer.from([1]), // COption::Some for freezeAuthority
    Buffer.from(freezeAuthority.toBytes()),
  ]);
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data,
  });
}

function buildInitializeTokenMetadataIx(input: {
  mint: PublicKey;
  updateAuthority: PublicKey;
  mintAuthority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}): TransactionInstruction {
  const disc = createHash("sha256")
    .update("spl_token_metadata_interface:initialize_account")
    .digest()
    .subarray(0, 8);

  const data = Buffer.concat([
    disc,
    encodeBorshString(input.name),
    encodeBorshString(input.symbol),
    encodeBorshString(input.uri),
  ]);

  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: input.mint, isSigner: false, isWritable: true },
      { pubkey: input.updateAuthority, isSigner: false, isWritable: false },
      { pubkey: input.mint, isSigner: false, isWritable: false },
      { pubkey: input.mintAuthority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

function buildCreateAtaIdempotentIx(input: {
  payer: PublicKey;
  ata: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: input.payer, isSigner: true, isWritable: true },
      { pubkey: input.ata, isSigner: false, isWritable: true },
      { pubkey: input.owner, isSigner: false, isWritable: false },
      { pubkey: input.mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]), // CreateIdempotent
  });
}

function buildMintToIx(input: {
  mint: PublicKey;
  destinationAta: PublicKey;
  authority: PublicKey;
  amount: number;
}): TransactionInstruction {
  const data = Buffer.concat([Buffer.from([7]), encodeU64LE(input.amount)]);
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: input.mint, isSigner: false, isWritable: true },
      { pubkey: input.destinationAta, isSigner: false, isWritable: true },
      { pubkey: input.authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

function resolveCardMetadataUri(slug: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000";
  return `${baseUrl}/api/v1/cards/${slug}/metadata.json`;
}

/**
 * Ensures a regular card in the database has a Token-2022 Mint on Solana.
 * Creates the Mint + MetadataPointer + TokenMetadata on-chain if missing.
 */
export async function ensureRegularCardMint(cardSlug: string): Promise<{
  cardId: string;
  mintAddress: string;
  metadataUri: string;
}> {
  if (!isPrismaDriverEnabled()) {
    throw AppError.badRequest(
      "Minting on-chain membutuhkan driver database Prisma."
    );
  }

  const card = await prisma.card.findUnique({
    where: { slug: cardSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      mintAddress: true,
      metadataUri: true,
      tokenStandard: true,
    },
  });
  if (!card) {
    throw AppError.notFound(`Kartu '${cardSlug}' tidak ditemukan.`);
  }

  const metadataUri = card.metadataUri || resolveCardMetadataUri(card.slug);
  if (card.mintAddress) {
    return {
      cardId: card.id,
      mintAddress: card.mintAddress,
      metadataUri,
    };
  }

  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi untuk membuat Mint kartu."
    );
  }

  const connection = getSolanaConnection();
  const mintKeypair = await Keypair.generate();

  // Reserve extra lamports for TokenMetadata TLV extension reallocation
  const estimatedMetadataSpace =
    TOKEN_2022_MINT_WITH_POINTER_SPACE +
    128 +
    Buffer.byteLength(card.name, "utf8") +
    4 +
    Buffer.byteLength(metadataUri, "utf8");
  const rentLamports = await connection.getMinimumBalanceForRentExemption(
    estimatedMetadataSpace
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: settler.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: TOKEN_2022_MINT_WITH_POINTER_SPACE,
      lamports: rentLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    buildMetadataPointerInitIx(mintKeypair.publicKey, settler.publicKey),
    buildInitializeMint2Ix(
      mintKeypair.publicKey,
      0,
      settler.publicKey,
      settler.publicKey
    ),
    buildInitializeTokenMetadataIx({
      mint: mintKeypair.publicKey,
      updateAuthority: settler.publicKey,
      mintAuthority: settler.publicKey,
      name: card.name.slice(0, 32),
      symbol: "NUSA",
      uri: metadataUri,
    })
  );

  await sendAndConfirmTransaction(connection, tx, [settler, mintKeypair], {
    commitment: "confirmed",
  });

  const mintAddress = mintKeypair.publicKey.toBase58();
  await prisma.card.update({
    where: { id: card.id },
    data: {
      tokenStandard: "TOKEN_2022",
      mintAddress,
      metadataUri,
    },
  });

  return {
    cardId: card.id,
    mintAddress,
    metadataUri,
  };
}

/**
 * Builds chunked, partially-signed transactions (signed by Settler as Mint Authority)
 * so the player can approve up to 20 Token-2022 card mints in a single `signAllTransactions()`
 * call without exceeding Solana's 1232-byte transaction size limit.
 */
export async function buildMintRegularCardsToPlayerTx(input: {
  playerWallet: string;
  items: Array<{ cardSlug: string; quantity: number }>;
}): Promise<{
  serializedTransactions: string[];
  mints: Array<{ cardSlug: string; mintAddress: string; quantity: number }>;
}> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi untuk minting kartu."
    );
  }

  const playerPubkey = new PublicKey(input.playerWallet);
  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );

  const validItems = input.items.filter((item) => item.quantity > 0);
  const mints: Array<{
    cardSlug: string;
    mintAddress: string;
    quantity: number;
  }> = [];
  const itemInstructions: TransactionInstruction[][] = [];

  for (const item of validItems) {
    const ensured = await ensureRegularCardMint(item.cardSlug);
    const mintPubkey = new PublicKey(ensured.mintAddress);
    const playerAta = await deriveAssociatedTokenAddress(
      playerPubkey,
      mintPubkey,
      TOKEN_2022_PROGRAM_ID
    );

    itemInstructions.push([
      buildCreateAtaIdempotentIx({
        payer: playerPubkey,
        ata: playerAta,
        owner: playerPubkey,
        mint: mintPubkey,
      }),
      buildMintToIx({
        mint: mintPubkey,
        destinationAta: playerAta,
        authority: settler.publicKey,
        amount: item.quantity,
      }),
    ]);

    mints.push({
      cardSlug: item.cardSlug,
      mintAddress: ensured.mintAddress,
      quantity: item.quantity,
    });
  }

  const CHUNK_SIZE = 5;
  const serializedTransactions: string[] = [];
  for (let i = 0; i < itemInstructions.length; i += CHUNK_SIZE) {
    const tx = new Transaction({
      feePayer: playerPubkey,
      recentBlockhash: blockhash,
    });
    for (const pair of itemInstructions.slice(i, i + CHUNK_SIZE)) {
      tx.add(...pair);
    }
    await tx.partialSign(settler);
    serializedTransactions.push(
      Buffer.from(
        await tx.serialize({ requireAllSignatures: false })
      ).toString("base64")
    );
  }

  return {
    serializedTransactions,
    mints,
  };
}

/**
 * Mints a 1-of-1 Metaplex Core NFT for Custom Forge Cards or Admin Rare / Auction Cards.
 */
export async function mintMetaplexCoreCard(input: {
  cardSlug: string;
  recipientWallet: string;
  editionNumber?: number;
}): Promise<{
  assetAddress: string;
  txSignature: string;
  explorerUrl: string;
}> {
  if (!isPrismaDriverEnabled()) {
    throw AppError.badRequest(
      "Minting Metaplex Core membutuhkan driver database Prisma."
    );
  }

  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi untuk minting Metaplex Core."
    );
  }

  const card = await prisma.card.findUnique({
    where: { slug: input.cardSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      metadataUri: true,
      collectionAddress: true,
    },
  });
  if (!card) {
    throw AppError.notFound(`Kartu '${input.cardSlug}' tidak ditemukan.`);
  }

  const metadataUri = card.metadataUri || resolveCardMetadataUri(card.slug);
  const assetKeypair = await Keypair.generate();
  const recipientPubkey = new PublicKey(input.recipientWallet);

  // Metaplex Core CreateV1 instruction:
  // discriminator = 0, data_state = 0 (Unlocked), name, uri, plugins = Option::None (0)
  const data = Buffer.concat([
    Buffer.from([0, 0]),
    encodeBorshString(card.name.slice(0, 32)),
    encodeBorshString(metadataUri),
    Buffer.from([0]),
  ]);

  const ix = new TransactionInstruction({
    programId: MPL_CORE_PROGRAM_ID,
    keys: [
      { pubkey: assetKeypair.publicKey, isSigner: true, isWritable: true },
      {
        pubkey: card.collectionAddress
          ? new PublicKey(card.collectionAddress)
          : MPL_CORE_PROGRAM_ID,
        isSigner: false,
        isWritable: Boolean(card.collectionAddress),
      },
      { pubkey: settler.publicKey, isSigner: false, isWritable: false },
      { pubkey: settler.publicKey, isSigner: true, isWritable: true },
      { pubkey: recipientPubkey, isSigner: false, isWritable: false },
      { pubkey: settler.publicKey, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });

  const connection = getSolanaConnection();
  const tx = new Transaction().add(ix);
  const txSignature = await sendAndConfirmTransaction(
    connection,
    tx,
    [settler, assetKeypair],
    { commitment: "confirmed" }
  );

  const assetAddress = assetKeypair.publicKey.toBase58();
  await prisma.$transaction([
    prisma.card.update({
      where: { id: card.id },
      data: {
        tokenStandard: "MPL_CORE",
        metadataUri,
      },
    }),
    prisma.cardNftInstance.create({
      data: {
        cardId: card.id,
        assetAddress,
        collectionAddress: card.collectionAddress,
        ownerWallet: input.recipientWallet,
        editionNumber: input.editionNumber ?? 1,
        mintTxSignature: txSignature,
        status: "ACTIVE",
      },
    }),
  ]);

  invalidateWalletAssetCache(input.recipientWallet);

  return {
    assetAddress,
    txSignature,
    explorerUrl: getSolanaExplorerTxUrl(txSignature),
  };
}

/**
 * Verifies on Solana that a Token-2022 mint transaction succeeded for the
 * expected player wallet and card mint addresses before committing DB state.
 */
export async function verifyCardMintTransaction(input: {
  txSignatures: string[];
  expectedWallet: string;
  expectedMintAddresses: string[];
}): Promise<boolean> {
  if (input.txSignatures.length === 0) return false;
  const foundKeys = new Set<string>();

  for (const signature of input.txSignatures) {
    const tx = await executeWithSolanaConnection((connection) =>
      connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      })
    );
    if (!tx || tx.meta?.err) return false;

    const accountKeys = tx.transaction.message
      .getAccountKeys()
      .staticAccountKeys.map((k) => k.toString());

    if (
      !accountKeys.includes(TOKEN_2022_PROGRAM_ID.toBase58()) ||
      !accountKeys.includes(input.expectedWallet)
    ) {
      return false;
    }

    for (const key of accountKeys) {
      foundKeys.add(key);
    }
  }

  return input.expectedMintAddresses.every((mint) => foundKeys.has(mint));
}
