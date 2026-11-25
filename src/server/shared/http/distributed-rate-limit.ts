import "server-only";
import { createHash } from "node:crypto";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";

export interface RateLimitPolicy {
  capacity: number;
  refillPerSecond: number;
}

interface LocalBucket {
  tokens: number;
  updatedAtMs: number;
  expiresAtMs: number;
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  __nusantaraLocalRateLimitBuckets?: Map<string, LocalBucket>;
};

function consumeLocal(key: string, policy: RateLimitPolicy, now: number): boolean {
  const buckets = globalRateLimitStore.__nusantaraLocalRateLimitBuckets ??= new Map();
  for (const [bucketKey, bucket] of buckets) {
    if (bucket.expiresAtMs <= now) buckets.delete(bucketKey);
  }
  const existing = buckets.get(key);
  const replenished = existing
    ? Math.min(policy.capacity, existing.tokens + Math.max(0, now - existing.updatedAtMs) / 1000 * policy.refillPerSecond)
    : policy.capacity;
  const tokens = replenished - 1;
  buckets.set(key, { tokens, updatedAtMs: now, expiresAtMs: now + 86_400_000 });
  return tokens >= 0;
}

export async function consumeDistributedRateLimit(
  rawKey: string,
  policy: RateLimitPolicy
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (
    !Number.isFinite(policy.capacity) || policy.capacity < 1 ||
    !Number.isFinite(policy.refillPerSecond) || policy.refillPerSecond <= 0
  ) {
    throw new Error("Invalid rate limit policy");
  }
  const key = createHash("sha256").update(rawKey, "utf8").digest("hex");
  if (!isPrismaDriverEnabled()) {
    const allowed = consumeLocal(key, policy, Date.now());
    return { allowed, retryAfterSeconds: Math.max(1, Math.ceil(1 / policy.refillPerSecond)) };
  }

  const rows = await prisma.$queryRaw<Array<{ tokens: number }>>`
    INSERT INTO "api_rate_limit_buckets" ("key", "tokens", "updatedAt", "expiresAt")
    VALUES (${key}, ${policy.capacity - 1}, clock_timestamp(), clock_timestamp() + INTERVAL '24 hours')
    ON CONFLICT ("key") DO UPDATE SET
      "tokens" = LEAST(
        ${policy.capacity},
        GREATEST(0, "api_rate_limit_buckets"."tokens") +
        GREATEST(0, EXTRACT(EPOCH FROM (clock_timestamp() - "api_rate_limit_buckets"."updatedAt"))) * ${policy.refillPerSecond}
      ) - 1,
      "updatedAt" = clock_timestamp(),
      "expiresAt" = clock_timestamp() + INTERVAL '24 hours'
    RETURNING "tokens"
  `;
  const tokens = rows[0]?.tokens ?? -1;
  return {
    allowed: tokens >= 0,
    retryAfterSeconds: Math.max(1, Math.ceil(Math.max(0, 1 - tokens) / policy.refillPerSecond)),
  };
}

export async function enforceRateLimit(
  key: string,
  policy: RateLimitPolicy
): Promise<void> {
  const result = await consumeDistributedRateLimit(key, policy);
  if (!result.allowed) {
    throw AppError.tooManyRequests(result.retryAfterSeconds);
  }
}

export async function pruneExpiredRateLimitBuckets(now = new Date()): Promise<number> {
  if (!isPrismaDriverEnabled()) return 0;
  const result = await prisma.apiRateLimitBucket.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}
