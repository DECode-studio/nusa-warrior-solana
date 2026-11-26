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
} from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bs58 from "bs58";
import sharp from "sharp";

const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

// Mint base (82) + AccountType/padding (83) + MetadataPointer TLV (68) = 234 bytes
const TOKEN_2022_MINT_WITH_POINTER_SPACE = 234;
const TOKEN_DECIMALS = 6;
const DECIMALS_MULTIPLIER = 1_000_000n;

const IDRC_ICON_URL =
  "https://coffee-wrong-salmon-682.mypinata.cloud/ipfs/bafkreiahihn36hey5zwdatsoswpfou7mqf2d2bjpl46dwze6gucap33a4a";
const USDC_ICON_URL =
  "https://coffee-wrong-salmon-682.mypinata.cloud/ipfs/bafkreidz7rg3onsgiybj4qbd4hw57q4j7i4xrchesiqolnznlgxd7qpsmm";

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
      if (content.length > 0 && !content.endsWith("\n")) {
        content += "\n";
      }
      content += `${key}=${value}\n`;
    }
  }
  fs.writeFileSync(envPath, content, "utf8");
}

function decodePrivateKey(raw) {
  if (!raw) return null;
  if (raw.startsWith("[")) {
    return Uint8Array.from(JSON.parse(raw));
  }
  return bs58.decode(raw);
}

async function derivePoolKeypair(settlerSecretKey, poolId) {
  const seed = createHash("sha256")
    .update(Buffer.from(settlerSecretKey))
    .update(`:nusa-amm-pool:${poolId}`)
    .digest()
    .subarray(0, 32);
  return Keypair.fromSeed(seed);
}

function encodeBorshString(value) {
  const bytes = Buffer.from(value, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

function encodeU64LE(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value), 0);
  return buf;
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

function buildInitializeTokenMetadataIx({
  mint,
  updateAuthority,
  mintAuthority,
  name,
  symbol,
  uri,
}) {
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

async function pinFileToPinata(jwt, gatewayBase, buffer, fileName, mimeType) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: mimeType }),
    fileName
  );
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `nusa-token-${fileName}` })
  );

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Pinata pinFileToIPFS failed (${response.status}): ${await response.text()}`);
  }
  const data = await response.json();
  return `${gatewayBase}/ipfs/${data.IpfsHash}`;
}

async function pinJsonToPinata(jwt, gatewayBase, name, content) {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: content,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`Pinata pinJSONToIPFS failed (${response.status}): ${await response.text()}`);
  }
  const data = await response.json();
  return `${gatewayBase}/ipfs/${data.IpfsHash}`;
}

async function loadRpcPoolFromDb(databaseUrl, fallbackUrl) {
  if (!databaseUrl) return [fallbackUrl];
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  try {
    const rows = await prisma.solanaRpcEndpoint.findMany({
      where: { network: "devnet", isActive: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: { url: true },
    });
    const urls = rows
      .map((r) => r.url.trim())
      .filter((u) => /^https?:\/\//i.test(u));
    // Prefer non-public RPCs first (Helius/Alchemy) before api.devnet.solana.com
    const sorted = [...new Set(urls)].sort((a, b) => {
      const aPub = a.includes("api.devnet.solana.com") ? 1 : 0;
      const bPub = b.includes("api.devnet.solana.com") ? 1 : 0;
      return aPub - bPub;
    });
    return sorted.length > 0 ? sorted : [fallbackUrl];
  } catch (err) {
    console.warn("Could not load RPC pool from DB, using fallback:", err.message);
    return [fallbackUrl];
  } finally {
    await prisma.$disconnect();
  }
}

function createRpcExecutor(rpcPool) {
  let idx = 0;
  const cooldownUntil = new Map();
  const connections = new Map();

  function pickConnection() {
    const now = Date.now();
    for (let i = 0; i < rpcPool.length; i += 1) {
      const candidate = rpcPool[(idx + i) % rpcPool.length];
      if ((cooldownUntil.get(candidate) ?? 0) <= now) {
        idx = (idx + i + 1) % rpcPool.length;
        let conn = connections.get(candidate);
        if (!conn) {
          conn = new Connection(candidate, {
            commitment: "confirmed",
            disableRetryOnRateLimit: true,
          });
          connections.set(candidate, conn);
        }
        return { url: candidate, connection: conn };
      }
    }
    const fallback = rpcPool[idx % rpcPool.length];
    idx = (idx + 1) % rpcPool.length;
    let conn = connections.get(fallback);
    if (!conn) {
      conn = new Connection(fallback, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
      });
      connections.set(fallback, conn);
    }
    return { url: fallback, connection: conn };
  }

  return async function execute(fn, label = "RPC call") {
    let lastErr;
    for (let attempt = 1; attempt <= Math.max(6, rpcPool.length * 2); attempt += 1) {
      const { url, connection } = pickConnection();
      try {
        return await fn(connection);
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("Too Many Requests")) {
          cooldownUntil.set(url, Date.now() + 15_000);
          console.log(`[429] ${label} on ${url.slice(0, 38)}... switching RPC (attempt ${attempt})`);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  };
}

async function sendAndConfirmHttp(executeRpc, tx, signers) {
  const { blockhash } = await executeRpc(
    (c) => c.getLatestBlockhash("confirmed"),
    "getLatestBlockhash"
  );
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  await tx.sign(...signers);
  const raw = await tx.serialize();
  const sig = await executeRpc(
    (c) =>
      c.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }),
    "sendRawTransaction"
  );

  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await executeRpc(
      (c) => c.getSignatureStatuses([sig]),
      "getSignatureStatuses"
    );
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

async function createToken2022Mint(executeRpc, settler, { name, symbol, uri }) {
  const mintKeypair = await Keypair.generate();
  const estimatedSpace =
    TOKEN_2022_MINT_WITH_POINTER_SPACE +
    128 +
    Buffer.byteLength(name, "utf8") +
    Buffer.byteLength(symbol, "utf8") +
    Buffer.byteLength(uri, "utf8");
  const rentLamports = await executeRpc(
    (c) => c.getMinimumBalanceForRentExemption(estimatedSpace),
    `getMinimumBalanceForRentExemption(${symbol})`
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
      TOKEN_DECIMALS,
      settler.publicKey,
      settler.publicKey
    ),
    buildInitializeTokenMetadataIx({
      mint: mintKeypair.publicKey,
      updateAuthority: settler.publicKey,
      mintAuthority: settler.publicKey,
      name,
      symbol,
      uri,
    })
  );

  const sig = await sendAndConfirmHttp(executeRpc, tx, [settler, mintKeypair]);
  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    txSignature: sig,
  };
}

async function seedPoolLiquidity(executeRpc, settler, poolId, mintA, amountA, mintB, amountB) {
  const poolKeypair = await derivePoolKeypair(settler.secretKey, poolId);
  const ataA = await deriveAta(poolKeypair.publicKey, mintA);
  const ataB = await deriveAta(poolKeypair.publicKey, mintB);

  const [infoA, infoB] = await executeRpc(
    (c) => c.getMultipleAccountsInfo([ataA, ataB], "confirmed"),
    `getMultipleAccountsInfo(${poolId})`
  );
  if (infoA && infoB) {
    console.log(`[POOL ${poolId}] Already seeded (owner: ${poolKeypair.publicKey.toBase58()})`);
    return { poolOwner: poolKeypair.publicKey.toBase58(), skipped: true };
  }

  const tx = new Transaction();
  if (!infoA) {
    tx.add(
      buildCreateAtaIdempotentIx({
        payer: settler.publicKey,
        ata: ataA,
        owner: poolKeypair.publicKey,
        mint: mintA,
      }),
      buildMintToIx({
        mint: mintA,
        destinationAta: ataA,
        authority: settler.publicKey,
        amount: amountA,
      })
    );
  }
  if (!infoB) {
    tx.add(
      buildCreateAtaIdempotentIx({
        payer: settler.publicKey,
        ata: ataB,
        owner: poolKeypair.publicKey,
        mint: mintB,
      }),
      buildMintToIx({
        mint: mintB,
        destinationAta: ataB,
        authority: settler.publicKey,
        amount: amountB,
      })
    );
  }

  const sig = await sendAndConfirmHttp(executeRpc, tx, [settler]);
  return {
    poolOwner: poolKeypair.publicKey.toBase58(),
    txSignature: sig,
    skipped: false,
  };
}

async function main() {
  const envPath = path.join(process.cwd(), ".env");
  const envMap = loadEnvFile(envPath);

  const pinataJwt = process.env.PINATA_JWT || envMap.PINATA_JWT;
  const gatewayBase = (
    process.env.PINATA_GATEWAY_URL ||
    envMap.PINATA_GATEWAY_URL ||
    "https://gateway.pinata.cloud"
  ).replace(/\/+$/, "");

  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    envMap.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    envMap.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.devnet.solana.com";

  const rawKey =
    process.env.SOLANA_SETTLER_PRIVATE_KEY ||
    envMap.SOLANA_SETTLER_PRIVATE_KEY ||
    process.env.SOLANA_DEPLOYER_PRIVATE_KEY ||
    envMap.SOLANA_DEPLOYER_PRIVATE_KEY;

  if (!pinataJwt || !rawKey) {
    console.error("Error: PINATA_JWT and SOLANA_SETTLER_PRIVATE_KEY must be set in .env");
    process.exit(1);
  }

  const secretKey = decodePrivateKey(rawKey);
  const settler = await Keypair.fromSecretKey(secretKey);
  const databaseUrl = process.env.DATABASE_URL || envMap.DATABASE_URL;
  const rpcPool = await loadRpcPoolFromDb(databaseUrl, rpcUrl);
  const executeRpc = createRpcExecutor(rpcPool);

  console.log(`Settler/Authority: ${settler.publicKey.toBase58()}`);
  console.log(`RPC Pool (${rpcPool.length} endpoints): ${rpcPool.map((u) => u.slice(0, 40) + "...").join(", ")}`);
  console.log(`Pinata Gateway: ${gatewayBase}`);

  // 1. Optimize & upload NUSA icon to Pinata (reuse if already in .env)
  let nusaIconUrl =
    process.env.NEXT_PUBLIC_NUSA_TOKEN_ICON_URL ||
    envMap.NEXT_PUBLIC_NUSA_TOKEN_ICON_URL;
  if (!nusaIconUrl) {
    const nusaIconPath = path.join(process.cwd(), "public/token/nusa-token-icon.png");
    if (!fs.existsSync(nusaIconPath)) {
      throw new Error(`Icon not found at ${nusaIconPath}`);
    }
    const optimizedNusaIcon = await sharp(nusaIconPath)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, quality: 90 })
      .toBuffer();

    console.log(`Uploading optimized NUSA icon (${optimizedNusaIcon.length} bytes) to Pinata...`);
    nusaIconUrl = await pinFileToPinata(
      pinataJwt,
      gatewayBase,
      optimizedNusaIcon,
      "nusa-token-icon.png",
      "image/png"
    );
    upsertEnvKeys(envPath, { NEXT_PUBLIC_NUSA_TOKEN_ICON_URL: nusaIconUrl });
  }
  console.log(`NUSA Icon URL: ${nusaIconUrl}`);

  // 2. Upload JSON metadata for NUSA, IDRC, and USDC to Pinata
  console.log("Uploading token metadata JSONs to Pinata...");
  const [nusaMetaUrl, idrcMetaUrl, usdcMetaUrl] = await Promise.all([
    pinJsonToPinata(pinataJwt, gatewayBase, "nusa-token-metadata.json", {
      name: "Nusa Token",
      symbol: "NUSA",
      description:
        "Nusa Token (NUSA) is the official in-game utility token of Nusa Warrior, used for Booster Packs, Custom Card Minting, and Battle Rewards.",
      image: nusaIconUrl,
      decimals: TOKEN_DECIMALS,
    }),
    pinJsonToPinata(pinataJwt, gatewayBase, "idrc-token-metadata.json", {
      name: "Indonesian Rupiah Coin",
      symbol: "IDRC",
      description:
        "IDRC (POC) — Indonesian Rupiah pegged stablecoin on Solana Devnet for Nusa Warrior AMM DEX.",
      image: IDRC_ICON_URL,
      decimals: TOKEN_DECIMALS,
    }),
    pinJsonToPinata(pinataJwt, gatewayBase, "usdc-token-metadata.json", {
      name: "USD Coin",
      symbol: "USDC",
      description:
        "USDC (POC) — USD stablecoin on Solana Devnet for Nusa Warrior AMM DEX.",
      image: USDC_ICON_URL,
      decimals: TOKEN_DECIMALS,
    }),
  ]);

  console.log(`NUSA Metadata URI: ${nusaMetaUrl}`);
  console.log(`IDRC Metadata URI: ${idrcMetaUrl}`);
  console.log(`USDC Metadata URI: ${usdcMetaUrl}`);

  // 3. Create Token-2022 Mints if not already configured in .env
  let nusaMint = process.env.NEXT_PUBLIC_NUSA_TOKEN_MINT || envMap.NEXT_PUBLIC_NUSA_TOKEN_MINT;
  let idrcMint = process.env.NEXT_PUBLIC_IDRC_TOKEN_MINT || envMap.NEXT_PUBLIC_IDRC_TOKEN_MINT;
  let usdcMint = process.env.NEXT_PUBLIC_USDC_TOKEN_MINT || envMap.NEXT_PUBLIC_USDC_TOKEN_MINT;

  if (!nusaMint) {
    console.log("Creating NUSA Token-2022 Mint on Devnet...");
    const res = await createToken2022Mint(executeRpc, settler, {
      name: "Nusa Token",
      symbol: "NUSA",
      uri: nusaMetaUrl,
    });
    nusaMint = res.mintAddress;
    console.log(`NUSA Mint created: ${nusaMint} (tx: ${res.txSignature})`);
  } else {
    console.log(`NUSA Mint already exists: ${nusaMint}`);
  }

  if (!idrcMint) {
    console.log("Creating IDRC Token-2022 Mint on Devnet...");
    const res = await createToken2022Mint(executeRpc, settler, {
      name: "Indonesian Rupiah Coin",
      symbol: "IDRC",
      uri: idrcMetaUrl,
    });
    idrcMint = res.mintAddress;
    console.log(`IDRC Mint created: ${idrcMint} (tx: ${res.txSignature})`);
  } else {
    console.log(`IDRC Mint already exists: ${idrcMint}`);
  }

  if (!usdcMint) {
    console.log("Creating USDC Token-2022 Mint on Devnet...");
    const res = await createToken2022Mint(executeRpc, settler, {
      name: "USD Coin",
      symbol: "USDC",
      uri: usdcMetaUrl,
    });
    usdcMint = res.mintAddress;
    console.log(`USDC Mint created: ${usdcMint} (tx: ${res.txSignature})`);
  } else {
    console.log(`USDC Mint already exists: ${usdcMint}`);
  }

  // 4. Seed initial liquidity into 3 AMM Pools (x * y = k)
  const nusaPk = new PublicKey(nusaMint);
  const idrcPk = new PublicKey(idrcMint);
  const usdcPk = new PublicKey(usdcMint);

  console.log("Seeding initial liquidity into 3 AMM Pools...");
  const poolIdrcNusa = await seedPoolLiquidity(
    executeRpc,
    settler,
    "IDRC_NUSA",
    idrcPk,
    10_000_000n * DECIMALS_MULTIPLIER,
    nusaPk,
    10_000_000n * DECIMALS_MULTIPLIER
  );
  console.log("Pool IDRC_NUSA:", poolIdrcNusa);

  const poolUsdcNusa = await seedPoolLiquidity(
    executeRpc,
    settler,
    "USDC_NUSA",
    usdcPk,
    1_000n * DECIMALS_MULTIPLIER,
    nusaPk,
    16_000_000n * DECIMALS_MULTIPLIER
  );
  console.log("Pool USDC_NUSA:", poolUsdcNusa);

  const poolIdrcUsdc = await seedPoolLiquidity(
    executeRpc,
    settler,
    "IDRC_USDC",
    idrcPk,
    16_000_000n * DECIMALS_MULTIPLIER,
    usdcPk,
    1_000n * DECIMALS_MULTIPLIER
  );
  console.log("Pool IDRC_USDC:", poolIdrcUsdc);

  // 5. Update .env with mint addresses
  upsertEnvKeys(envPath, {
    NEXT_PUBLIC_NUSA_TOKEN_MINT: nusaMint,
    NEXT_PUBLIC_IDRC_TOKEN_MINT: idrcMint,
    NEXT_PUBLIC_USDC_TOKEN_MINT: usdcMint,
    NEXT_PUBLIC_NUSA_TOKEN_ICON_URL: nusaIconUrl,
    NEXT_PUBLIC_IDRC_TOKEN_ICON_URL: IDRC_ICON_URL,
    NEXT_PUBLIC_USDC_TOKEN_ICON_URL: USDC_ICON_URL,
  });

  console.log("\n=== Fase 1 Setup Complete ===");
  console.log(`NEXT_PUBLIC_NUSA_TOKEN_MINT=${nusaMint}`);
  console.log(`NEXT_PUBLIC_IDRC_TOKEN_MINT=${idrcMint}`);
  console.log(`NEXT_PUBLIC_USDC_TOKEN_MINT=${usdcMint}`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
