import "server-only";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AppError } from "@/server/shared/errors/app-error";
import {
  TOKEN_2022_PROGRAM_ID,
  executeWithSolanaConnection,
} from "./solana-config";
import {
  deriveAssociatedTokenAddress,
  getSettlerKeypairFromEnv,
} from "./nusa-vault-tx-builder.service";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const NUSA_TOKEN_DECIMALS = 6;
export const NUSA_DECIMALS_MULTIPLIER = 1_000_000n;

export type NusaEcosystemTokenSymbol = "NUSA" | "IDRC" | "USDC";

export interface WalletTokenBalancesDto {
  walletAddress: string;
  nusa: number;
  idrc: number;
  usdc: number;
  nusaBaseUnits: string;
  idrcBaseUnits: string;
  usdcBaseUnits: string;
}

interface BalanceCacheEntry {
  expiresAt: number;
  balances: WalletTokenBalancesDto;
}

const BALANCE_CACHE_TTL_MS = 15_000;
const balanceCache = new Map<string, BalanceCacheEntry>();

export function invalidateNusaTokenCache(walletAddress?: string): void {
  if (walletAddress) {
    balanceCache.delete(walletAddress);
    return;
  }
  balanceCache.clear();
}

export function getTokenMintAddress(symbol: NusaEcosystemTokenSymbol): PublicKey {
  const envKey =
    symbol === "NUSA"
      ? process.env.NEXT_PUBLIC_NUSA_TOKEN_MINT?.trim()
      : symbol === "IDRC"
        ? process.env.NEXT_PUBLIC_IDRC_TOKEN_MINT?.trim()
        : process.env.NEXT_PUBLIC_USDC_TOKEN_MINT?.trim();

  if (!envKey) {
    throw AppError.internal(
      `Mint address untuk token ${symbol} belum dikonfigurasi di .env.`
    );
  }
  return new PublicKey(envKey);
}

export function toTokenBaseUnits(uiAmount: number): bigint {
  if (!Number.isFinite(uiAmount) || uiAmount <= 0) {
    throw AppError.badRequest("Jumlah token harus lebih besar dari 0.");
  }
  // Round to 6 decimals cleanly to avoid float precision drift
  const scaled = Math.round(uiAmount * 1_000_000);
  if (scaled <= 0) {
    throw AppError.badRequest("Jumlah token terlalu kecil (minimal 0.000001).");
  }
  return BigInt(scaled);
}

export function fromTokenBaseUnits(baseUnits: bigint): number {
  return Number(baseUnits) / 1_000_000;
}

function encodeU64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
}

export function buildCreateAtaIdempotentIx(input: {
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
    data: Buffer.from([1]),
  });
}

export function buildToken2022MintToIx(input: {
  mint: PublicKey;
  destinationAta: PublicKey;
  authority: PublicKey;
  amountBaseUnits: bigint;
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: input.mint, isSigner: false, isWritable: true },
      { pubkey: input.destinationAta, isSigner: false, isWritable: true },
      { pubkey: input.authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([7]), encodeU64LE(input.amountBaseUnits)]),
  });
}

export function buildToken2022TransferCheckedIx(input: {
  sourceAta: PublicKey;
  mint: PublicKey;
  destinationAta: PublicKey;
  authority: PublicKey;
  amountBaseUnits: bigint;
  decimals?: number;
}): TransactionInstruction {
  // Token-2022 TransferChecked = instruction 12
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: input.sourceAta, isSigner: false, isWritable: true },
      { pubkey: input.mint, isSigner: false, isWritable: false },
      { pubkey: input.destinationAta, isSigner: false, isWritable: true },
      { pubkey: input.authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([
      Buffer.from([12]),
      encodeU64LE(input.amountBaseUnits),
      Buffer.from([input.decimals ?? NUSA_TOKEN_DECIMALS]),
    ]),
  });
}

export function buildToken2022BurnCheckedIx(input: {
  sourceAta: PublicKey;
  mint: PublicKey;
  authority: PublicKey;
  amountBaseUnits: bigint;
  decimals?: number;
}): TransactionInstruction {
  // Token-2022 BurnChecked = instruction 15
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: input.sourceAta, isSigner: false, isWritable: true },
      { pubkey: input.mint, isSigner: false, isWritable: true },
      { pubkey: input.authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([
      Buffer.from([15]),
      encodeU64LE(input.amountBaseUnits),
      Buffer.from([input.decimals ?? NUSA_TOKEN_DECIMALS]),
    ]),
  });
}

export async function getWalletTokenBalances(
  walletAddress: string
): Promise<WalletTokenBalancesDto> {
  const cached = balanceCache.get(walletAddress);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.balances;
  }

  const owner = new PublicKey(walletAddress);
  const nusaMint = getTokenMintAddress("NUSA").toBase58();
  const idrcMint = getTokenMintAddress("IDRC").toBase58();
  const usdcMint = getTokenMintAddress("USDC").toBase58();

  const response = await executeWithSolanaConnection((connection) =>
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_2022_PROGRAM_ID,
    })
  );

  let nusaBase = 0n;
  let idrcBase = 0n;
  let usdcBase = 0n;

  for (const item of response.value) {
    const info = (
      item.account.data as {
        parsed?: {
          info?: {
            mint?: string;
            tokenAmount?: { amount?: string };
          };
        };
      }
    )?.parsed?.info;
    const mint = info?.mint;
    const rawAmount = info?.tokenAmount?.amount;
    if (!mint || !rawAmount) continue;
    const amt = BigInt(rawAmount);
    if (mint === nusaMint) nusaBase += amt;
    else if (mint === idrcMint) idrcBase += amt;
    else if (mint === usdcMint) usdcBase += amt;
  }

  const balances: WalletTokenBalancesDto = {
    walletAddress,
    nusa: fromTokenBaseUnits(nusaBase),
    idrc: fromTokenBaseUnits(idrcBase),
    usdc: fromTokenBaseUnits(usdcBase),
    nusaBaseUnits: nusaBase.toString(),
    idrcBaseUnits: idrcBase.toString(),
    usdcBaseUnits: usdcBase.toString(),
  };

  balanceCache.set(walletAddress, {
    expiresAt: Date.now() + BALANCE_CACHE_TTL_MS,
    balances,
  });

  return balances;
}

export async function buildMintTokenTransaction(input: {
  recipientWallet: string;
  symbol: NusaEcosystemTokenSymbol;
  uiAmount: number;
}): Promise<{
  serializedTransaction: string;
  mintAddress: string;
  amountBaseUnits: string;
  recentBlockhash: string;
}> {
  const settler = await getSettlerKeypairFromEnv();
  if (!settler) {
    throw AppError.internal(
      "SOLANA_SETTLER_PRIVATE_KEY belum dikonfigurasi di server."
    );
  }

  const recipient = new PublicKey(input.recipientWallet);
  const mint = getTokenMintAddress(input.symbol);
  const ata = await deriveAssociatedTokenAddress(
    recipient,
    mint,
    TOKEN_2022_PROGRAM_ID
  );
  const amountBaseUnits = toTokenBaseUnits(input.uiAmount);

  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );

  const tx = new Transaction({
    feePayer: recipient,
    recentBlockhash: blockhash,
  }).add(
    buildCreateAtaIdempotentIx({
      payer: recipient,
      ata,
      owner: recipient,
      mint,
    }),
    buildToken2022MintToIx({
      mint,
      destinationAta: ata,
      authority: settler.publicKey,
      amountBaseUnits,
    })
  );

  await tx.partialSign(settler);

  return {
    serializedTransaction: Buffer.from(
      await tx.serialize({ requireAllSignatures: false })
    ).toString("base64"),
    mintAddress: mint.toBase58(),
    amountBaseUnits: amountBaseUnits.toString(),
    recentBlockhash: blockhash,
  };
}

export async function buildBurnNusaTransaction(input: {
  ownerWallet: string;
  uiAmount: number;
}): Promise<{
  serializedTransaction: string;
  mintAddress: string;
  amountBaseUnits: string;
  recentBlockhash: string;
}> {
  const owner = new PublicKey(input.ownerWallet);
  const mint = getTokenMintAddress("NUSA");
  const ata = await deriveAssociatedTokenAddress(
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID
  );
  const amountBaseUnits = toTokenBaseUnits(input.uiAmount);

  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );

  const tx = new Transaction({
    feePayer: owner,
    recentBlockhash: blockhash,
  }).add(
    buildToken2022BurnCheckedIx({
      sourceAta: ata,
      mint,
      authority: owner,
      amountBaseUnits,
      decimals: NUSA_TOKEN_DECIMALS,
    })
  );

  return {
    serializedTransaction: Buffer.from(
      await tx.serialize({ requireAllSignatures: false })
    ).toString("base64"),
    mintAddress: mint.toBase58(),
    amountBaseUnits: amountBaseUnits.toString(),
    recentBlockhash: blockhash,
  };
}

export async function verifyNusaBurnTransaction(input: {
  txSignature: string;
  expectedOwnerWallet: string;
  minUiAmount: number;
}): Promise<{ amountBaseUnits: bigint }> {
  const expectedMint = getTokenMintAddress("NUSA").toBase58();
  const minBaseUnits = toTokenBaseUnits(input.minUiAmount);

  const parsedTx = await executeWithSolanaConnection((connection) =>
    connection.getParsedTransaction(input.txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    })
  );

  if (!parsedTx || parsedTx.meta?.err) {
    throw AppError.badRequest(
      "Transaksi burn NUSA tidak ditemukan atau gagal dikonfirmasi di Solana."
    );
  }

  let burnedAmount = 0n;
  for (const ix of parsedTx.transaction.message.instructions) {
    const parsedIx = ix as {
      programId?: { toBase58?: () => string };
      parsed?: {
        type?: string;
        info?: {
          mint?: string;
          authority?: string;
          tokenAmount?: { amount?: string };
          amount?: string;
        };
      };
    };
    const pid = parsedIx.programId?.toBase58?.();
    if (pid !== TOKEN_2022_PROGRAM_ID.toBase58()) continue;
    const type = parsedIx.parsed?.type;
    const info = parsedIx.parsed?.info;
    if (
      (type === "burnChecked" || type === "burn") &&
      info?.mint === expectedMint &&
      info?.authority === input.expectedOwnerWallet
    ) {
      const raw = info.tokenAmount?.amount ?? info.amount;
      if (raw) {
        burnedAmount += BigInt(raw);
      }
    }
  }

  if (burnedAmount < minBaseUnits) {
    throw AppError.badRequest(
      `Jumlah NUSA yang di-burn (${fromTokenBaseUnits(burnedAmount)} NUSA) kurang dari tagihan (${input.minUiAmount} NUSA).`
    );
  }

  invalidateNusaTokenCache(input.expectedOwnerWallet);
  return { amountBaseUnits: burnedAmount };
}

export async function verifyNusaMintTransaction(input: {
  txSignature: string;
  expectedRecipientWallet: string;
  minUiAmount: number;
}): Promise<{ amountBaseUnits: bigint }> {
  const expectedMint = getTokenMintAddress("NUSA").toBase58();
  const expectedAta = (
    await deriveAssociatedTokenAddress(
      new PublicKey(input.expectedRecipientWallet),
      new PublicKey(expectedMint),
      TOKEN_2022_PROGRAM_ID
    )
  ).toBase58();
  const minBaseUnits = toTokenBaseUnits(input.minUiAmount);

  const parsedTx = await executeWithSolanaConnection((connection) =>
    connection.getParsedTransaction(input.txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    })
  );

  if (!parsedTx || parsedTx.meta?.err) {
    throw AppError.badRequest(
      "Transaksi claim NUSA tidak ditemukan atau gagal dikonfirmasi di Solana."
    );
  }

  let mintedAmount = 0n;
  for (const ix of parsedTx.transaction.message.instructions) {
    const parsedIx = ix as {
      programId?: { toBase58?: () => string };
      parsed?: {
        type?: string;
        info?: {
          mint?: string;
          account?: string;
          tokenAmount?: { amount?: string };
          amount?: string;
        };
      };
    };
    const pid = parsedIx.programId?.toBase58?.();
    if (pid !== TOKEN_2022_PROGRAM_ID.toBase58()) continue;
    const type = parsedIx.parsed?.type;
    const info = parsedIx.parsed?.info;
    if (
      (type === "mintTo" || type === "mintToChecked") &&
      info?.mint === expectedMint &&
      info?.account === expectedAta
    ) {
      const raw = info.tokenAmount?.amount ?? info.amount;
      if (raw) {
        mintedAmount += BigInt(raw);
      }
    }
  }

  if (mintedAmount < minBaseUnits) {
    throw AppError.badRequest(
      `Jumlah NUSA yang di-claim (${fromTokenBaseUnits(mintedAmount)} NUSA) tidak sesuai.`
    );
  }

  invalidateNusaTokenCache(input.expectedRecipientWallet);
  return { amountBaseUnits: mintedAmount };
}
