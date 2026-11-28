import "server-only";
import { createHash } from "node:crypto";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { AppError } from "@/server/shared/errors/app-error";
import {
  MPL_CORE_PROGRAM_ID,
  NUSA_AUCTION_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  deriveAuctionConfigPda,
  deriveAuctionPda,
  deriveBidEscrowPda,
  executeWithSolanaConnection,
} from "./solana-config";
import {
  deriveAssociatedTokenAddress,
  getSettlerKeypairFromEnv,
} from "./nusa-vault-tx-builder.service";
import {
  getTokenMintAddress,
  invalidateNusaTokenCache,
  toTokenBaseUnits,
} from "./nusa-token.service";
import { invalidateWalletAssetCache } from "./wallet-asset-reader.service";

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

function encodeU64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
}

function encodeI64LE(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value), 0);
  return buf;
}

export async function getAuctionFeeTreasuryAddress(): Promise<PublicKey> {
  const configured = process.env.SOLANA_AUCTION_FEE_TREASURY?.trim();
  if (configured) {
    return new PublicKey(configured);
  }
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_AUCTION_FEE_TREASURY atau SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi."
    );
  }
  return settler.publicKey;
}

async function serializeUnsignedTx(
  feePayer: PublicKey,
  instructions: TransactionInstruction[]
): Promise<{ serializedTransaction: string; recentBlockhash: string }> {
  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );
  const tx = new Transaction({
    feePayer,
    recentBlockhash: blockhash,
  });
  for (const ix of instructions) {
    tx.add(ix);
  }
  const bytes = await tx.serialize({ requireAllSignatures: false });
  return {
    serializedTransaction: Buffer.from(bytes).toString("base64"),
    recentBlockhash: blockhash,
  };
}

export async function buildCreateAuctionTransaction(input: {
  auctionId: string;
  sellerWallet: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
  startingPriceNusa: number;
  durationSecs: number;
}): Promise<{
  serializedTransaction: string;
  recentBlockhash: string;
  auctionPda: string;
}> {
  const seller = new PublicKey(input.sellerWallet);
  const [configPda] = await deriveAuctionConfigPda();
  const [auctionPda] = await deriveAuctionPda(input.auctionId);
  const startingPriceBase = toTokenBaseUnits(input.startingPriceNusa);

  let ix: TransactionInstruction;
  if (input.tokenStandard === "MPL_CORE") {
    const asset = new PublicKey(input.cardMintOrAsset);
    const collectionKey = input.collectionAddress
      ? new PublicKey(input.collectionAddress)
      : NUSA_AUCTION_PROGRAM_ID;
    const data = Buffer.concat([
      anchorDiscriminator("create_auction_core_nft"),
      encodeBorshString(input.auctionId),
      encodeU64LE(startingPriceBase),
      encodeI64LE(input.durationSecs),
    ]);
    ix = new TransactionInstruction({
      programId: NUSA_AUCTION_PROGRAM_ID,
      keys: [
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: auctionPda, isSigner: false, isWritable: true },
        { pubkey: asset, isSigner: false, isWritable: true },
        { pubkey: collectionKey, isSigner: false, isWritable: false },
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  } else {
    const cardMint = new PublicKey(input.cardMintOrAsset);
    const sellerCardAta = await deriveAssociatedTokenAddress(
      seller,
      cardMint,
      TOKEN_2022_PROGRAM_ID
    );
    const auctionCardAta = await deriveAssociatedTokenAddress(
      auctionPda,
      cardMint,
      TOKEN_2022_PROGRAM_ID
    );
    const data = Buffer.concat([
      anchorDiscriminator("create_auction_token_2022"),
      encodeBorshString(input.auctionId),
      encodeU64LE(startingPriceBase),
      encodeI64LE(input.durationSecs),
    ]);
    ix = new TransactionInstruction({
      programId: NUSA_AUCTION_PROGRAM_ID,
      keys: [
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: auctionPda, isSigner: false, isWritable: true },
        { pubkey: cardMint, isSigner: false, isWritable: false },
        { pubkey: sellerCardAta, isSigner: false, isWritable: true },
        { pubkey: auctionCardAta, isSigner: false, isWritable: true },
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

  const serialized = await serializeUnsignedTx(seller, [ix]);
  return {
    ...serialized,
    auctionPda: auctionPda.toBase58(),
  };
}

export async function buildUpdateAuctionTransaction(input: {
  auctionId: string;
  sellerWallet: string;
  newStartingPriceNusa: number;
  newDurationSecs: number;
}): Promise<{ serializedTransaction: string; recentBlockhash: string }> {
  const seller = new PublicKey(input.sellerWallet);
  const [configPda] = await deriveAuctionConfigPda();
  const [auctionPda] = await deriveAuctionPda(input.auctionId);
  const priceBase = toTokenBaseUnits(input.newStartingPriceNusa);

  const data = Buffer.concat([
    anchorDiscriminator("update_auction"),
    encodeBorshString(input.auctionId),
    encodeU64LE(priceBase),
    encodeI64LE(input.newDurationSecs),
  ]);

  const ix = new TransactionInstruction({
    programId: NUSA_AUCTION_PROGRAM_ID,
    keys: [
      { pubkey: seller, isSigner: true, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: auctionPda, isSigner: false, isWritable: true },
    ],
    data,
  });

  return serializeUnsignedTx(seller, [ix]);
}

export async function buildCancelAuctionTransaction(input: {
  auctionId: string;
  sellerWallet: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
}): Promise<{ serializedTransaction: string; recentBlockhash: string }> {
  const seller = new PublicKey(input.sellerWallet);
  const [auctionPda] = await deriveAuctionPda(input.auctionId);

  let ix: TransactionInstruction;
  if (input.tokenStandard === "MPL_CORE") {
    const asset = new PublicKey(input.cardMintOrAsset);
    const collectionKey = input.collectionAddress
      ? new PublicKey(input.collectionAddress)
      : NUSA_AUCTION_PROGRAM_ID;
    const data = Buffer.concat([
      anchorDiscriminator("cancel_auction_core_nft"),
      encodeBorshString(input.auctionId),
    ]);
    ix = new TransactionInstruction({
      programId: NUSA_AUCTION_PROGRAM_ID,
      keys: [
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: auctionPda, isSigner: false, isWritable: true },
        { pubkey: asset, isSigner: false, isWritable: true },
        { pubkey: collectionKey, isSigner: false, isWritable: false },
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  } else {
    const cardMint = new PublicKey(input.cardMintOrAsset);
    const auctionCardAta = await deriveAssociatedTokenAddress(
      auctionPda,
      cardMint,
      TOKEN_2022_PROGRAM_ID
    );
    const sellerCardAta = await deriveAssociatedTokenAddress(
      seller,
      cardMint,
      TOKEN_2022_PROGRAM_ID
    );
    const data = Buffer.concat([
      anchorDiscriminator("cancel_auction_token_2022"),
      encodeBorshString(input.auctionId),
    ]);
    ix = new TransactionInstruction({
      programId: NUSA_AUCTION_PROGRAM_ID,
      keys: [
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: auctionPda, isSigner: false, isWritable: true },
        { pubkey: cardMint, isSigner: false, isWritable: false },
        { pubkey: auctionCardAta, isSigner: false, isWritable: true },
        { pubkey: sellerCardAta, isSigner: false, isWritable: true },
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

  return serializeUnsignedTx(seller, [ix]);
}

export async function buildPlaceBidTransaction(input: {
  auctionId: string;
  bidderWallet: string;
  newBidAmountNusa: number;
}): Promise<{
  serializedTransaction: string;
  recentBlockhash: string;
  bidEscrowPda: string;
}> {
  const bidder = new PublicKey(input.bidderWallet);
  const nusaMint = getTokenMintAddress("NUSA");
  const [configPda] = await deriveAuctionConfigPda();
  const [auctionPda] = await deriveAuctionPda(input.auctionId);
  const [bidEscrowPda] = await deriveBidEscrowPda(auctionPda, bidder);

  const bidderNusaAta = await deriveAssociatedTokenAddress(
    bidder,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );
  const auctionNusaAta = await deriveAssociatedTokenAddress(
    auctionPda,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );

  const bidBase = toTokenBaseUnits(input.newBidAmountNusa);
  const data = Buffer.concat([
    anchorDiscriminator("place_bid"),
    encodeBorshString(input.auctionId),
    encodeU64LE(bidBase),
  ]);

  const ix = new TransactionInstruction({
    programId: NUSA_AUCTION_PROGRAM_ID,
    keys: [
      { pubkey: bidder, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: auctionPda, isSigner: false, isWritable: true },
      { pubkey: nusaMint, isSigner: false, isWritable: false },
      { pubkey: bidderNusaAta, isSigner: false, isWritable: true },
      { pubkey: auctionNusaAta, isSigner: false, isWritable: true },
      { pubkey: bidEscrowPda, isSigner: false, isWritable: true },
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

  const serialized = await serializeUnsignedTx(bidder, [ix]);
  return {
    ...serialized,
    bidEscrowPda: bidEscrowPda.toBase58(),
  };
}

async function buildSettleInstruction(input: {
  payer: PublicKey;
  auctionId: string;
  sellerWallet: string;
  recipientWallet: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
  hasWinner: boolean;
}): Promise<TransactionInstruction> {
  const seller = new PublicKey(input.sellerWallet);
  const recipient = new PublicKey(input.recipientWallet);
  const feeTreasury = await getAuctionFeeTreasuryAddress();
  const nusaMint = getTokenMintAddress("NUSA");
  const [configPda] = await deriveAuctionConfigPda();
  const [auctionPda] = await deriveAuctionPda(input.auctionId);

  const auctionNusaAta = await deriveAssociatedTokenAddress(
    auctionPda,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );
  const sellerNusaAta = await deriveAssociatedTokenAddress(
    seller,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );
  const feeTreasuryNusaAta = await deriveAssociatedTokenAddress(
    feeTreasury,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );

  const winnerEscrowKey = input.hasWinner
    ? (await deriveBidEscrowPda(auctionPda, recipient))[0]
    : NUSA_AUCTION_PROGRAM_ID;

  if (input.tokenStandard === "MPL_CORE") {
    const asset = new PublicKey(input.cardMintOrAsset);
    const collectionKey = input.collectionAddress
      ? new PublicKey(input.collectionAddress)
      : NUSA_AUCTION_PROGRAM_ID;
    const data = Buffer.concat([
      anchorDiscriminator("settle_auction_core_nft"),
      encodeBorshString(input.auctionId),
    ]);
    return new TransactionInstruction({
      programId: NUSA_AUCTION_PROGRAM_ID,
      keys: [
        { pubkey: input.payer, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: auctionPda, isSigner: false, isWritable: true },
        { pubkey: seller, isSigner: false, isWritable: false },
        { pubkey: feeTreasury, isSigner: false, isWritable: false },
        { pubkey: recipient, isSigner: false, isWritable: false },
        { pubkey: asset, isSigner: false, isWritable: true },
        { pubkey: collectionKey, isSigner: false, isWritable: false },
        { pubkey: nusaMint, isSigner: false, isWritable: false },
        { pubkey: auctionNusaAta, isSigner: false, isWritable: true },
        { pubkey: sellerNusaAta, isSigner: false, isWritable: true },
        { pubkey: feeTreasuryNusaAta, isSigner: false, isWritable: true },
        {
          pubkey: winnerEscrowKey,
          isSigner: false,
          isWritable: input.hasWinner,
        },
        { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
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

  const cardMint = new PublicKey(input.cardMintOrAsset);
  const auctionCardAta = await deriveAssociatedTokenAddress(
    auctionPda,
    cardMint,
    TOKEN_2022_PROGRAM_ID
  );
  const recipientCardAta = await deriveAssociatedTokenAddress(
    recipient,
    cardMint,
    TOKEN_2022_PROGRAM_ID
  );
  const data = Buffer.concat([
    anchorDiscriminator("settle_auction_token_2022"),
    encodeBorshString(input.auctionId),
  ]);
  return new TransactionInstruction({
    programId: NUSA_AUCTION_PROGRAM_ID,
    keys: [
      { pubkey: input.payer, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: auctionPda, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: false, isWritable: false },
      { pubkey: feeTreasury, isSigner: false, isWritable: false },
      { pubkey: recipient, isSigner: false, isWritable: false },
      { pubkey: cardMint, isSigner: false, isWritable: false },
      { pubkey: nusaMint, isSigner: false, isWritable: false },
      { pubkey: auctionCardAta, isSigner: false, isWritable: true },
      { pubkey: recipientCardAta, isSigner: false, isWritable: true },
      { pubkey: auctionNusaAta, isSigner: false, isWritable: true },
      { pubkey: sellerNusaAta, isSigner: false, isWritable: true },
      { pubkey: feeTreasuryNusaAta, isSigner: false, isWritable: true },
      {
        pubkey: winnerEscrowKey,
        isSigner: false,
        isWritable: input.hasWinner,
      },
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

async function buildRefundInstruction(input: {
  payer: PublicKey;
  auctionId: string;
  bidderWallet: string;
}): Promise<TransactionInstruction> {
  const bidder = new PublicKey(input.bidderWallet);
  const nusaMint = getTokenMintAddress("NUSA");
  const [configPda] = await deriveAuctionConfigPda();
  const [auctionPda] = await deriveAuctionPda(input.auctionId);
  const [bidEscrowPda] = await deriveBidEscrowPda(auctionPda, bidder);

  const auctionNusaAta = await deriveAssociatedTokenAddress(
    auctionPda,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );
  const bidderNusaAta = await deriveAssociatedTokenAddress(
    bidder,
    nusaMint,
    TOKEN_2022_PROGRAM_ID
  );

  const data = Buffer.concat([
    anchorDiscriminator("refund_losing_bid"),
    encodeBorshString(input.auctionId),
  ]);

  return new TransactionInstruction({
    programId: NUSA_AUCTION_PROGRAM_ID,
    keys: [
      { pubkey: input.payer, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: auctionPda, isSigner: false, isWritable: false },
      { pubkey: bidder, isSigner: false, isWritable: true },
      { pubkey: nusaMint, isSigner: false, isWritable: false },
      { pubkey: auctionNusaAta, isSigner: false, isWritable: true },
      { pubkey: bidderNusaAta, isSigner: false, isWritable: true },
      { pubkey: bidEscrowPda, isSigner: false, isWritable: true },
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

export async function settleAuctionOnChainBySettler(input: {
  auctionId: string;
  sellerWallet: string;
  recipientWallet: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
  hasWinner: boolean;
}): Promise<string> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi untuk settlement otomatis."
    );
  }
  const ix = await buildSettleInstruction({
    payer: settler.publicKey,
    ...input,
  });
  const signature = await executeWithSolanaConnection((connection) =>
    sendAndConfirmTransaction(connection, new Transaction().add(ix), [settler], {
      commitment: "confirmed",
    })
  );
  invalidateNusaTokenCache(input.sellerWallet);
  invalidateWalletAssetCache(input.sellerWallet);
  invalidateWalletAssetCache(input.recipientWallet);
  return signature;
}

export async function refundLosingBidOnChainBySettler(input: {
  auctionId: string;
  bidderWallet: string;
}): Promise<string> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi untuk refund otomatis."
    );
  }
  const ix = await buildRefundInstruction({
    payer: settler.publicKey,
    ...input,
  });
  const signature = await executeWithSolanaConnection((connection) =>
    sendAndConfirmTransaction(connection, new Transaction().add(ix), [settler], {
      commitment: "confirmed",
    })
  );
  invalidateNusaTokenCache(input.bidderWallet);
  return signature;
}

export async function buildUserSettleAuctionTransaction(input: {
  payerWallet: string;
  auctionId: string;
  sellerWallet: string;
  recipientWallet: string;
  cardMintOrAsset: string;
  tokenStandard: "TOKEN_2022" | "MPL_CORE";
  collectionAddress?: string | null;
  hasWinner: boolean;
}): Promise<{ serializedTransaction: string; recentBlockhash: string }> {
  const payer = new PublicKey(input.payerWallet);
  const ix = await buildSettleInstruction({
    payer,
    auctionId: input.auctionId,
    sellerWallet: input.sellerWallet,
    recipientWallet: input.recipientWallet,
    cardMintOrAsset: input.cardMintOrAsset,
    tokenStandard: input.tokenStandard,
    collectionAddress: input.collectionAddress,
    hasWinner: input.hasWinner,
  });
  return serializeUnsignedTx(payer, [ix]);
}

export async function buildUserRefundBidTransaction(input: {
  payerWallet: string;
  auctionId: string;
  bidderWallet: string;
}): Promise<{ serializedTransaction: string; recentBlockhash: string }> {
  const payer = new PublicKey(input.payerWallet);
  const ix = await buildRefundInstruction({
    payer,
    auctionId: input.auctionId,
    bidderWallet: input.bidderWallet,
  });
  return serializeUnsignedTx(payer, [ix]);
}

export async function verifyAuctionProgramTransaction(input: {
  txSignature: string;
  expectedSignerWallet: string;
  expectedAuctionPda?: string;
}): Promise<void> {
  const parsedTx = await executeWithSolanaConnection((connection) =>
    connection.getParsedTransaction(input.txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    })
  );

  if (!parsedTx || parsedTx.meta?.err) {
    throw AppError.badRequest(
      "Transaksi lelang tidak ditemukan atau gagal dikonfirmasi di Solana."
    );
  }

  const accountKeys = parsedTx.transaction.message.accountKeys.map((item) => ({
    pubkey: item.pubkey.toBase58(),
    signer: item.signer,
  }));

  const signerMatch = accountKeys.some(
    (acc) => acc.pubkey === input.expectedSignerWallet && acc.signer
  );
  if (!signerMatch) {
    throw AppError.forbidden(
      "Signer transaksi Solana tidak cocok dengan wallet akun yang sedang login."
    );
  }

  const targetProgram = NUSA_AUCTION_PROGRAM_ID.toBase58();
  const invokedAuctionProgram = parsedTx.transaction.message.instructions.some(
    (ix) => ix.programId.toBase58() === targetProgram
  );
  if (!invokedAuctionProgram) {
    throw AppError.badRequest(
      "Transaksi tidak memanggil smart contract Nusa Auction yang sah."
    );
  }

  if (
    input.expectedAuctionPda &&
    !accountKeys.some((acc) => acc.pubkey === input.expectedAuctionPda)
  ) {
    throw AppError.badRequest(
      "Transaksi tidak menargetkan PDA lelang yang dimaksud."
    );
  }

  invalidateNusaTokenCache(input.expectedSignerWallet);
  invalidateWalletAssetCache(input.expectedSignerWallet);
}
