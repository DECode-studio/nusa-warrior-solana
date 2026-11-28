import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

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

function decodePrivateKey(raw) {
  if (!raw) return null;
  if (raw.startsWith("[")) {
    return Uint8Array.from(JSON.parse(raw));
  }
  return bs58.decode(raw);
}

function anchorDiscriminator(ixName) {
  return createHash("sha256")
    .update(`global:${ixName}`)
    .digest()
    .subarray(0, 8);
}

function encodeU16LE(value) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value, 0);
  return buf;
}

function encodeU64LE(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value), 0);
  return buf;
}

function encodeI64LE(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value), 0);
  return buf;
}

async function main() {
  const projectRoot = process.cwd();
  const envMap = loadEnvFile(path.join(projectRoot, ".env"));

  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    envMap.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    envMap.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.devnet.solana.com";

  const programIdStr =
    process.env.NEXT_PUBLIC_NUSA_AUCTION_PROGRAM_ID ||
    envMap.NEXT_PUBLIC_NUSA_AUCTION_PROGRAM_ID ||
    "JCQUebAXm8eqkU7XW3ZUgho69cJQV4BtPmYTuyHxDahd";

  const nusaMintStr =
    process.env.NEXT_PUBLIC_NUSA_TOKEN_MINT ||
    envMap.NEXT_PUBLIC_NUSA_TOKEN_MINT;

  if (!nusaMintStr) {
    console.error("Error: Set NEXT_PUBLIC_NUSA_TOKEN_MINT in .env first.");
    process.exit(1);
  }

  const rawDeployer =
    process.env.SOLANA_DEPLOYER_PRIVATE_KEY ||
    envMap.SOLANA_DEPLOYER_PRIVATE_KEY ||
    process.env.SOLANA_SETTLER_PRIVATE_KEY ||
    envMap.SOLANA_SETTLER_PRIVATE_KEY;

  const rawSettler =
    process.env.SOLANA_SETTLER_PRIVATE_KEY ||
    envMap.SOLANA_SETTLER_PRIVATE_KEY ||
    rawDeployer;

  if (!rawDeployer) {
    console.error(
      "Error: Set SOLANA_DEPLOYER_PRIVATE_KEY or SOLANA_SETTLER_PRIVATE_KEY in .env."
    );
    process.exit(1);
  }

  const adminKeypair = await Keypair.fromSecretKey(
    decodePrivateKey(rawDeployer.trim())
  );
  const settlerKeypair = await Keypair.fromSecretKey(
    decodePrivateKey(rawSettler.trim())
  );

  const feeTreasuryStr =
    process.env.SOLANA_AUCTION_FEE_TREASURY ||
    envMap.SOLANA_AUCTION_FEE_TREASURY ||
    adminKeypair.publicKey.toBase58();

  const programId = new PublicKey(programIdStr);
  const nusaMint = new PublicKey(nusaMintStr);
  const feeTreasury = new PublicKey(feeTreasuryStr);
  const connection = new Connection(rpcUrl, "confirmed");

  const [configPda] = await PublicKey.findProgramAddress(
    [Buffer.from("auction_config")],
    programId
  );

  const existing = await connection.getAccountInfo(configPda, "confirmed");
  if (existing) {
    console.log("AuctionConfig PDA already initialized:", configPda.toBase58());
    return;
  }

  // 10% fee (1000 bps), 50 NUSA min increment, 50 NUSA min start, 1h..24h duration
  const data = Buffer.concat([
    anchorDiscriminator("initialize_config"),
    Buffer.from(settlerKeypair.publicKey.toBytes()),
    Buffer.from(feeTreasury.toBytes()),
    encodeU16LE(1000),
    encodeU64LE(50_000_000n),
    encodeU64LE(50_000_000n),
    encodeI64LE(3_600n),
    encodeI64LE(86_400n),
  ]);

  const ix = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: nusaMint, isSigner: false, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(ix);
  const signature = await sendAndConfirmTransaction(
    connection,
    tx,
    [adminKeypair],
    { commitment: "confirmed" }
  );

  console.log("AuctionConfig initialized successfully!");
  console.log("Config PDA:", configPda.toBase58());
  console.log("NUSA Mint:", nusaMint.toBase58());
  console.log("Fee Treasury (10%):", feeTreasury.toBase58());
  console.log("Tx Signature:", signature);
  console.log(`Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
