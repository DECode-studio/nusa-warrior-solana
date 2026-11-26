import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";

const PROGRAM_ID = new PublicKey("7WdVgAhEJkaULUF2QnW3a6jqJyc6QeQeKnbN32rTDmJ5");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const DECIMALS_MULTIPLIER = 1_000_000n;

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const result = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function upsertEnvKeys(envPath, updates) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      if (content.length > 0 && !content.endsWith("\n")) content += "\n";
      content += `${key}=${value}\n`;
    }
  }
  fs.writeFileSync(envPath, content, "utf8");
}

function decodePrivateKey(raw) {
  if (!raw) return null;
  if (raw.startsWith("[")) return Uint8Array.from(JSON.parse(raw));
  return bs58.decode(raw);
}

function anchorDisc(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function encodeU16LE(v) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(v, 0);
  return b;
}

function encodeU64LE(v) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(v), 0);
  return b;
}

function sortMintsCanonical(mint1, mint2) {
  return Buffer.compare(mint1.toBytes(), mint2.toBytes()) < 0
    ? [mint1, mint2]
    : [mint2, mint1];
}

async function derivePoolPda(mintA, mintB) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("amm_pool"), mintA.toBytes(), mintB.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

async function deriveAta(owner, mint) {
  const [ata] = await PublicKey.findProgramAddress(
    [owner.toBytes(), TOKEN_2022_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}

function buildCreateAtaIdempotentIx({ payer, ata, owner, mint }) {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]),
  });
}

function buildMintToIx({ mint, destinationAta, authority, amount }) {
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: destinationAta, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([7]), encodeU64LE(amount)]),
  });
}

async function sendAndConfirm(connection, tx, signers) {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  await tx.sign(...signers);
  const raw = await tx.serialize();
  const sig = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await connection.getSignatureStatuses([sig]);
    const st = statusRes?.value?.[0];
    if (st?.err) throw new Error(`Tx ${sig} failed: ${JSON.stringify(st.err)}`);
    if (st?.confirmationStatus === "confirmed" || st?.confirmationStatus === "finalized") {
      return sig;
    }
  }
  throw new Error(`Tx ${sig} timeout`);
}

async function initAndSeedPool(connection, authority, label, mint1, amount1, mint2, amount2) {
  const [mintA, mintB] = sortMintsCanonical(mint1, mint2);
  const amountA = mintA.equals(mint1) ? amount1 : amount2;
  const amountB = mintB.equals(mint2) ? amount2 : amount1;

  const poolPda = await derivePoolPda(mintA, mintB);
  const vaultA = await deriveAta(poolPda, mintA);
  const vaultB = await deriveAta(poolPda, mintB);
  const authAtaA = await deriveAta(authority.publicKey, mintA);
  const authAtaB = await deriveAta(authority.publicKey, mintB);

  const poolInfo = await connection.getAccountInfo(poolPda, "confirmed");
  if (!poolInfo) {
    console.log(`[${label}] Initializing Pool PDA ${poolPda.toBase58()}...`);
    const initIx = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: mintA, isSigner: false, isWritable: false },
        { pubkey: mintB, isSigner: false, isWritable: false },
        { pubkey: poolPda, isSigner: false, isWritable: true },
        { pubkey: vaultA, isSigner: false, isWritable: true },
        { pubkey: vaultB, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.concat([anchorDisc("initialize_pool"), encodeU16LE(30)]),
    });
    const sig = await sendAndConfirm(connection, new Transaction().add(initIx), [authority]);
    console.log(`[${label}] Pool initialized (tx: ${sig})`);
  } else {
    console.log(`[${label}] Pool PDA already exists: ${poolPda.toBase58()}`);
  }

  const vaultABal = await connection.getTokenAccountBalance(vaultA, "confirmed").catch(() => null);
  if (!vaultABal || BigInt(vaultABal.value.amount || "0") === 0n) {
    console.log(`[${label}] Minting & adding initial liquidity to Anchor Pool Vaults...`);
    const tx = new Transaction().add(
      buildCreateAtaIdempotentIx({
        payer: authority.publicKey,
        ata: authAtaA,
        owner: authority.publicKey,
        mint: mintA,
      }),
      buildCreateAtaIdempotentIx({
        payer: authority.publicKey,
        ata: authAtaB,
        owner: authority.publicKey,
        mint: mintB,
      }),
      buildMintToIx({
        mint: mintA,
        destinationAta: authAtaA,
        authority: authority.publicKey,
        amount: amountA,
      }),
      buildMintToIx({
        mint: mintB,
        destinationAta: authAtaB,
        authority: authority.publicKey,
        amount: amountB,
      }),
      new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: authority.publicKey, isSigner: true, isWritable: true },
          { pubkey: poolPda, isSigner: false, isWritable: false },
          { pubkey: mintA, isSigner: false, isWritable: false },
          { pubkey: mintB, isSigner: false, isWritable: false },
          { pubkey: vaultA, isSigner: false, isWritable: true },
          { pubkey: vaultB, isSigner: false, isWritable: true },
          { pubkey: authAtaA, isSigner: false, isWritable: true },
          { pubkey: authAtaB, isSigner: false, isWritable: true },
          { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          anchorDisc("add_liquidity"),
          encodeU64LE(amountA),
          encodeU64LE(amountB),
        ]),
      })
    );
    const sig = await sendAndConfirm(connection, tx, [authority]);
    console.log(`[${label}] Liquidity added on-chain (tx: ${sig})`);
  } else {
    console.log(`[${label}] Vault already has liquidity (${vaultABal.value.uiAmountString})`);
  }
}

async function main() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, ".env");
  const envMap = loadEnvFile(envPath);

  const rawKey =
    process.env.SOLANA_SETTLER_PRIVATE_KEY ||
    envMap.SOLANA_SETTLER_PRIVATE_KEY ||
    process.env.SOLANA_DEPLOYER_PRIVATE_KEY ||
    envMap.SOLANA_DEPLOYER_PRIVATE_KEY;
  if (!rawKey) throw new Error("Missing SOLANA_SETTLER_PRIVATE_KEY");

  const secretBytes = decodePrivateKey(rawKey);
  const authority = await Keypair.fromSecretKey(secretBytes);

  const rpcUrl = "https://devnet.helius-rpc.com/?api-key=215cfc81-8eb2-4b09-b8fa-9a7862223eeb";
  const connection = new Connection(rpcUrl, "confirmed");
  const solBal = await connection.getBalance(authority.publicKey);
  console.log(`Authority: ${authority.publicKey.toBase58()} | Balance: ${(Number(solBal) / 1e9).toFixed(4)} SOL`);

  // 1. Deploy .so if not deployed yet
  const progInfo = await connection.getAccountInfo(PROGRAM_ID, "confirmed");
  if (!progInfo) {
    const tmpKeypairPath = path.join(os.tmpdir(), `nusa-amm-deployer-${process.pid}.json`);
    fs.writeFileSync(tmpKeypairPath, JSON.stringify(Array.from(secretBytes)), { mode: 0o600 });
    try {
      const solanaBin = path.join(os.homedir(), ".local/share/solana/install/active_release/bin/solana");
      const soPath = path.join(projectRoot, "programs/nusa-amm-dex/target/deploy/nusa_amm_dex.so");
      const progKpPath = path.join(projectRoot, "programs/nusa-amm-dex/target/deploy/nusa_amm_dex-keypair.json");
      console.log(`Deploying ${soPath} to Devnet...`);
      execFileSync(
        solanaBin,
        [
          "program",
          "deploy",
          soPath,
          "--program-id",
          progKpPath,
          "--url",
          rpcUrl,
          "--keypair",
          tmpKeypairPath,
          "--with-compute-unit-price",
          "5000",
        ],
        { stdio: "inherit" }
      );
    } finally {
      if (fs.existsSync(tmpKeypairPath)) fs.unlinkSync(tmpKeypairPath);
    }
  } else {
    console.log(`Program ${PROGRAM_ID.toBase58()} already deployed on Devnet.`);
  }

  // 2. Initialize & seed 3 pools
  const nusaMint = new PublicKey(envMap.NEXT_PUBLIC_NUSA_TOKEN_MINT);
  const idrcMint = new PublicKey(envMap.NEXT_PUBLIC_IDRC_TOKEN_MINT);
  const usdcMint = new PublicKey(envMap.NEXT_PUBLIC_USDC_TOKEN_MINT);

  await initAndSeedPool(
    connection,
    authority,
    "IDRC_NUSA",
    idrcMint,
    10_000_000n * DECIMALS_MULTIPLIER,
    nusaMint,
    10_000_000n * DECIMALS_MULTIPLIER
  );
  await initAndSeedPool(
    connection,
    authority,
    "USDC_NUSA",
    usdcMint,
    1_000n * DECIMALS_MULTIPLIER,
    nusaMint,
    16_000_000n * DECIMALS_MULTIPLIER
  );
  await initAndSeedPool(
    connection,
    authority,
    "IDRC_USDC",
    idrcMint,
    16_000_000n * DECIMALS_MULTIPLIER,
    usdcMint,
    1_000n * DECIMALS_MULTIPLIER
  );

  upsertEnvKeys(envPath, {
    NEXT_PUBLIC_NUSA_AMM_DEX_PROGRAM_ID: PROGRAM_ID.toBase58(),
  });
  console.log("=== Anchor AMM DEX Devnet Deploy & Init Complete ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
