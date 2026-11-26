import "server-only";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";

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
        select: { url: true },
      });
      const dbUrls = rows
        .map((r) => r.url.trim())
        .filter((u) => /^https?:\/\//i.test(u));
      if (dbUrls.length > 0) {
        const unique = [...new Set(dbUrls)];
        dbRpcCache = { expiresAt: Date.now() + 30_000, urls: unique };
        return unique;
      }
    } catch {
      // Fall back to env/default RPC if DB query fails
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

function pickFromPool(pool: string[]): string {
  const now = Date.now();
  for (let i = 0; i < pool.length; i += 1) {
    const idx = (roundRobinIndex + i) % pool.length;
    const candidate = pool[idx];
    if ((rpcCooldownUntil.get(candidate) ?? 0) <= now) {
      roundRobinIndex = (idx + 1) % pool.length;
      return candidate;
    }
  }
  const fallback = pool[roundRobinIndex % pool.length];
  roundRobinIndex = (roundRobinIndex + 1) % pool.length;
  return fallback;
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

  for (let attempt = 0; attempt < pool.length; attempt += 1) {
    const rpcUrl = pickFromPool(pool);
    const connection = getSolanaConnection(rpcUrl);
    try {
      return await operation(connection);
    } catch (error: unknown) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("429") || msg.includes("Too Many Requests")) {
        markSolanaRpcRateLimited(rpcUrl);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export async function forwardSolanaJsonRpc(
  payload: unknown
): Promise<{ status: number; body: unknown }> {
  const pool = await getSolanaRpcPoolAsync();
  let lastStatus = 502;
  const lastBody: unknown = { error: "All Solana RPC endpoints failed" };

  for (let attempt = 0; attempt < pool.length; attempt += 1) {
    const rpcUrl = pickFromPool(pool);
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12_000),
      });

      if (response.status === 429 || response.status >= 500) {
        markSolanaRpcRateLimited(rpcUrl);
        lastStatus = response.status;
        continue;
      }

      const body = (await response.json()) as unknown;
      return { status: response.status, body };
    } catch {
      markSolanaRpcRateLimited(rpcUrl, 10_000);
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

export async function deriveBattleVaultPda(
  matchId: string
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from("battle_vault"), Buffer.from(matchId, "utf8")],
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
