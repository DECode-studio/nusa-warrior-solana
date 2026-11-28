import "server-only";
import { createHash } from "node:crypto";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { logServerEvent } from "@/server/shared/logging/server-logger";

export type SolanaCluster = "devnet" | "mainnet-beta" | "testnet" | "localnet";

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const NUSA_CARD_VAULT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_NUSA_CARD_VAULT_PROGRAM_ID?.trim() ||
    "GWbea8uHeLSiMKwuL8UDeBhg3k83v6QnKwswiTCmJ6GU"
);

export const NUSA_AMM_DEX_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_NUSA_AMM_DEX_PROGRAM_ID?.trim() ||
    "7WdVgAhEJkaULUF2QnW3a6jqJyc6QeQeKnbN32rTDmJ5"
);

export const NUSA_AUCTION_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_NUSA_AUCTION_PROGRAM_ID?.trim() ||
    "JCQUebAXm8eqkU7XW3ZUgho69cJQV4BtPmYTuyHxDahd"
);

export function getSolanaNetwork(): SolanaCluster {
  const raw = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.trim().toLowerCase();
  if (raw === "mainnet-beta" || raw === "mainnet") return "mainnet-beta";
  if (raw === "testnet") return "testnet";
  if (raw === "localnet") return "localnet";
  return "devnet";
}

export function getSolanaRpcPool(): string[] {
  const cluster = getSolanaNetwork();
  const defaultRpc =
    cluster === "localnet" ? "http://127.0.0.1:8899" : clusterApiUrl(cluster);

  const rawList = [
    ...(process.env.SOLANA_RPC_URLS?.split(",") ?? []),
    process.env.SOLANA_RPC_URL ?? "",
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "",
    defaultRpc,
  ]
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && /^https?:\/\//i.test(item));

  return [...new Set(rawList)];
}

export function getSolanaRpcUrl(): string {
  return getNextSolanaRpcUrl();
}

let roundRobinIndex = 0;
const rpcCooldownUntil = new Map<string, number>();
const connectionPool = new Map<string, Connection>();
let dbRpcCache: { expiresAt: number; urls: string[] } | null = null;

export function invalidateSolanaRpcPoolCache(): void {
  dbRpcCache = null;
}

const PUBLIC_SOLANA_RPC_HOSTS = new Set([
  "api.devnet.solana.com",
  "api.mainnet-beta.solana.com",
  "api.testnet.solana.com",
]);

export function isPublicSolanaRpc(url: string): boolean {
  try {
    return PUBLIC_SOLANA_RPC_HOSTS.has(new URL(url.trim()).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function sortSolanaRpcEndpoints(
  rows: Array<{ url: string; priority: number; createdAt?: Date | string }>
): string[] {
  const valid = rows
    .map((row) => ({
      url: row.url.trim(),
      priority: row.priority,
      createdAtMs:
        row.createdAt instanceof Date
          ? row.createdAt.getTime()
          : typeof row.createdAt === "string"
            ? Date.parse(row.createdAt) || 0
            : 0,
    }))
    .filter((row) => row.url.length > 0 && /^https?:\/\//i.test(row.url));

  valid.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const publicDiff =
      Number(isPublicSolanaRpc(a.url)) - Number(isPublicSolanaRpc(b.url));
    if (publicDiff !== 0) return publicDiff;
    return a.createdAtMs - b.createdAtMs;
  });

  return [...new Set(valid.map((row) => row.url))];
}

function redactRpcUrl(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "invalid-rpc-url";
  }
}

export async function getSolanaRpcPoolAsync(): Promise<string[]> {
  if (dbRpcCache && dbRpcCache.expiresAt > Date.now()) {
    return dbRpcCache.urls;
  }

  const network = getSolanaNetwork();
  if (isPrismaDriverEnabled()) {
    try {
      const rows = await prisma.solanaRpcEndpoint.findMany({
        where: { network, isActive: true },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        select: { url: true, priority: true, createdAt: true },
      });
      const dbUrls = sortSolanaRpcEndpoints(rows);
      if (dbUrls.length > 0) {
        const unique = [...new Set([...dbUrls, ...getSolanaRpcPool()])];
        dbRpcCache = { expiresAt: Date.now() + 30_000, urls: unique };
        return unique;
      }
    } catch (error: unknown) {
      logServerEvent("warn", "solana.rpc.db_pool_load_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const fallbackPool = getSolanaRpcPool();
  dbRpcCache = { expiresAt: Date.now() + 15_000, urls: fallbackPool };
  return fallbackPool;
}

export function markSolanaRpcRateLimited(
  url: string,
  cooldownMs = 15_000
): void {
  rpcCooldownUntil.set(url, Date.now() + cooldownMs);
}

function getOrderedHealthyPool(pool: string[]): string[] {
  const now = Date.now();
  const healthy: string[] = [];
  const cooledDown: string[] = [];
  for (const url of pool) {
    if ((rpcCooldownUntil.get(url) ?? 0) <= now) {
      healthy.push(url);
    } else {
      cooledDown.push(url);
    }
  }
  return [...healthy, ...cooledDown];
}

function hasRateLimitJsonRpcError(body: unknown): boolean {
  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const err = (item as { error?: unknown }).error;
    if (!err || typeof err !== "object") continue;
    const code = (err as { code?: unknown }).code;
    if (code === -32429 || code === 429) return true;
    const msg = (err as { message?: unknown }).message;
    if (
      typeof msg === "string" &&
      /429|too many requests|rate limit|compute units per second/i.test(msg)
    ) {
      return true;
    }
  }
  return false;
}

function hasBlockhashNotFoundError(body: unknown): boolean {
  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const err = (item as { error?: unknown }).error;
    if (!err || typeof err !== "object") continue;
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.includes("Blockhash not found")) {
      return true;
    }
    const data = (err as { data?: unknown }).data;
    if (
      data &&
      typeof data === "object" &&
      (data as { err?: unknown }).err === "BlockhashNotFound"
    ) {
      return true;
    }
  }
  return false;
}

function pickFromPool(pool: string[]): string {
  const ordered = getOrderedHealthyPool(pool);
  return ordered[0] ?? pool[roundRobinIndex % pool.length];
}

export function getNextSolanaRpcUrl(): string {
  return pickFromPool(getSolanaRpcPool());
}

export async function getNextSolanaRpcUrlAsync(): Promise<string> {
  return pickFromPool(await getSolanaRpcPoolAsync());
}

export function getSolanaConnection(rpcUrl?: string): Connection {
  const targetUrl = rpcUrl ?? getNextSolanaRpcUrl();
  let conn = connectionPool.get(targetUrl);
  if (!conn) {
    conn = new Connection(targetUrl, {
      commitment: "confirmed",
      disableRetryOnRateLimit: true,
    });
    connectionPool.set(targetUrl, conn);
  }
  return conn;
}

export async function executeWithSolanaConnection<T>(
  operation: (connection: Connection) => Promise<T>
): Promise<T> {
  const pool = await getSolanaRpcPoolAsync();
  let lastError: unknown;

  for (let pass = 0; pass < 2; pass += 1) {
    const orderedPool = getOrderedHealthyPool(pool);
    let sawRateLimit = false;

    for (let attempt = 0; attempt < orderedPool.length; attempt += 1) {
      const rpcUrl = orderedPool[attempt];
      const connection = getSolanaConnection(rpcUrl);
      try {
        return await operation(connection);
      } catch (error: unknown) {
        lastError = error;
        const msg = error instanceof Error ? error.message : String(error);
        const isAuthErr =
          msg.includes("401") ||
          msg.includes("403") ||
          msg.includes("Unauthorized") ||
          msg.includes("Forbidden");
        const isRateErr =
          msg.includes("429") ||
          msg.includes("Too Many Requests") ||
          /rate limit|compute units per second/i.test(msg);
        if (
          isAuthErr ||
          isRateErr ||
          msg.includes("fetch failed") ||
          msg.includes("ECONN") ||
          msg.includes("ETIMEDOUT")
        ) {
          if (isRateErr) {
            sawRateLimit = true;
          }
          const cooldownMs = isAuthErr
            ? 60_000
            : isPublicSolanaRpc(rpcUrl)
              ? 30_000
              : 15_000;
          markSolanaRpcRateLimited(rpcUrl, cooldownMs);
          logServerEvent("warn", "solana.rpc.connection_failover", {
            rpc: redactRpcUrl(rpcUrl),
            reason: msg.slice(0, 180),
            attempt,
            poolSize: orderedPool.length,
          });
          continue;
        }
        if (
          msg.includes("Blockhash not found") &&
          attempt < orderedPool.length - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    if (!sawRateLimit || pass === 1) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  throw lastError;
}

export async function forwardSolanaJsonRpc(
  payload: unknown
): Promise<{ status: number; body: unknown }> {
  const pool = await getSolanaRpcPoolAsync();
  const orderedPool = getOrderedHealthyPool(pool);
  let lastStatus = 502;
  let lastBody: unknown = { error: "All Solana RPC endpoints failed" };

  for (let attempt = 0; attempt < orderedPool.length; attempt += 1) {
    const rpcUrl = orderedPool[attempt];
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12_000),
      });

      if (
        response.status === 429 ||
        response.status === 401 ||
        response.status === 403 ||
        response.status >= 500
      ) {
        const isAuthErr = response.status === 401 || response.status === 403;
        const cooldownMs = isAuthErr
          ? 60_000
          : isPublicSolanaRpc(rpcUrl)
            ? 30_000
            : 15_000;
        markSolanaRpcRateLimited(rpcUrl, cooldownMs);
        logServerEvent("warn", "solana.rpc.proxy_failover", {
          rpc: redactRpcUrl(rpcUrl),
          status: response.status,
          attempt,
          poolSize: orderedPool.length,
        });
        lastStatus = response.status;
        continue;
      }

      const body = (await response.json()) as unknown;
      if (hasRateLimitJsonRpcError(body) && attempt < orderedPool.length - 1) {
        const cooldownMs = isPublicSolanaRpc(rpcUrl) ? 30_000 : 15_000;
        markSolanaRpcRateLimited(rpcUrl, cooldownMs);
        logServerEvent("warn", "solana.rpc.proxy_failover", {
          rpc: redactRpcUrl(rpcUrl),
          status: 429,
          attempt,
          poolSize: orderedPool.length,
        });
        lastStatus = 429;
        lastBody = body;
        continue;
      }
      if (
        hasBlockhashNotFoundError(body) &&
        attempt < orderedPool.length - 1
      ) {
        lastStatus = response.status;
        lastBody = body;
        continue;
      }
      return { status: response.status, body };
    } catch (error: unknown) {
      markSolanaRpcRateLimited(rpcUrl, 10_000);
      logServerEvent("warn", "solana.rpc.proxy_error", {
        rpc: redactRpcUrl(rpcUrl),
        message: error instanceof Error ? error.message : String(error),
        attempt,
        poolSize: orderedPool.length,
      });
    }
  }

  return { status: lastStatus, body: lastBody };
}

export function getSolanaExplorerTxUrl(signature: string): string {
  const network = getSolanaNetwork();
  const base = `https://explorer.solana.com/tx/${signature}`;
  if (network === "mainnet-beta") return base;
  if (network === "localnet") return `${base}?cluster=custom`;
  return `${base}?cluster=${network}`;
}

export async function deriveVaultConfigPda(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("vault_config")],
    NUSA_CARD_VAULT_PROGRAM_ID
  );
}

export async function deriveVaultAuthorityPda(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("vault_authority")],
    NUSA_CARD_VAULT_PROGRAM_ID
  );
}

export function toVaultMatchId(matchId: string): string {
  const compact = matchId.trim().replace(/-/g, "");
  if (compact.length > 0 && Buffer.byteLength(compact, "utf8") <= 32) {
    return compact;
  }
  return createHash("sha256")
    .update(matchId, "utf8")
    .digest("hex")
    .slice(0, 32);
}

export async function deriveBattleVaultPda(
  matchId: string
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("battle_vault"), Buffer.from(toVaultMatchId(matchId), "utf8")],
    NUSA_CARD_VAULT_PROGRAM_ID
  );
}

export async function deriveVaultDepositPda(
  battleVault: PublicKey,
  owner: PublicKey,
  mintOrAsset: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("vault_deposit"),
      battleVault.toBytes(),
      owner.toBytes(),
      mintOrAsset.toBytes(),
    ],
    NUSA_CARD_VAULT_PROGRAM_ID
  );
}

export async function deriveAuctionConfigPda(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("auction_config")],
    NUSA_AUCTION_PROGRAM_ID
  );
}

export async function deriveAuctionPda(
  auctionId: string
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("auction"), Buffer.from(auctionId, "utf8")],
    NUSA_AUCTION_PROGRAM_ID
  );
}

export async function deriveBidEscrowPda(
  auctionPda: PublicKey,
  bidder: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("bid_escrow"), auctionPda.toBytes(), bidder.toBytes()],
    NUSA_AUCTION_PROGRAM_ID
  );
}
