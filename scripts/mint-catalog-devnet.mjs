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
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bs58 from "bs58";

const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);
const TOKEN_2022_MINT_WITH_POINTER_SPACE = 234;

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

function encodeBorshString(value) {
  const bytes = Buffer.from(value, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

function buildMetadataPointerInitIx(mint, authority) {
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data: Buffer.concat([
      Buffer.from([39, 0]),
      Buffer.from(authority.toBytes()),
      Buffer.from(mint.toBytes()),
    ]),
  });
}

function buildInitializeMint2Ix(mint, decimals, mintAuthority, freezeAuthority) {
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data: Buffer.concat([
      Buffer.from([20, decimals]),
      Buffer.from(mintAuthority.toBytes()),
      Buffer.from([1]),
      Buffer.from(freezeAuthority.toBytes()),
    ]),
  });
}

function buildInitializeTokenMetadataIx({ mint, updateAuthority, mintAuthority, name, symbol, uri }) {
  const disc = createHash("sha256")
    .update("spl_token_metadata_interface:initialize_account")
    .digest()
    .subarray(0, 8);
  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([
      disc,
      encodeBorshString(name),
      encodeBorshString(symbol),
      encodeBorshString(uri),
    ]),
  });
}

async function sendAndConfirmHttp(connection, tx, signers) {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  await tx.sign(...signers);
  const raw = await tx.serialize();
  const sig = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await connection.getSignatureStatuses([sig]);
    const status = statusRes?.value?.[0];
    if (status?.err) {
      throw new Error(`Tx ${sig} failed: ${JSON.stringify(status.err)}`);
    }
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return sig;
    }
  }
  throw new Error(`Tx ${sig} confirmation timeout`);
}

async function main() {
  const envMap = loadEnvFile(path.join(process.cwd(), ".env"));
  const databaseUrl = process.env.DATABASE_URL || envMap.DATABASE_URL;
  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    envMap.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    envMap.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.devnet.solana.com";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    envMap.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  const rawKey =
    process.env.SOLANA_SETTLER_PRIVATE_KEY ||
    envMap.SOLANA_SETTLER_PRIVATE_KEY ||
    process.env.SOLANA_DEPLOYER_PRIVATE_KEY ||
    envMap.SOLANA_DEPLOYER_PRIVATE_KEY;

  if (!databaseUrl || !rawKey) {
    console.error("Error: DATABASE_URL and SOLANA_SETTLER_PRIVATE_KEY must be set in .env");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  const connection = new Connection(rpcUrl, "confirmed");
  const settler = await Keypair.fromSecretKey(decodePrivateKey(rawKey.trim()));

  const cards = await prisma.card.findMany({
    where: {
      isCustom: false,
      isRareEdition: false,
      publicationStatus: "ACTIVE",
      mintAddress: null,
    },
    orderBy: { code: "asc" },
    select: { id: true, code: true, slug: true, name: true },
  });

  console.log(`Found ${cards.length} regular cards without Token-2022 mintAddress.`);
  let created = 0;

  for (const card of cards) {
    const metadataUri = `${appUrl}/api/v1/cards/${card.slug}/metadata.json`;
    const mintKeypair = await Keypair.generate();
    const estimatedSpace =
      TOKEN_2022_MINT_WITH_POINTER_SPACE +
      128 +
      Buffer.byteLength(card.name, "utf8") +
      4 +
      Buffer.byteLength(metadataUri, "utf8");
    const rentLamports = await connection.getMinimumBalanceForRentExemption(estimatedSpace);

    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: settler.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: TOKEN_2022_MINT_WITH_POINTER_SPACE,
        lamports: rentLamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      buildMetadataPointerInitIx(mintKeypair.publicKey, settler.publicKey),
      buildInitializeMint2Ix(mintKeypair.publicKey, 0, settler.publicKey, settler.publicKey),
      buildInitializeTokenMetadataIx({
        mint: mintKeypair.publicKey,
        updateAuthority: settler.publicKey,
        mintAuthority: settler.publicKey,
        name: card.name.slice(0, 32),
        symbol: "NUSA",
        uri: metadataUri,
      })
    );

    const sig = await sendAndConfirmHttp(connection, tx, [settler, mintKeypair]);

    const mintAddress = mintKeypair.publicKey.toBase58();
    await prisma.card.update({
      where: { id: card.id },
      data: {
        tokenStandard: "TOKEN_2022",
        mintAddress,
        metadataUri,
      },
    });

    created += 1;
    console.log(`[${created}/${cards.length}] ${card.code} (${card.slug}) -> ${mintAddress} (tx: ${sig})`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  await prisma.$disconnect();
  console.log(`Done! Created ${created} Token-2022 card mints on Devnet.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
