import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { prisma } from "@/server/shared/db/prisma";

export const NUSA_POINT_POLICY = {
  idrPerPoint: 1,
  dailyTotalCap: 500,
  dailyBotCap: 100,
  dailyStoryCap: 100,
  dailyPvpCap: 400,
  quickMatchWin: 100,
  leagueMatchWin: 125,
  leagueChampionBonus: 250,
  leagueChampionMinimumPlayers: 4,
  sameOpponentCooldownMs: 24 * 60 * 60 * 1000,
  boosterDiscountPercentCap: 60,
} as const;

export type NusaPointSource =
  | "BATTLE_BOT_WIN"
  | "BATTLE_PVP_WIN"
  | "LEAGUE_MATCH_WIN"
  | "LEAGUE_CHAMPION"
  | "STORY_MODE"
  | "SHOP_ORDER_SPEND"
  | "SHOP_ORDER_REFUND"
  | "SHOP_ORDER_REFUND_REVERSAL"
  | "CUSTOM_CARD_MINT"
  | "TOPUP"
  | "NUSA_CLAIM";

const EARNING_SOURCES: NusaPointSource[] = [
  "BATTLE_BOT_WIN",
  "BATTLE_PVP_WIN",
  "LEAGUE_MATCH_WIN",
  "LEAGUE_CHAMPION",
  "STORY_MODE",
];

function jakartaDayStart(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) - 7 * 60 * 60 * 1000);
}

export async function grantNusaPointsPrisma(
  tx: PrismaTypes.TransactionClient,
  input: {
    userId: string;
    amount: number;
    source: Extract<NusaPointSource, "BATTLE_BOT_WIN" | "BATTLE_PVP_WIN" | "LEAGUE_MATCH_WIN" | "LEAGUE_CHAMPION" | "STORY_MODE">;
    sourceId: string;
    opponentUserId?: string | null;
    now?: Date;
  },
): Promise<number> {
  if (input.amount <= 0) return 0;
  await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
    WITH point_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(8813044, hashtext(${input.userId}))
    )
    SELECT 1::int AS locked FROM point_lock
  `);

  const existing = await tx.nusaPointTransaction.findUnique({
    where: { userId_source_sourceId: { userId: input.userId, source: input.source, sourceId: input.sourceId } },
    select: { id: true },
  });
  if (existing) return 0;

  const user = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } });
  if (!user) return 0;
  if (input.opponentUserId) {
    const opponent = await tx.user.findUnique({ where: { id: input.opponentUserId }, select: { id: true } });
    if (!opponent || input.opponentUserId === input.userId) return 0;
  }

  const now = input.now ?? new Date();
  const dayStart = jakartaDayStart(now);
  const isBot = input.source === "BATTLE_BOT_WIN";
  const isStory = input.source === "STORY_MODE";
  const dailySources = isBot
    ? ["BATTLE_BOT_WIN"]
    : isStory
      ? ["STORY_MODE"]
      : EARNING_SOURCES.filter((source) => source !== "BATTLE_BOT_WIN" && source !== "STORY_MODE");
  const daily = await tx.nusaPointTransaction.aggregate({
    where: { userId: input.userId, source: { in: dailySources }, createdAt: { gte: dayStart } },
    _sum: { amount: true },
  });
  const earnedToday = Math.max(0, daily._sum.amount ?? 0);
  const modeCap = isBot
    ? NUSA_POINT_POLICY.dailyBotCap
    : isStory
      ? NUSA_POINT_POLICY.dailyStoryCap
      : NUSA_POINT_POLICY.dailyPvpCap;
  const dailyTotal = await tx.nusaPointTransaction.aggregate({
    where: { userId: input.userId, source: { in: EARNING_SOURCES }, createdAt: { gte: dayStart } },
    _sum: { amount: true },
  });
  const totalEarnedToday = Math.max(0, dailyTotal._sum.amount ?? 0);
  const award = Math.min(
    input.amount,
    Math.max(0, modeCap - earnedToday),
    Math.max(0, NUSA_POINT_POLICY.dailyTotalCap - totalEarnedToday),
  );
  if (award <= 0) return 0;

  if (input.source === "BATTLE_PVP_WIN" && input.opponentUserId) {
    if (input.userId === input.opponentUserId) return 0;
    const cooldownStart = new Date(now.getTime() - NUSA_POINT_POLICY.sameOpponentCooldownMs);
    const recentPairReward = await tx.nusaPointTransaction.findFirst({
      where: {
        source: "BATTLE_PVP_WIN",
        createdAt: { gte: cooldownStart },
        OR: [
          { userId: input.userId, opponentUserId: input.opponentUserId },
          { userId: input.opponentUserId, opponentUserId: input.userId },
        ],
      },
      select: { id: true },
    });
    if (recentPairReward) return 0;
  }

  await tx.nusaPointTransaction.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      amount: award,
      source: input.source,
      sourceId: input.sourceId,
      opponentUserId: input.opponentUserId ?? null,
      createdAt: now,
    },
  });
  return award;
}

export async function getNusaPointBalancePrisma(userId: string): Promise<number> {
  const result = await prisma.nusaPointTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return Math.max(0, result._sum.amount ?? 0);
}

export function getJakartaDayStart(now: Date): Date {
  return jakartaDayStart(now);
}

export const CUSTOM_CARD_POLICY = {
  defaultBattlePointCap: 2100,
  minAttack: 100,
  minDefense: 100,
  firstCardCost: 0,
  secondCardCost: 2500,
  subsequentCardCost: 5000,
} as const;

export function getCustomCardCost(userCreatedCardCount: number): number {
  if (userCreatedCardCount <= 0) return CUSTOM_CARD_POLICY.firstCardCost;
  if (userCreatedCardCount === 1) return CUSTOM_CARD_POLICY.secondCardCost;
  return CUSTOM_CARD_POLICY.subsequentCardCost;
}

export async function deductNusaPointsForCustomCardPrisma(
  tx: PrismaTypes.TransactionClient,
  input: {
    userId: string;
    cardId: string;
    cost: number;
    now?: Date;
  },
): Promise<void> {
  if (input.cost <= 0) return;

  await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
    WITH point_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(8813044, hashtext(${input.userId}))
    )
    SELECT 1::int AS locked FROM point_lock
  `);

  const balanceAggregate = await tx.nusaPointTransaction.aggregate({
    where: { userId: input.userId },
    _sum: { amount: true },
  });
  const currentBalance = Math.max(0, balanceAggregate._sum.amount ?? 0);

  if (currentBalance < input.cost) {
    throw new Error(`Saldo NusaPoint tidak mencukupi. Butuh ${input.cost} NP, saldo saat ini ${currentBalance} NP.`);
  }

  await tx.nusaPointTransaction.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      amount: -input.cost,
      source: "CUSTOM_CARD_MINT",
      sourceId: input.cardId,
      createdAt: input.now ?? new Date(),
    },
  });
}

export async function claimUnclaimedNusaPrisma(
  tx: PrismaTypes.TransactionClient,
  input: {
    userId: string;
    claimId: string;
    amount: number;
    txSignature: string;
    now?: Date;
  },
): Promise<{ claimedAmount: number; remainingUnclaimed: number }> {
  if (input.amount <= 0) {
    throw new Error("Jumlah klaim NUSA harus lebih besar dari 0.");
  }

  await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
    WITH point_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(8813044, hashtext(${input.userId}))
    )
    SELECT 1::int AS locked FROM point_lock
  `);

  const duplicateSig = await tx.nusaPointTransaction.findFirst({
    where: { txSignature: input.txSignature },
    select: { id: true },
  });
  if (duplicateSig) {
    throw new Error("Signature transaksi klaim sudah pernah digunakan.");
  }

  const balanceAggregate = await tx.nusaPointTransaction.aggregate({
    where: { userId: input.userId },
    _sum: { amount: true },
  });
  const currentUnclaimed = Math.max(0, balanceAggregate._sum.amount ?? 0);

  if (currentUnclaimed < input.amount) {
    throw new Error(
      `Saldo Unclaimed NUSA tidak mencukupi (${currentUnclaimed} NUSA).`,
    );
  }

  const now = input.now ?? new Date();
  await tx.nusaPointTransaction.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      amount: -input.amount,
      source: "NUSA_CLAIM",
      sourceId: input.claimId,
      txSignature: input.txSignature,
      claimedAt: now,
      createdAt: now,
    },
  });

  return {
    claimedAmount: input.amount,
    remainingUnclaimed: currentUnclaimed - input.amount,
  };
}
