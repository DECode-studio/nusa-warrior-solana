import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bs58 from "bs58";

const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

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

function buildUpdateMetadataUriIx({ mint, updateAuthority, uri }) {
  const disc = createHash("sha256")
    .update("spl_token_metadata_interface:updating_field")
    .digest()
    .subarray(0, 8);

  return new TransactionInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: updateAuthority, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([disc, Buffer.from([2]), encodeBorshString(uri)]),
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
    JSON.stringify({ name: `nusa-card-${fileName}` })
  );
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Pinata file upload failed: ${await res.text()}`);
  const json = await res.json();
  return `${gatewayBase}/ipfs/${json.IpfsHash}`;
}

async function pinJsonToPinata(jwt, gatewayBase, name, content) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: content }),
  });
  if (!res.ok) throw new Error(`Pinata JSON upload failed: ${await res.text()}`);
  const json = await res.json();
  return `${gatewayBase}/ipfs/${json.IpfsHash}`;
}

function createRoundRobinRpc(rpcUrls) {
  let idx = 0;
  const cooldownUntil = new Map();
  const connections = new Map();

  function nextUrl() {
    const now = Date.now();
    for (let i = 0; i < rpcUrls.length; i += 1) {
      const candidateIdx = (idx + i) % rpcUrls.length;
      const url = rpcUrls[candidateIdx];
      if ((cooldownUntil.get(url) ?? 0) <= now) {
        idx = (candidateIdx + 1) % rpcUrls.length;
        return url;
      }
    }
    const url = rpcUrls[idx % rpcUrls.length];
    idx = (idx + 1) % rpcUrls.length;
    return url;
  }

  function getConn(url) {
    let conn = connections.get(url);
    if (!conn) {
      conn = new Connection(url, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true,
      });
      connections.set(url, conn);
    }
    return conn;
  }

  async function run(fn) {
    let lastErr;
    for (let round = 0; round < rpcUrls.length * 2; round += 1) {
      const url = nextUrl();
      try {
        return await fn(getConn(url), url);
      } catch (err) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("Too Many Requests")) {
          cooldownUntil.set(url, Date.now() + 10_000);
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  return { run };
}

async function sendAndConfirmBatch(rpcPool, instructions, signers) {
  const { blockhash } = await rpcPool.run((conn) =>
    conn.getLatestBlockhash("confirmed")
  );
  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: signers[0].publicKey,
  });
  for (const ix of instructions) tx.add(ix);
  await tx.sign(...signers);
  const raw = await tx.serialize();

  const sig = await rpcPool.run((conn) =>
    conn.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    })
  );

  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await rpcPool.run((conn) =>
      conn.getSignatureStatuses([sig])
    );
    const status = statusRes?.value?.[0];
    if (status?.err) throw new Error(`Tx ${sig} failed: ${JSON.stringify(status.err)}`);
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
  const pinataJwt = (process.env.PINATA_JWT || envMap.PINATA_JWT || "").trim();
  const gatewayBase = (
    process.env.PINATA_GATEWAY_URL ||
    envMap.PINATA_GATEWAY_URL ||
    "https://gateway.pinata.cloud"
  ).replace(/\/+$/, "");
  const databaseUrl = process.env.DATABASE_URL || envMap.DATABASE_URL;
  const network = (
    process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
    envMap.NEXT_PUBLIC_SOLANA_NETWORK ||
    "devnet"
  ).trim();
  const rawKey =
    process.env.SOLANA_SETTLER_PRIVATE_KEY ||
    envMap.SOLANA_SETTLER_PRIVATE_KEY ||
    process.env.SOLANA_DEPLOYER_PRIVATE_KEY ||
    envMap.SOLANA_DEPLOYER_PRIVATE_KEY;

  if (!pinataJwt) {
    console.error("Error: Set PINATA_JWT in .env first.");
    process.exit(1);
  }
  if (!databaseUrl || !rawKey) {
    console.error("Error: DATABASE_URL and SOLANA_SETTLER_PRIVATE_KEY must be set in .env.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  const settler = await Keypair.fromSecretKey(decodePrivateKey(rawKey.trim()));

  const dbRpcs = await prisma.solanaRpcEndpoint.findMany({
    where: { network, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    select: { url: true },
  });
  const rpcUrls = [
    ...new Set([
      ...dbRpcs.map((r) => r.url.trim()),
      ...(process.env.SOLANA_RPC_URLS || envMap.SOLANA_RPC_URLS || "")
        .split(",")
        .map((s) => s.trim()),
      process.env.SOLANA_RPC_URL || envMap.SOLANA_RPC_URL || "",
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || envMap.NEXT_PUBLIC_SOLANA_RPC_URL || "",
      "https://api.devnet.solana.com",
    ].filter((u) => /^https?:\/\//i.test(u))),
  ];
  console.log(`Using ${rpcUrls.length} RPC endpoint(s) in Round-Robin pool.`);
  const rpcPool = createRoundRobinRpc(rpcUrls);

  const cards = await prisma.card.findMany({
    where: {
      mintAddress: { not: null },
      OR: [{ metadataUri: null }, { metadataUri: { not: { contains: "/ipfs/" } } }],
    },
    orderBy: { code: "asc" },
  });

  console.log(`Found ${cards.length} minted cards to migrate to Pinata IPFS.`);
  const pendingUpdates = [];

  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    let imageUrl = card.imagePath;
    if (/^https?:\/\//i.test(card.imagePath)) {
      const imgRes = await fetch(card.imagePath);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const ext = card.imagePath.toLowerCase().endsWith(".png") ? "png" : "webp";
        imageUrl = await pinFileToPinata(
          pinataJwt,
          gatewayBase,
          buf,
          `${card.slug}.${ext}`,
          ext === "png" ? "image/png" : "image/webp"
        );
      }
    } else {
      const fullPath = path.join(process.cwd(), "public", card.imagePath.replace(/^\/+/, ""));
      if (fs.existsSync(fullPath)) {
        const ext = fullPath.toLowerCase().endsWith(".png") ? "png" : "webp";
        imageUrl = await pinFileToPinata(
          pinataJwt,
          gatewayBase,
          fs.readFileSync(fullPath),
          `${card.slug}.${ext}`,
          ext === "png" ? "image/png" : "image/webp"
        );
      }
    }

    const description =
      card.cardType === "INSTRUMENT"
        ? card.effectDescriptionEn || card.effectDescriptionId || card.historicalSummaryEn
        : card.historicalSummaryEn || card.historicalSummaryId;

    const attributes = [
      { trait_type: "Card Type", value: card.cardType },
      { trait_type: "Kingdom", value: card.kingdom },
      { trait_type: "Role", value: card.role },
      {
        trait_type: "Edition",
        value: card.isCustom
          ? "Custom Forge"
          : card.isRareEdition
            ? "Rare Edition"
            : "Regular",
      },
      { trait_type: "Token Standard", value: card.tokenStandard },
      { trait_type: "Base Attack", value: card.baseAttack },
      { trait_type: "Base Defense", value: card.baseDefense },
    ];
    if (card.gender) attributes.push({ trait_type: "Gender", value: card.gender });
    if (card.effectName) attributes.push({ trait_type: "Effect", value: card.effectName });
    if (card.effectType) attributes.push({ trait_type: "Effect Type", value: card.effectType });

    const ipfsMetadataUri = await pinJsonToPinata(
      pinataJwt,
      gatewayBase,
      `nusa-metadata-${card.slug}.json`,
      {
        name: card.name,
        symbol: "NUSA",
        description,
        image: imageUrl,
        attributes,
        properties: {
          files: [
            {
              uri: imageUrl,
              type: imageUrl.endsWith(".png") ? "image/png" : "image/webp",
            },
          ],
          category: "image",
          nusa: {
            id: card.id,
            code: card.code,
            slug: card.slug,
            cardType: card.cardType,
            kingdom: card.kingdom,
            role: card.role,
            baseAttack: card.baseAttack,
            baseDefense: card.baseDefense,
            isCustom: card.isCustom,
            isRareEdition: card.isRareEdition,
            tokenStandard: card.tokenStandard,
          },
        },
      }
    );

    console.log(`[IPFS ${i + 1}/${cards.length}] ${card.slug} -> ${ipfsMetadataUri}`);
    pendingUpdates.push({ card, ipfsMetadataUri });
  }

  // Batch on-chain TokenMetadata URI updates (6 cards per transaction)
  const BATCH_SIZE = 6;
  const token2022Updates = pendingUpdates.filter(
    (u) => u.card.tokenStandard === "TOKEN_2022" && u.card.mintAddress
  );

  for (let i = 0; i < token2022Updates.length; i += BATCH_SIZE) {
    const batch = token2022Updates.slice(i, i + BATCH_SIZE);
    const instructions = batch.map((u) =>
      buildUpdateMetadataUriIx({
        mint: new PublicKey(u.card.mintAddress),
        updateAuthority: settler.publicKey,
        uri: u.ipfsMetadataUri,
      })
    );
    const sig = await sendAndConfirmBatch(rpcPool, instructions, [settler]);
    for (const u of batch) {
      await prisma.card.update({
        where: { id: u.card.id },
        data: { metadataUri: u.ipfsMetadataUri },
      });
    }
    console.log(
      `[On-Chain ${Math.min(i + BATCH_SIZE, token2022Updates.length)}/${token2022Updates.length}] Batch updated (tx: ${sig})`
    );
    await new Promise((r) => setTimeout(r, 500));
  }

  await prisma.$disconnect();
  console.log(`Done! Migrated ${pendingUpdates.length} cards to Pinata IPFS.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
