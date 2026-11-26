import "server-only";
import { randomUUID } from "node:crypto";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredNusaPointTransactionRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled } from "@/server/shared/db/prisma";
import {
  claimUnclaimedNusaPrisma,
  getJakartaDayStart,
  getNusaPointBalancePrisma,
  grantNusaPointsPrisma,
  NUSA_POINT_POLICY,
  type NusaPointSource,
} from "../domain/nusa-point-policy";

type BattleRewardSource = Extract<NusaPointSource,
  "BATTLE_BOT_WIN" | "BATTLE_PVP_WIN" | "LEAGUE_MATCH_WIN" | "LEAGUE_CHAMPION" | "STORY_MODE">;

export async function getNusaPointBalance(userId: string): Promise<number> {
  if (isPrismaDriverEnabled()) return getNusaPointBalancePrisma(userId);
  return Math.max(0, getEmbeddedStore().nusaPointTransactions
    .filter((entry) => entry.userId === userId)
    .reduce((sum, entry) => sum + entry.amount, 0));
}

export async function grantNusaPoints(input: {
  userId: string;
  amount: number;
  source: BattleRewardSource;
  sourceId: string;
  opponentUserId?: string | null;
  now?: Date;
}): Promise<number> {
  const now = input.now ?? new Date();
  if (isPrismaDriverEnabled()) {
    const { prisma } = await import("@/server/shared/db/prisma");
    return prisma.$transaction((tx) => grantNusaPointsPrisma(tx, { ...input, now }));
  }

  const store = getEmbeddedStore();
  const user = store.users.find((entry) => entry.id === input.userId);
  if (!user || input.amount <= 0) return 0;
  if (store.nusaPointTransactions.some((entry) =>
    entry.userId === input.userId && entry.source === input.source && entry.sourceId === input.sourceId
  )) return 0;

  const dayStart = getJakartaDayStart(now).getTime();
  const isBot = input.source === "BATTLE_BOT_WIN";
  const isStory = input.source === "STORY_MODE";
  const earningSources = new Set<BattleRewardSource>([
    "BATTLE_BOT_WIN", "BATTLE_PVP_WIN", "LEAGUE_MATCH_WIN", "LEAGUE_CHAMPION", "STORY_MODE",
  ]);
  const dailyEntries = store.nusaPointTransactions.filter((entry) =>
    entry.userId === input.userId && earningSources.has(entry.source as BattleRewardSource) &&
    Date.parse(entry.createdAt) >= dayStart
  );
  const modeSources = isBot
    ? new Set(["BATTLE_BOT_WIN"])
    : isStory
      ? new Set(["STORY_MODE"])
      : new Set(["BATTLE_PVP_WIN", "LEAGUE_MATCH_WIN", "LEAGUE_CHAMPION"]);
  const modeTotal = dailyEntries.filter((entry) => modeSources.has(entry.source)).reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
  const total = dailyEntries.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
  const modeCap = isBot
    ? NUSA_POINT_POLICY.dailyBotCap
    : isStory
      ? NUSA_POINT_POLICY.dailyStoryCap
      : NUSA_POINT_POLICY.dailyPvpCap;
  const amount = Math.min(
    input.amount,
    Math.max(0, modeCap - modeTotal),
    Math.max(0, NUSA_POINT_POLICY.dailyTotalCap - total),
  );
  if (amount <= 0) return 0;

  if (input.source === "BATTLE_PVP_WIN" && input.opponentUserId) {
    if (input.userId === input.opponentUserId) return 0;
    const cooldownStart = now.getTime() - NUSA_POINT_POLICY.sameOpponentCooldownMs;
    const recentPair = store.nusaPointTransactions.some((entry) =>
      entry.source === "BATTLE_PVP_WIN" && Date.parse(entry.createdAt) >= cooldownStart &&
      ((entry.userId === input.userId && entry.opponentUserId === input.opponentUserId) ||
        (entry.userId === input.opponentUserId && entry.opponentUserId === input.userId))
    );
    if (recentPair) return 0;
  }

  const row: StoredNusaPointTransactionRecord = {
    id: randomUUID(),
    userId: input.userId,
    amount,
    source: input.source,
    sourceId: input.sourceId,
    opponentUserId: input.opponentUserId ?? null,
    createdAt: now.toISOString(),
  };
  store.nusaPointTransactions.push(row);
  persistEmbeddedStore(store);
  return amount;
}

export async function getUnclaimedNusaBalance(userId: string): Promise<number> {
  return getNusaPointBalance(userId);
}

export async function recordNusaClaim(input: {
  userId: string;
  claimId: string;
  amount: number;
  txSignature: string;
  now?: Date;
}): Promise<{ claimedAmount: number; remainingUnclaimed: number }> {
  const now = input.now ?? new Date();
  if (isPrismaDriverEnabled()) {
    const { prisma } = await import("@/server/shared/db/prisma");
    return prisma.$transaction((tx) =>
      claimUnclaimedNusaPrisma(tx, { ...input, now })
    );
  }

  const store = getEmbeddedStore();
  const current = store.nusaPointTransactions
    .filter((entry) => entry.userId === input.userId)
    .reduce((sum, entry) => sum + entry.amount, 0);
  if (current < input.amount || input.amount <= 0) {
    throw new Error(`Saldo Unclaimed NUSA tidak mencukupi (${current} NUSA).`);
  }
  store.nusaPointTransactions.push({
    id: randomUUID(),
    userId: input.userId,
    amount: -input.amount,
    source: "NUSA_CLAIM",
    sourceId: input.claimId,
    opponentUserId: null,
    createdAt: now.toISOString(),
  });
  persistEmbeddedStore(store);
  return {
    claimedAmount: input.amount,
    remainingUnclaimed: current - input.amount,
  };
}
