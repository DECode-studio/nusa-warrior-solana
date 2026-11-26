import "server-only";
import { createHash } from "node:crypto";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { AppError } from "@/server/shared/errors/app-error";
import {
  NUSA_AMM_DEX_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  executeWithSolanaConnection,
} from "./solana-config";
import { deriveAssociatedTokenAddress } from "./nusa-vault-tx-builder.service";
import {
  type NusaEcosystemTokenSymbol,
  fromTokenBaseUnits,
  getTokenMintAddress,
  toTokenBaseUnits,
} from "./nusa-token.service";

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export type AmmPoolId = "IDRC_NUSA" | "USDC_NUSA" | "IDRC_USDC";

export interface AmmPoolDefinition {
  poolId: AmmPoolId;
  tokenA: NusaEcosystemTokenSymbol;
  tokenB: NusaEcosystemTokenSymbol;
  feeBps: number; // 30 bps = 0.3%
}

export const AMM_POOL_DEFINITIONS: Record<AmmPoolId, AmmPoolDefinition> = {
  IDRC_NUSA: {
    poolId: "IDRC_NUSA",
    tokenA: "IDRC",
    tokenB: "NUSA",
    feeBps: 30,
  },
  USDC_NUSA: {
    poolId: "USDC_NUSA",
    tokenA: "USDC",
    tokenB: "NUSA",
    feeBps: 30,
  },
  IDRC_USDC: {
    poolId: "IDRC_USDC",
    tokenA: "IDRC",
    tokenB: "USDC",
    feeBps: 30,
  },
};

export interface AmmPoolStateDto {
  poolId: AmmPoolId;
  poolOwner: string;
  tokenA: NusaEcosystemTokenSymbol;
  tokenB: NusaEcosystemTokenSymbol;
  reserveA: number;
  reserveB: number;
  reserveABaseUnits: string;
  reserveBBaseUnits: string;
  spotPriceAInB: number;
  spotPriceBInA: number;
  feeBps: number;
}

export interface AmmQuoteDto {
  poolId: AmmPoolId;
  inputSymbol: NusaEcosystemTokenSymbol;
  outputSymbol: NusaEcosystemTokenSymbol;
  inputUiAmount: number;
  outputUiAmount: number;
  minimumOutputUiAmount: number;
  feeUiAmount: number;
  executionPrice: number;
  spotPrice: number;
  priceImpactPct: number;
  slippageBps: number;
  reserveInUi: number;
  reserveOutUi: number;
}

function sortMintsCanonical(
  mint1: PublicKey,
  mint2: PublicKey
): [PublicKey, PublicKey] {
  return Buffer.compare(mint1.toBytes(), mint2.toBytes()) < 0
    ? [mint1, mint2]
    : [mint2, mint1];
}

async function deriveAmmPoolPda(
  canonicalMintA: PublicKey,
  canonicalMintB: PublicKey
): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from("amm_pool"),
      canonicalMintA.toBytes(),
      canonicalMintB.toBytes(),
    ],
    NUSA_AMM_DEX_PROGRAM_ID
  );
  return pda;
}

function anchorDiscriminator(ixName: string): Buffer {
  return createHash("sha256")
    .update(`global:${ixName}`)
    .digest()
    .subarray(0, 8);
}

function encodeU64LE(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
}

async function readAtaBalanceBaseUnits(ata: PublicKey): Promise<bigint> {
  try {
    const res = await executeWithSolanaConnection((connection) =>
      connection.getTokenAccountBalance(ata, "confirmed")
    );
    return BigInt(res.value.amount || "0");
  } catch {
    return 0n;
  }
}

export async function getAmmPoolState(
  poolId: AmmPoolId
): Promise<AmmPoolStateDto> {
  const def = AMM_POOL_DEFINITIONS[poolId];
  if (!def) {
    throw AppError.badRequest(`Pool AMM '${poolId}' tidak valid.`);
  }

  const defMintA = getTokenMintAddress(def.tokenA);
  const defMintB = getTokenMintAddress(def.tokenB);
  const [canonicalMintA, canonicalMintB] = sortMintsCanonical(
    defMintA,
    defMintB
  );
  const poolPda = await deriveAmmPoolPda(canonicalMintA, canonicalMintB);

  const [ataDefA, ataDefB] = await Promise.all([
    deriveAssociatedTokenAddress(poolPda, defMintA, TOKEN_2022_PROGRAM_ID),
    deriveAssociatedTokenAddress(poolPda, defMintB, TOKEN_2022_PROGRAM_ID),
  ]);

  const [reserveABase, reserveBBase] = await Promise.all([
    readAtaBalanceBaseUnits(ataDefA),
    readAtaBalanceBaseUnits(ataDefB),
  ]);

  const reserveA = fromTokenBaseUnits(reserveABase);
  const reserveB = fromTokenBaseUnits(reserveBBase);

  return {
    poolId,
    poolOwner: poolPda.toBase58(),
    tokenA: def.tokenA,
    tokenB: def.tokenB,
    reserveA,
    reserveB,
    reserveABaseUnits: reserveABase.toString(),
    reserveBBaseUnits: reserveBBase.toString(),
    spotPriceAInB: reserveA > 0 ? reserveB / reserveA : 0,
    spotPriceBInA: reserveB > 0 ? reserveA / reserveB : 0,
    feeBps: def.feeBps,
  };
}

export async function getAllAmmPools(): Promise<AmmPoolStateDto[]> {
  return Promise.all([
    getAmmPoolState("IDRC_NUSA"),
    getAmmPoolState("USDC_NUSA"),
    getAmmPoolState("IDRC_USDC"),
  ]);
}

export async function quoteAmmSwap(input: {
  poolId: AmmPoolId;
  inputSymbol: NusaEcosystemTokenSymbol;
  inputUiAmount: number;
  slippageBps?: number;
}): Promise<{
  quote: AmmQuoteDto;
  amountInBase: bigint;
  amountOutBase: bigint;
  minOutBase: bigint;
}> {
  const def = AMM_POOL_DEFINITIONS[input.poolId];
  if (!def) {
    throw AppError.badRequest(`Pool AMM '${input.poolId}' tidak valid.`);
  }
  if (input.inputSymbol !== def.tokenA && input.inputSymbol !== def.tokenB) {
    throw AppError.badRequest(
      `Token ${input.inputSymbol} tidak ada di pool ${input.poolId}.`
    );
  }

  const slippageBps = Math.min(2000, Math.max(10, input.slippageBps ?? 100));
  const poolState = await getAmmPoolState(input.poolId);
  const isAInput = input.inputSymbol === def.tokenA;
  const outputSymbol = isAInput ? def.tokenB : def.tokenA;

  const reserveInBase = BigInt(
    isAInput ? poolState.reserveABaseUnits : poolState.reserveBBaseUnits
  );
  const reserveOutBase = BigInt(
    isAInput ? poolState.reserveBBaseUnits : poolState.reserveABaseUnits
  );

  if (reserveInBase <= 0n || reserveOutBase <= 0n) {
    throw AppError.badRequest(
      `Likuiditas pool ${input.poolId} kosong. Jalankan deploy & init pool terlebih dahulu.`
    );
  }

  const amountInBase = toTokenBaseUnits(input.inputUiAmount);
  const feeDenominator = 10_000n;
  const feeMultiplier = feeDenominator - BigInt(def.feeBps);
  const amountInWithFee = amountInBase * feeMultiplier;
  const numerator = amountInWithFee * reserveOutBase;
  const denominator = reserveInBase * feeDenominator + amountInWithFee;
  const amountOutBase = numerator / denominator;

  if (amountOutBase <= 0n || amountOutBase >= reserveOutBase) {
    throw AppError.badRequest(
      "Output swap terlalu kecil atau melebihi likuiditas pool."
    );
  }

  const minOutBase =
    (amountOutBase * (10_000n - BigInt(slippageBps))) / 10_000n;

  const reserveInUi = fromTokenBaseUnits(reserveInBase);
  const reserveOutUi = fromTokenBaseUnits(reserveOutBase);
  const outputUiAmount = fromTokenBaseUnits(amountOutBase);
  const spotPrice = reserveOutUi / reserveInUi;
  const executionPrice = outputUiAmount / input.inputUiAmount;
  const priceImpactPct =
    spotPrice > 0
      ? Math.max(0, ((spotPrice - executionPrice) / spotPrice) * 100)
      : 0;

  return {
    quote: {
      poolId: input.poolId,
      inputSymbol: input.inputSymbol,
      outputSymbol,
      inputUiAmount: input.inputUiAmount,
      outputUiAmount,
      minimumOutputUiAmount: fromTokenBaseUnits(minOutBase),
      feeUiAmount: (input.inputUiAmount * def.feeBps) / 10_000,
      executionPrice,
      spotPrice,
      priceImpactPct: Number(priceImpactPct.toFixed(4)),
      slippageBps,
      reserveInUi,
      reserveOutUi,
    },
    amountInBase,
    amountOutBase,
    minOutBase,
  };
}

export async function buildAmmSwapTransaction(input: {
  traderWallet: string;
  poolId: AmmPoolId;
  inputSymbol: NusaEcosystemTokenSymbol;
  inputUiAmount: number;
  slippageBps?: number;
}): Promise<{
  serializedTransaction: string;
  quote: AmmQuoteDto;
  poolOwner: string;
  recentBlockhash: string;
}> {
  const { quote, amountInBase, minOutBase } = await quoteAmmSwap(input);
  const trader = new PublicKey(input.traderWallet);
  const inputMint = getTokenMintAddress(quote.inputSymbol);
  const outputMint = getTokenMintAddress(quote.outputSymbol);

  // Canonical mint ordering matching the Anchor Pool PDA seeds
  const [mintA, mintB] = sortMintsCanonical(inputMint, outputMint);
  const aToB = inputMint.equals(mintA);
  const poolPda = await deriveAmmPoolPda(mintA, mintB);

  const [vaultA, vaultB, traderAtaA, traderAtaB] = await Promise.all([
    deriveAssociatedTokenAddress(poolPda, mintA, TOKEN_2022_PROGRAM_ID),
    deriveAssociatedTokenAddress(poolPda, mintB, TOKEN_2022_PROGRAM_ID),
    deriveAssociatedTokenAddress(trader, mintA, TOKEN_2022_PROGRAM_ID),
    deriveAssociatedTokenAddress(trader, mintB, TOKEN_2022_PROGRAM_ID),
  ]);

  const swapIx = new TransactionInstruction({
    programId: NUSA_AMM_DEX_PROGRAM_ID,
    keys: [
      { pubkey: trader, isSigner: true, isWritable: true },
      { pubkey: poolPda, isSigner: false, isWritable: false },
      { pubkey: mintA, isSigner: false, isWritable: false },
      { pubkey: mintB, isSigner: false, isWritable: false },
      { pubkey: vaultA, isSigner: false, isWritable: true },
      { pubkey: vaultB, isSigner: false, isWritable: true },
      { pubkey: traderAtaA, isSigner: false, isWritable: true },
      { pubkey: traderAtaB, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      anchorDiscriminator("swap"),
      encodeU64LE(amountInBase),
      encodeU64LE(minOutBase),
      Buffer.from([aToB ? 1 : 0]),
    ]),
  });

  const { blockhash } = await executeWithSolanaConnection((connection) =>
    connection.getLatestBlockhash("confirmed")
  );

  const tx = new Transaction({
    feePayer: trader,
    recentBlockhash: blockhash,
  }).add(swapIx);

  return {
    serializedTransaction: Buffer.from(
      await tx.serialize({ requireAllSignatures: false })
    ).toString("base64"),
    quote,
    poolOwner: poolPda.toBase58(),
    recentBlockhash: blockhash,
  };
}
