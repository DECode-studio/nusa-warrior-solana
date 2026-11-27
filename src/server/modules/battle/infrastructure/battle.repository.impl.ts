import "server-only";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredBattleSessionRecord,
  type StoredMatchLogRecord,
  type StoredQuickMatchQueueRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import { logServerEvent } from "@/server/shared/logging/server-logger";
import { getJakartaDayStart, grantNusaPointsPrisma, NUSA_POINT_POLICY } from "@/server/modules/nusa-points/domain/nusa-point-policy";
import type {
  BattleRepository,
  CreateMatchLogInput,
  QuickMatchQueueInput,
  QuickMatchSessionInput,
} from "../domain/battle.repository";
import { BattleEngine } from "../domain/battle_engine";
import {
  assertBattleDataUnlocked,
  assertEmbeddedBattleDataUnlocked,
  lockBattleDataIntegrity,
} from "./battle-integrity.guard";

function toQueueRecord(row: {
  id: string;
  userId: string;
  deckId: string;
  deckName: string;
  battlePower: number;
  characterSlugsJson: string;
  instrumentSlugsJson: string;
  idempotencyKey: string;
  acceptedAt: Date;
  status: string;
  battleSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): StoredQuickMatchQueueRecord {
  return {
    ...row,
    status: row.status as StoredQuickMatchQueueRecord["status"],
    acceptedAt: row.acceptedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function appendAuditEvent(eventsJson: string, event: Record<string, unknown>): string {
  const events = JSON.parse(eventsJson || "[]") as Array<Record<string, unknown>>;
  const previousHash = typeof events.at(-1)?.hash === "string" ? String(events.at(-1)?.hash) : null;
  const hash = createHash("sha256").update(JSON.stringify({ previousHash, event }), "utf8").digest("hex");
  events.push({ ...event, hash });
  return JSON.stringify(events);
}

function timeoutLosingSide(state: import("@/client/domain/battle/entity/battle_entity").BattleStateEntity): "PLAYER" | "BOT" {
  if (state.phase === "PROMOTE_CHARACTER" && state.pendingPromotion) return state.pendingPromotion.side;
  if (state.phase === "DEFENDER_INSTRUMENT_RESPONSE" && state.pendingAttack) {
    return state.pendingAttack.attackerSide === "PLAYER" ? "BOT" : "PLAYER";
  }
  return state.activePlayer;
}

function toStoredSession(
  row: NonNullable<Awaited<ReturnType<typeof prisma.battleSession.findFirst>>>
): StoredBattleSessionRecord {
  return {
    ...row,
    storyKingdom: row.storyKingdom === "MAJAPAHIT" || row.storyKingdom === "PAJAJARAN" ? row.storyKingdom : null,
    rulesVersion: row.rulesVersion ?? "rules-v1",
    status: row.status as StoredBattleSessionRecord["status"],
    lastSeenAt: row.lastSeenAt.toISOString(),
    opponentLastSeenAt: row.opponentLastSeenAt?.toISOString() ?? null,
    disconnectedAt: row.disconnectedAt?.toISOString() ?? null,
    opponentDisconnectedAt: row.opponentDisconnectedAt?.toISOString() ?? null,
    reconnectDeadlineAt: row.reconnectDeadlineAt?.toISOString() ?? null,
    opponentReconnectDeadlineAt: row.opponentReconnectDeadlineAt?.toISOString() ?? null,
    turnDeadlineAt: row.turnDeadlineAt?.toISOString() ?? null,
    vaultPda: row.vaultPda ?? null,
    playerLockTxSignature: row.playerLockTxSignature ?? null,
    opponentLockTxSignature: row.opponentLockTxSignature ?? null,
    settleTxSignature: row.settleTxSignature ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class BattleRepositoryImpl implements BattleRepository {
  public async processQuickMatchQueue(input: {
    userId: string;
    enqueue?: QuickMatchQueueInput;
    buildSession: (player: StoredQuickMatchQueueRecord, opponent: StoredQuickMatchQueueRecord, id: string) => QuickMatchSessionInput;
  }): Promise<{ queue: StoredQuickMatchQueueRecord; session: StoredBattleSessionRecord | null } | null> {
    const now = new Date();
    if (isPrismaDriverEnabled()) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw<Array<{ locked: number }>>(Prisma.sql`
          WITH queue_lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(8813042, 1)
          )
          SELECT 1::int AS locked FROM queue_lock
        `);
        await lockBattleDataIntegrity(tx);
        if (input.enqueue) {
          const active = await tx.battleSession.findFirst({
            where: { status: "ACTIVE", OR: [{ userId: input.userId }, { opponentUserId: input.userId }] },
          });
          if (active) throw AppError.conflict("Anda masih memiliki pertandingan aktif.");
          const existing = await tx.quickMatchQueueEntry.findUnique({ where: { userId: input.userId } });
          if (existing?.status === "WAITING") {
            if (existing.idempotencyKey !== input.enqueue.idempotencyKey) {
              throw AppError.conflict("Anda sudah berada dalam antrean quick match.");
            }
          } else if (existing?.idempotencyKey === input.enqueue.idempotencyKey) {
            return { queue: toQueueRecord(existing), session: null };
          } else {
            const queued = await tx.quickMatchQueueEntry.upsert({
              where: { userId: input.userId },
              create: {
                id: input.enqueue.id,
                userId: input.userId,
                deckId: input.enqueue.deckId,
                deckName: input.enqueue.deckName,
                battlePower: input.enqueue.battlePower,
                characterSlugsJson: JSON.stringify(input.enqueue.characterSlugs),
                instrumentSlugsJson: JSON.stringify(input.enqueue.instrumentSlugs),
                idempotencyKey: input.enqueue.idempotencyKey,
                acceptedAt: input.enqueue.acceptedAt,
                status: "WAITING",
                createdAt: now,
                updatedAt: now,
              },
              update: {
                id: input.enqueue.id,
                deckId: input.enqueue.deckId,
                deckName: input.enqueue.deckName,
                battlePower: input.enqueue.battlePower,
                characterSlugsJson: JSON.stringify(input.enqueue.characterSlugs),
                instrumentSlugsJson: JSON.stringify(input.enqueue.instrumentSlugs),
                idempotencyKey: input.enqueue.idempotencyKey,
                acceptedAt: input.enqueue.acceptedAt,
                status: "WAITING",
                battleSessionId: null,
                createdAt: now,
                updatedAt: now,
              },
            });
            void queued;
          }
        }

        const currentRow = await tx.quickMatchQueueEntry.findFirst({
          where: { userId: input.userId, status: "WAITING" },
        });
        if (!currentRow) {
          const previous = await tx.quickMatchQueueEntry.findUnique({ where: { userId: input.userId } });
          return previous ? { queue: toQueueRecord(previous), session: null } : null;
        }
        const current = toQueueRecord(currentRow);
        const widenAt = new Date(now.getTime() - 30_000);
        const currentHasWaited30s = Date.parse(current.createdAt) <= widenAt.getTime();
        const candidates = await tx.quickMatchQueueEntry.findMany({
          where: {
            status: "WAITING",
            userId: { not: input.userId },
            OR: currentHasWaited30s
              ? [
                  { battlePower: { gte: current.battlePower - 100, lte: current.battlePower + 100 } },
                  { userId: { not: input.userId } },
                ]
              : [
                  { battlePower: { gte: current.battlePower - 100, lte: current.battlePower + 100 } },
                  { createdAt: { lte: widenAt } },
                ],
          },
          orderBy: { createdAt: "asc" },
        });
        if (candidates.length === 0) return { queue: current, session: null };
        const orderedCandidates = candidates.map(toQueueRecord).sort((a, b) => {
          const aInRange = Math.abs(a.battlePower - current.battlePower) <= 100;
          const bInRange = Math.abs(b.battlePower - current.battlePower) <= 100;
          if (aInRange !== bInRange) return aInRange ? -1 : 1;
          return Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
            Math.abs(a.battlePower - current.battlePower) - Math.abs(b.battlePower - current.battlePower);
        });
        const eligible: StoredQuickMatchQueueRecord[] = [];
        for (const candidate of orderedCandidates) {
          const activeMatch = await tx.battleSession.findFirst({
            where: { status: "ACTIVE", OR: [{ userId: candidate.userId }, { opponentUserId: candidate.userId }] },
            select: { id: true },
          });
          if (activeMatch) continue;
          const inRange = Math.abs(current.battlePower - candidate.battlePower) <= 100;
          const eitherWaited30s = Date.parse(current.createdAt) + 30_000 <= now.getTime() ||
            Date.parse(candidate.createdAt) + 30_000 <= now.getTime();
          if (inRange || eitherWaited30s) eligible.push(candidate);
        }
        const opponent = eligible[0];
        if (!opponent) {
          return { queue: current, session: null };
        }
        const changed = await tx.quickMatchQueueEntry.updateMany({
          where: { id: { in: [current.id, opponent.id] }, status: "WAITING" },
          data: { status: "MATCHED", updatedAt: now },
        });
        if (changed.count !== 2) return { queue: current, session: null };
        const sessionInput = input.buildSession(current, opponent, randomUUID());
        const deadline = new Date(now.getTime() + 5 * 60_000);
        const session = await tx.battleSession.create({
          data: {
            id: sessionInput.id,
            userId: sessionInput.userId,
            opponentUserId: sessionInput.opponentUserId,
            deckId: sessionInput.deckId,
            deckName: sessionInput.deckName,
            opponentDeckId: sessionInput.opponentDeckId,
            opponentDeckName: sessionInput.opponentDeckName,
            isQuickMatch: true,
            playerDeckCardSlugsJson: JSON.stringify(sessionInput.playerDeckCardSlugs),
            opponentDeckCardSlugsJson: JSON.stringify(sessionInput.opponentDeckCardSlugs),
            botDifficulty: "HARD",
            rulesVersion: "rules-v1-pvp",
            stateJson: sessionInput.stateJson,
            eventsJson: sessionInput.eventsJson,
            rngCommitment: sessionInput.rngCommitment,
            rngSecret: sessionInput.rngSecret,
            rngCounter: sessionInput.rngCounter,
            rngDrawsJson: sessionInput.rngDrawsJson,
            lastSeenAt: now,
            opponentLastSeenAt: now,
            turnDeadlineAt: deadline,
            createdAt: now,
            updatedAt: now,
          },
        });
        await tx.quickMatchQueueEntry.updateMany({
          where: { id: { in: [current.id, opponent.id] } },
          data: { battleSessionId: session.id },
        });
        const matched = await tx.quickMatchQueueEntry.findUniqueOrThrow({ where: { id: current.id } });
        return { queue: toQueueRecord(matched), session: toStoredSession(session) };
      }, { maxWait: 10_000, timeout: 15_000 }); // Perpanjang timeout transaksi matchmaking agar toleran terhadap latency Neon.
      return result;
    }

    const store = getEmbeddedStore();
    if (input.enqueue) {
      const active = store.battleSessions.some((session) => session.status === "ACTIVE" &&
        (session.userId === input.userId || session.opponentUserId === input.userId));
      if (active) throw AppError.conflict("Anda masih memiliki pertandingan aktif.");
      const existing = store.quickMatchQueue.find((entry) => entry.userId === input.userId);
      if (existing?.status === "WAITING") {
        if (existing.idempotencyKey !== input.enqueue.idempotencyKey) throw AppError.conflict("Anda sudah berada dalam antrean quick match.");
      } else if (existing?.idempotencyKey !== input.enqueue.idempotencyKey) {
        const queued: StoredQuickMatchQueueRecord = {
          ...input.enqueue,
          characterSlugsJson: JSON.stringify(input.enqueue.characterSlugs),
          instrumentSlugsJson: JSON.stringify(input.enqueue.instrumentSlugs),
          acceptedAt: input.enqueue.acceptedAt.toISOString(),
          status: "WAITING",
          battleSessionId: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        const index = store.quickMatchQueue.findIndex((entry) => entry.userId === input.userId);
        if (index >= 0) store.quickMatchQueue[index] = queued;
        else store.quickMatchQueue.push(queued);
      }
    }
    const current = store.quickMatchQueue.find((entry) => entry.userId === input.userId && entry.status === "WAITING");
    if (!current) {
      const previous = store.quickMatchQueue.find((entry) => entry.userId === input.userId);
      return previous ? { queue: previous, session: null } : null;
    }
    const candidates = store.quickMatchQueue
      .filter((entry) => entry.status === "WAITING" && entry.userId !== input.userId)
      .filter((entry) => Math.abs(entry.battlePower - current.battlePower) <= 100 ||
        Date.parse(entry.createdAt) <= now.getTime() - 30_000 ||
        Date.parse(current.createdAt) <= now.getTime() - 30_000)
      .filter((entry) => !store.battleSessions.some((session) => session.status === "ACTIVE" &&
        (session.userId === entry.userId || session.opponentUserId === entry.userId)))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const opponent = candidates[0];
    if (!opponent) return { queue: current, session: null };
    const sessionInput = input.buildSession(current, opponent, randomUUID());
    const deadline = new Date(now.getTime() + 5 * 60_000).toISOString();
    const session: StoredBattleSessionRecord = {
      id: sessionInput.id,
      createRequestKey: null,
      userId: sessionInput.userId,
      opponentUserId: sessionInput.opponentUserId,
      deckId: sessionInput.deckId,
      deckName: sessionInput.deckName,
      opponentDeckId: sessionInput.opponentDeckId,
      opponentDeckName: sessionInput.opponentDeckName,
      isQuickMatch: true,
      playerDeckCardSlugsJson: JSON.stringify(sessionInput.playerDeckCardSlugs),
      opponentDeckCardSlugsJson: JSON.stringify(sessionInput.opponentDeckCardSlugs),
      botDifficulty: "HARD",
      rulesVersion: "rules-v1-pvp",
      sequence: 0,
      status: "ACTIVE",
      stateJson: sessionInput.stateJson,
      eventsJson: sessionInput.eventsJson,
      lastSeenAt: now.toISOString(),
      opponentLastSeenAt: now.toISOString(),
      disconnectedAt: null,
      reconnectDeadlineAt: null,
      turnDeadlineAt: deadline,
      rngCommitment: sessionInput.rngCommitment,
      rngSecret: sessionInput.rngSecret,
      rngCounter: sessionInput.rngCounter,
      rngDrawsJson: sessionInput.rngDrawsJson,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    current.status = "MATCHED";
    opponent.status = "MATCHED";
    current.battleSessionId = session.id;
    opponent.battleSessionId = session.id;
    current.updatedAt = now.toISOString();
    opponent.updatedAt = now.toISOString();
    store.battleSessions.unshift(session);
    persistEmbeddedStore(store);
    logServerEvent("info", "battle.session.started", {
      matchId: session.id,
      isQuickMatch: true,
      storage: "embedded",
    });
    return { queue: current, session };
  }

  public async cancelQuickMatchQueue(userId: string): Promise<boolean> {
    if (isPrismaDriverEnabled()) {
      const changed = await prisma.$transaction(async (tx) => {
        await lockBattleDataIntegrity(tx);
        return tx.quickMatchQueueEntry.updateMany({
          where: { userId, status: "WAITING" },
          data: { status: "CANCELLED", updatedAt: new Date() },
        });
      });
      return changed.count === 1;
    }
    const entry = getEmbeddedStore().quickMatchQueue.find((row) => row.userId === userId && row.status === "WAITING");
    if (!entry) return false;
    entry.status = "CANCELLED";
    entry.updatedAt = new Date().toISOString();
    persistEmbeddedStore(getEmbeddedStore());
    return true;
  }

  public async getQuickMatchQueueEntry(userId: string): Promise<StoredQuickMatchQueueRecord | null> {
    if (isPrismaDriverEnabled()) {
      const entry = await prisma.quickMatchQueueEntry.findUnique({ where: { userId } });
      return entry ? toQueueRecord(entry) : null;
    }
    return getEmbeddedStore().quickMatchQueue.find((entry) => entry.userId === userId) ?? null;
  }

  public async createBattleSession(input: {
    id: string;
    createRequestKey: string;
    userId: string;
    deckId: string;
    deckName: string;
    botDifficulty: string;
    rulesVersion: string;
    stateJson: string;
    eventsJson: string;
    rngCommitment: string;
    rngSecret: string;
    rngCounter: number;
    rngDrawsJson: string;
    storyKingdom?: "MAJAPAHIT" | "PAJAJARAN";
    storyMissionId?: string;
    storyChoiceId?: string | null;
  }): Promise<StoredBattleSessionRecord> {
    const now = new Date();
    const turnDeadlineAt = new Date(now.getTime() + 5 * 60_000);
    if (isPrismaDriverEnabled()) {
      try {
        const row = await prisma.$transaction(async (tx) => {
          const existing = await tx.battleSession.findUnique({
            where: { createRequestKey: input.createRequestKey },
          });
          if (existing) {
            if (existing.userId !== input.userId) throw AppError.conflict("Kunci idempotensi sudah digunakan.");
            return existing;
          }
          await assertBattleDataUnlocked(tx, [input.userId]);
          return tx.battleSession.create({
            data: { ...input, lastSeenAt: now, turnDeadlineAt, createdAt: now, updatedAt: now },
          });
        });
        return toStoredSession(row);
      } catch (error: unknown) {
        const replay = await prisma.battleSession.findUnique({
          where: { createRequestKey: input.createRequestKey },
        });
        if (replay?.userId === input.userId) return toStoredSession(replay);
        throw error;
      }
    }

    const store = getEmbeddedStore();
    const existing = store.battleSessions.find(
      (session) => session.createRequestKey === input.createRequestKey
    );
    if (existing) {
      if (existing.userId !== input.userId) throw AppError.conflict("Kunci idempotensi sudah digunakan.");
      return existing;
    }
    assertEmbeddedBattleDataUnlocked([input.userId]);
    const record: StoredBattleSessionRecord = {
      ...input,
      sequence: 0,
      status: "ACTIVE",
      lastSeenAt: now.toISOString(),
      disconnectedAt: null,
      reconnectDeadlineAt: null,
      turnDeadlineAt: turnDeadlineAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    store.battleSessions.unshift(record);
    persistEmbeddedStore(store);
    logServerEvent("info", "battle.session.started", {
      matchId: record.id,
      isQuickMatch: false,
      storage: "embedded",
    });
    return record;
  }

  public async getBattleSession(
    id: string,
    userId: string
  ): Promise<StoredBattleSessionRecord | null> {
    if (isPrismaDriverEnabled()) {
      const row = await prisma.battleSession.findFirst({ where: { id, OR: [{ userId }, { opponentUserId: userId }] } });
      return row ? toStoredSession(row) : null;
    }
    return getEmbeddedStore().battleSessions.find((row) => row.id === id && (row.userId === userId || row.opponentUserId === userId)) ?? null;
  }

  public async getBattleSessionByCreateRequestKey(createRequestKey: string): Promise<StoredBattleSessionRecord | null> {
    if (isPrismaDriverEnabled()) {
      const row = await prisma.battleSession.findUnique({ where: { createRequestKey } });
      return row ? toStoredSession(row) : null;
    }
    return getEmbeddedStore().battleSessions.find((row) => row.createRequestKey === createRequestKey) ?? null;
  }

  public async getLatestActiveBattleSession(
    userId: string
  ): Promise<StoredBattleSessionRecord | null> {
    if (isPrismaDriverEnabled()) {
      const row = await prisma.battleSession.findFirst({
        where: { status: "ACTIVE", OR: [{ userId }, { opponentUserId: userId }] },
        orderBy: { updatedAt: "desc" },
      });
      return row ? toStoredSession(row) : null;
    }
    return getEmbeddedStore().battleSessions
      .filter((row) => (row.userId === userId || row.opponentUserId === userId) && row.status === "ACTIVE")
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;
  }

  public async updateBattleSession(input: {
    id: string;
    userId: string;
    expectedSequence: number;
    stateJson: string;
    eventsJson: string;
    status: "ACTIVE" | "COMPLETED";
    rngCounter: number;
    rngDrawsJson: string;
    completion?: CreateMatchLogInput;
  }): Promise<StoredBattleSessionRecord | null> {
    const now = new Date();
    if (isPrismaDriverEnabled()) {
      // Untuk aksi normal (tanpa completion), jalankan updateMany atomik dengan optimistic lock
      // `sequence` di luar $transaction agar tidak menahan koneksi pool & menghindari timeout 5s.
      if (!input.completion) {
        const participant = await prisma.battleSession.findUnique({
          where: { id: input.id },
          select: { userId: true, opponentUserId: true },
        });
        if (!participant || (participant.userId !== input.userId && participant.opponentUserId !== input.userId)) {
          return null;
        }
        const actorIsOpponent = participant.opponentUserId === input.userId;
        const changed = await prisma.battleSession.updateMany({
          where: {
            id: input.id,
            OR: [{ userId: input.userId }, { opponentUserId: input.userId }],
            sequence: input.expectedSequence,
            status: "ACTIVE",
          },
          data: {
            sequence: { increment: 1 },
            stateJson: input.stateJson,
            eventsJson: input.eventsJson,
            status: input.status,
            rngCounter: input.rngCounter,
            rngDrawsJson: input.rngDrawsJson,
            ...(actorIsOpponent
              ? { opponentLastSeenAt: now, opponentDisconnectedAt: null, opponentReconnectDeadlineAt: null }
              : { lastSeenAt: now, disconnectedAt: null, reconnectDeadlineAt: null }),
            turnDeadlineAt: input.status === "ACTIVE" ? new Date(now.getTime() + 5 * 60_000) : null,
            updatedAt: now,
          },
        });
        if (changed.count !== 1) return null;
        const row = await prisma.battleSession.findFirst({
          where: { id: input.id, OR: [{ userId: input.userId }, { opponentUserId: input.userId }] },
        });
        return row ? toStoredSession(row) : null;
      }

      let completionStage = "transaction_started";
      const completionAuditState: { current: {
        winnerUserId: string;
        loserUserId: string;
        winnerSide: "PLAYER" | "BOT";
        rewardCardSlug: string | null;
        eligibleCardCount: number;
        transferStatus: "TRANSFERRED" | "NO_ELIGIBLE_CARD" | "PENDING";
        ledgerTransactionId: string | null;
      } | null } = { current: null };
      const row = await prisma.$transaction(async (tx) => {
        completionStage = "acquiring_integrity_lock";
        if (input.completion) await lockBattleDataIntegrity(tx);
        completionStage = "updating_session";
        const participant = await tx.battleSession.findUnique({
          where: { id: input.id },
          select: { userId: true, opponentUserId: true },
        });
        const actorIsOpponent = participant?.opponentUserId === input.userId;
        const changed = await tx.battleSession.updateMany({
          where: {
            id: input.id,
            OR: [{ userId: input.userId }, { opponentUserId: input.userId }],
            sequence: input.expectedSequence,
            status: "ACTIVE",
          },
          data: {
            sequence: { increment: 1 },
            stateJson: input.stateJson,
            eventsJson: input.eventsJson,
            status: input.status,
            rngCounter: input.rngCounter,
            rngDrawsJson: input.rngDrawsJson,
            ...(actorIsOpponent
              ? { opponentLastSeenAt: now, opponentDisconnectedAt: null, opponentReconnectDeadlineAt: null }
              : { lastSeenAt: now, disconnectedAt: null, reconnectDeadlineAt: null }),
            turnDeadlineAt: input.status === "ACTIVE" ? new Date(now.getTime() + 5 * 60_000) : null,
            updatedAt: now,
          },
        });
        if (changed.count !== 1) return null;
        if (input.completion) {
          const completion = input.completion;
          if (completion.quickMatch) {
            const pvp = completion.quickMatch;
            const playerUserId = completion.userId;
            if (!playerUserId) throw AppError.conflict("Peserta quick match tidak valid.");
            const playerWon = completion.winner === "PLAYER";
            const winnerUserId = playerWon ? playerUserId : pvp.opponentUserId;
            const loserUserId = playerWon ? pvp.opponentUserId : playerUserId;
            const losingDeckSlugs = playerWon ? pvp.opponentDeckCardSlugs : pvp.playerDeckCardSlugs;
            completionStage = "selecting_transfer_card";
            const transferableCardTypes = await tx.card.findMany({
              where: {
                slug: { in: losingDeckSlugs },
                publicationStatus: "ACTIVE",
                owners: { some: { userId: loserUserId, quantity: { gt: 0 } } },
              },
              select: { id: true, slug: true, cardType: true },
            });
            const deckCopyCountBySlug = new Map<string, number>();
            for (const slug of losingDeckSlugs) {
              deckCopyCountBySlug.set(slug, (deckCopyCountBySlug.get(slug) ?? 0) + 1);
            }
            const transferableCards = transferableCardTypes.flatMap((card) =>
              Array.from({ length: deckCopyCountBySlug.get(card.slug) ?? 0 }, () => card)
            );
            let rewardCardSlug: string | null = null;
            completionAuditState.current = {
              winnerUserId,
              loserUserId,
              winnerSide: completion.winner,
              rewardCardSlug: null,
              eligibleCardCount: transferableCards.length,
              transferStatus: "NO_ELIGIBLE_CARD",
              ledgerTransactionId: null,
            };
            if (transferableCards.length > 0) {
              const card = transferableCards[randomInt(transferableCards.length)];
              rewardCardSlug = card.slug;
              completionAuditState.current = {
                ...completionAuditState.current!,
                rewardCardSlug,
                transferStatus: "PENDING",
              };
              completionStage = "debiting_loser_card";
              const debit = await tx.$queryRaw<Array<{ cardId: string }>>(Prisma.sql`
                UPDATE "user_cards"
                SET "quantity" = "quantity" - 1, "updatedAt" = clock_timestamp()
                WHERE "userId" = ${loserUserId} AND "cardId" = ${card.id} AND "quantity" >= 1
                RETURNING "cardId"
              `);
              if (debit.length !== 1) throw AppError.conflict("Kartu hadiah sudah tidak dimiliki pemain yang kalah.");
              const transactionId = randomUUID();
              completionStage = "creating_transfer_ledger";
              await tx.cardLedgerTransaction.create({
                data: {
                  id: transactionId,
                  idempotencyKey: `pvp-card-transfer:${input.id}`,
                  type: "PVP_CARD_TRANSFER",
                  referenceId: input.id,
                  actorUserId: winnerUserId,
                },
              });
              completionStage = "crediting_winner_card";
              await tx.$executeRaw(Prisma.sql`
                INSERT INTO "user_cards" (
                  "id", "userId", "cardId", "quantity", "source", "createdAt", "updatedAt"
                ) VALUES (${randomUUID()}, ${winnerUserId}, ${card.id}, 1, 'PVP_CARD_TRANSFER', clock_timestamp(), clock_timestamp())
                ON CONFLICT ("userId", "cardId") DO UPDATE SET
                  "quantity" = "user_cards"."quantity" + 1,
                  "source" = 'PVP_CARD_TRANSFER',
                  "updatedAt" = clock_timestamp()
              `);
              completionStage = "writing_transfer_entries";
              await tx.cardLedgerEntry.createMany({
                data: [
                  { id: randomUUID(), transactionId, cardId: card.id, accountType: "USER", accountId: loserUserId, quantity: -1 },
                  { id: randomUUID(), transactionId, cardId: card.id, accountType: "USER", accountId: winnerUserId, quantity: 1 },
                ],
              });
              completionAuditState.current = {
                winnerUserId,
                loserUserId,
                winnerSide: completion.winner,
                rewardCardSlug,
                eligibleCardCount: transferableCards.length,
                transferStatus: "TRANSFERRED",
                ledgerTransactionId: transactionId,
              };
              completionStage = "saving_reward_on_session";
              await tx.battleSession.update({ where: { id: input.id }, data: { rewardCardSlug: card.slug } });
            }
            completionStage = "writing_match_history";
            await tx.match.createMany({
              data: [
                {
                  userId: playerUserId,
                  deckName: completion.playerDeckName,
                  botDifficulty: "PVP",
                  winner: playerWon ? "PLAYER" : "BOT",
                  totalTurns: completion.totalTurns,
                  durationSec: completion.durationSec,
                  battleLogJson: JSON.stringify({ playerScore: completion.playerScore, botScore: completion.botScore, opponentUserId: pvp.opponentUserId, rewardCardSlug }),
                },
                {
                  userId: pvp.opponentUserId,
                  deckName: pvp.opponentDeckName,
                  botDifficulty: "PVP",
                  winner: playerWon ? "BOT" : "PLAYER",
                  totalTurns: completion.totalTurns,
                  durationSec: completion.durationSec,
                  battleLogJson: JSON.stringify({ playerScore: completion.botScore, botScore: completion.playerScore, opponentUserId: playerUserId, rewardCardSlug }),
                },
              ],
            });
          } else {
            await tx.match.create({
              data: {
                userId: completion.userId,
                deckName: completion.playerDeckName,
                botDifficulty: completion.botDifficulty,
                winner: completion.winner,
                totalTurns: completion.totalTurns,
                durationSec: completion.durationSec,
                battleLogJson: JSON.stringify({ playerScore: completion.playerScore, botScore: completion.botScore }),
              },
            });
          }
          if (completion.pointReward) {
            await grantNusaPointsPrisma(tx, {
              ...completion.pointReward,
              sourceId: input.id,
              now,
            });
          }
        }
        completionStage = "loading_saved_session";
        return tx.battleSession.findFirst({ where: { id: input.id, OR: [{ userId: input.userId }, { opponentUserId: input.userId }] } });
      }, { maxWait: 10_000, timeout: 15_000 }) // Perpanjang timeout untuk transaksi completion (transfer kartu PvP + ledger + poin).
        .catch((error: unknown) => {
        if (input.completion?.quickMatch) {
          logServerEvent("error", "battle.session.completion_failed", {
            matchId: input.id,
            actorUserId: input.userId,
            winnerUserId: completionAuditState.current?.winnerUserId ?? null,
            loserUserId: completionAuditState.current?.loserUserId ?? null,
            winnerSide: completionAuditState.current?.winnerSide ?? input.completion.winner,
            rewardCardSlug: completionAuditState.current?.rewardCardSlug ?? null,
            eligibleCardCount: completionAuditState.current?.eligibleCardCount ?? null,
            transferAttemptStatus: completionAuditState.current?.transferStatus ?? "NOT_REACHED",
            transferStatus: completionAuditState.current ? "ROLLED_BACK" : "NOT_REACHED",
            ledgerTransactionId: completionAuditState.current?.ledgerTransactionId ?? null,
            failedStage: completionStage,
            transactionCommitted: false,
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
        }
        throw error;
      });
      if (input.completion?.quickMatch && completionAuditState.current) {
        logServerEvent("info", "battle.session.card_transfer_committed", {
          matchId: input.id,
          actorUserId: input.userId,
          winnerUserId: completionAuditState.current.winnerUserId,
          loserUserId: completionAuditState.current.loserUserId,
          winnerSide: completionAuditState.current.winnerSide,
          rewardCardSlug: completionAuditState.current.rewardCardSlug,
          eligibleCardCount: completionAuditState.current.eligibleCardCount,
          transferStatus: completionAuditState.current.transferStatus,
          ledgerTransactionId: completionAuditState.current.ledgerTransactionId,
          transactionCommitted: true,
        });
      }
      return row ? toStoredSession(row) : null;
    }

    const store = getEmbeddedStore();
    let embeddedCompletionAudit: {
      winnerUserId: string;
      loserUserId: string;
      winnerSide: "PLAYER" | "BOT";
      rewardCardSlug: string | null;
      eligibleCardCount: number;
      transferStatus: "TRANSFERRED" | "NO_ELIGIBLE_CARD";
    } | null = null;
    const index = store.battleSessions.findIndex(
      (row) => row.id === input.id && (row.userId === input.userId || row.opponentUserId === input.userId) && row.sequence === input.expectedSequence && row.status === "ACTIVE"
    );
    if (index < 0) return null;
    const updated: StoredBattleSessionRecord = {
      ...store.battleSessions[index],
      sequence: input.expectedSequence + 1,
      stateJson: input.stateJson,
      eventsJson: input.eventsJson,
      status: input.status,
      rngCounter: input.rngCounter,
      rngDrawsJson: input.rngDrawsJson,
      ...(store.battleSessions[index].opponentUserId === input.userId
        ? { opponentLastSeenAt: now.toISOString(), opponentDisconnectedAt: null, opponentReconnectDeadlineAt: null }
        : { lastSeenAt: now.toISOString(), disconnectedAt: null, reconnectDeadlineAt: null }),
      turnDeadlineAt: input.status === "ACTIVE" ? new Date(now.getTime() + 5 * 60_000).toISOString() : null,
      updatedAt: now.toISOString(),
    };
    if (input.completion) {
      const completion = input.completion;
      if (completion.quickMatch) {
        const pvp = completion.quickMatch;
        const playerUserId = completion.userId;
        if (!playerUserId) throw AppError.conflict("Peserta quick match tidak valid.");
        const playerWon = completion.winner === "PLAYER";
        const winnerUserId = playerWon ? playerUserId : pvp.opponentUserId;
        const loserUserId = playerWon ? pvp.opponentUserId : playerUserId;
        const losingDeckSlugs = playerWon ? pvp.opponentDeckCardSlugs : pvp.playerDeckCardSlugs;
        const transferableCardTypes = store.cards.filter((item) => losingDeckSlugs.includes(item.slug) &&
          item.publicationStatus === "ACTIVE" &&
          store.userCards.some((holding) => holding.userId === loserUserId && holding.cardId === item.id && holding.quantity > 0));
        const deckCopyCountBySlug = new Map<string, number>();
        for (const slug of losingDeckSlugs) {
          deckCopyCountBySlug.set(slug, (deckCopyCountBySlug.get(slug) ?? 0) + 1);
        }
        const transferableCards = transferableCardTypes.flatMap((card) =>
          Array.from({ length: deckCopyCountBySlug.get(card.slug) ?? 0 }, () => card)
        );
        embeddedCompletionAudit = {
          winnerUserId,
          loserUserId,
          winnerSide: completion.winner,
          rewardCardSlug: null,
          eligibleCardCount: transferableCards.length,
          transferStatus: "NO_ELIGIBLE_CARD",
        };
        const card = transferableCards.length > 0
          ? transferableCards[randomInt(transferableCards.length)]
          : null;
        if (card) {
          const loserHolding = store.userCards.find((item) => item.userId === loserUserId && item.cardId === card.id && item.quantity > 0);
          if (!loserHolding) throw AppError.conflict("Kartu hadiah sudah tidak dimiliki pemain yang kalah.");
          loserHolding.quantity -= 1;
          const winnerHolding = store.userCards.find((item) => item.userId === winnerUserId && item.cardId === card.id);
          if (winnerHolding) {
            winnerHolding.quantity += 1;
            winnerHolding.source = "PVP_CARD_TRANSFER";
          } else {
            store.userCards.push({
              id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              userId: winnerUserId,
              cardId: card.id,
              quantity: 1,
              source: "PVP_CARD_TRANSFER",
              createdAt: now.toISOString(),
            });
          }
          updated.rewardCardSlug = card.slug;
          embeddedCompletionAudit = {
            winnerUserId,
            loserUserId,
            winnerSide: completion.winner,
            rewardCardSlug: card.slug,
            eligibleCardCount: transferableCards.length,
            transferStatus: "TRANSFERRED",
          };
        }
        store.matchLogs.unshift(
          {
            id: `mtc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: playerUserId,
            playerDeckName: completion.playerDeckName,
            botDifficulty: "PVP",
            winner: completion.winner,
            totalTurns: completion.totalTurns,
            durationSec: completion.durationSec,
            playerScore: completion.playerScore,
            botScore: completion.botScore,
            createdAt: now.toISOString(),
          },
          {
            id: `mtc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: pvp.opponentUserId,
            playerDeckName: pvp.opponentDeckName,
            botDifficulty: "PVP",
            winner: playerWon ? "BOT" : "PLAYER",
            totalTurns: completion.totalTurns,
            durationSec: completion.durationSec,
            playerScore: completion.botScore,
            botScore: completion.playerScore,
            createdAt: now.toISOString(),
          }
        );
      } else {
        store.matchLogs.unshift({
          id: `mtc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: completion.userId,
          playerDeckName: completion.playerDeckName,
          botDifficulty: completion.botDifficulty,
          winner: completion.winner,
          totalTurns: completion.totalTurns,
          durationSec: completion.durationSec,
          playerScore: completion.playerScore,
          botScore: completion.botScore,
          createdAt: now.toISOString(),
        });
      }
      if (completion.pointReward) {
        const reward = completion.pointReward;
        const recipient = store.users.find((entry) => entry.id === reward.userId);
        const opponent = reward.opponentUserId
          ? store.users.find((entry) => entry.id === reward.opponentUserId)
          : null;
        const dayStart = getJakartaDayStart(now).getTime();
        const earningSources = new Set(["BATTLE_BOT_WIN", "BATTLE_PVP_WIN", "LEAGUE_MATCH_WIN", "LEAGUE_CHAMPION", "STORY_MODE"]);
        const dailyEntries = store.nusaPointTransactions.filter((entry) =>
          entry.userId === reward.userId && earningSources.has(entry.source) && Date.parse(entry.createdAt) >= dayStart
        );
        const modeEntries = dailyEntries.filter((entry) => reward.source === "BATTLE_BOT_WIN"
          ? entry.source === "BATTLE_BOT_WIN"
          : entry.source !== "BATTLE_BOT_WIN" && entry.source !== "STORY_MODE");
        const modeCap = reward.source === "BATTLE_BOT_WIN" ? NUSA_POINT_POLICY.dailyBotCap : NUSA_POINT_POLICY.dailyPvpCap;
        const modeTotal = modeEntries.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
        const total = dailyEntries.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0);
        const duplicate = store.nusaPointTransactions.some((entry) =>
          entry.userId === reward.userId && entry.source === reward.source && entry.sourceId === input.id
        );
        const recentPair = reward.source === "BATTLE_PVP_WIN" && reward.opponentUserId &&
          store.nusaPointTransactions.some((entry) => entry.source === "BATTLE_PVP_WIN" &&
            Date.parse(entry.createdAt) >= now.getTime() - NUSA_POINT_POLICY.sameOpponentCooldownMs &&
            ((entry.userId === reward.userId && entry.opponentUserId === reward.opponentUserId) ||
              (entry.userId === reward.opponentUserId && entry.opponentUserId === reward.userId)));
        const amount = Math.min(
          reward.amount,
          Math.max(0, modeCap - modeTotal),
          Math.max(0, NUSA_POINT_POLICY.dailyTotalCap - total),
        );
        if (!duplicate && !recentPair && recipient &&
          (!reward.opponentUserId || (opponent && opponent.id !== recipient.id)) && amount > 0) {
          store.nusaPointTransactions.push({
            id: randomUUID(),
            userId: reward.userId,
            amount,
            source: reward.source,
            sourceId: input.id,
            opponentUserId: reward.opponentUserId ?? null,
            createdAt: now.toISOString(),
          });
        }
      }
    }
    store.battleSessions[index] = updated;
    persistEmbeddedStore(store);
    if (embeddedCompletionAudit) {
      logServerEvent("info", "battle.session.card_transfer_persisted", {
        matchId: input.id,
        actorUserId: input.userId,
        winnerUserId: embeddedCompletionAudit.winnerUserId,
        loserUserId: embeddedCompletionAudit.loserUserId,
        winnerSide: embeddedCompletionAudit.winnerSide,
        rewardCardSlug: embeddedCompletionAudit.rewardCardSlug,
        eligibleCardCount: embeddedCompletionAudit.eligibleCardCount,
        transferStatus: embeddedCompletionAudit.transferStatus,
        persistenceCompleted: true,
        storage: "embedded",
      });
    }
    return updated;
  }

  public async reconnectBattleSession(
    id: string,
    userId: string,
    now: Date,
    staleMs: number,
    graceMs: number
  ): Promise<StoredBattleSessionRecord | null> {
    if (isPrismaDriverEnabled()) {
      // Tidak memakai prisma.$transaction agar heartbeat /reconnect tidak menahan koneksi pool
      // dan tidak terkena interactive transaction timeout (5000ms) saat row-lock contention.
      const current = await prisma.battleSession.findFirst({ where: { id, OR: [{ userId }, { opponentUserId: userId }] } });
      if (!current) return null;
      if (current.status === "COMPLETED") return toStoredSession(current);
      if (current.status !== "ACTIVE") return null;
      const isOpponent = current.opponentUserId === userId;
      const lastSeenAt = (isOpponent ? current.opponentLastSeenAt : current.lastSeenAt) ?? current.createdAt;
      const disconnectDeadline = isOpponent ? current.opponentReconnectDeadlineAt : current.reconnectDeadlineAt;
      const staleAt = lastSeenAt.getTime() + staleMs;
      const isLeagueSession = current.rulesVersion === "league-v1";
      const deadlineAt = disconnectDeadline?.getTime() ??
        (now.getTime() > staleAt ? (isLeagueSession ? lastSeenAt.getTime() + graceMs : staleAt + graceMs) : Number.POSITIVE_INFINITY);
      if (
        deadlineAt <= now.getTime() ||
        (current.turnDeadlineAt && current.turnDeadlineAt.getTime() <= now.getTime())
      ) {
        const event = {
          type: "TIMEOUT",
          auditSequence: (JSON.parse(current.eventsJson || "[]") as unknown[]).length,
          cause: deadlineAt <= now.getTime() ? "RECONNECT_GRACE_EXPIRED" : "TURN_DEADLINE_EXPIRED",
          at: now.toISOString(),
        };
        await prisma.battleSession.updateMany({
          where: { id, OR: [{ userId }, { opponentUserId: userId }], status: "ACTIVE", sequence: current.sequence },
          data: {
            sequence: { increment: 1 },
            eventsJson: appendAuditEvent(current.eventsJson, event),
            status: "ABANDONED",
            turnDeadlineAt: null,
            updatedAt: now,
          },
        });
        return null;
      }
      // Heartbeat normal tidak memfilter `sequence` agar tidak bentrok (409) saat aksi berjalan bersamaan.
      const changed = await prisma.battleSession.updateMany({
        where: { id, OR: [{ userId }, { opponentUserId: userId }], status: "ACTIVE" },
        data: {
          ...(isOpponent
            ? { opponentLastSeenAt: now, opponentDisconnectedAt: null, opponentReconnectDeadlineAt: null }
            : { lastSeenAt: now, disconnectedAt: null, reconnectDeadlineAt: null }),
          ...(current.rulesVersion === "league-v1" ? { turnDeadlineAt: new Date(now.getTime() + 5 * 60_000) } : {}),
          updatedAt: now,
        },
      });
      if (changed.count !== 1) return null;
      const latest = await prisma.battleSession.findFirst({ where: { id, OR: [{ userId }, { opponentUserId: userId }] } });
      return latest ? toStoredSession(latest) : null;
    }

    const store = getEmbeddedStore();
    const current = store.battleSessions.find(
      (row) => row.id === id && (row.userId === userId || row.opponentUserId === userId)
    );
    if (!current) return null;
    if (current.status === "COMPLETED") return current;
    if (current.status !== "ACTIVE") return null;
    const isOpponent = current.opponentUserId === userId;
    const lastSeenAt = (isOpponent ? current.opponentLastSeenAt : current.lastSeenAt) ?? current.createdAt;
    const disconnectDeadline = isOpponent ? current.opponentReconnectDeadlineAt : current.reconnectDeadlineAt;
    const staleAt = Date.parse(lastSeenAt) + staleMs;
    const isLeagueSession = current.rulesVersion === "league-v1";
    const deadlineAt = disconnectDeadline
      ? Date.parse(disconnectDeadline)
      : (now.getTime() > staleAt ? (isLeagueSession ? Date.parse(lastSeenAt) + graceMs : staleAt + graceMs) : Number.POSITIVE_INFINITY);
    if (
      deadlineAt <= now.getTime() ||
      (current.turnDeadlineAt && Date.parse(current.turnDeadlineAt) <= now.getTime())
    ) {
      const event = {
        type: "TIMEOUT",
        auditSequence: (JSON.parse(current.eventsJson || "[]") as unknown[]).length,
        cause: deadlineAt <= now.getTime() ? "RECONNECT_GRACE_EXPIRED" : "TURN_DEADLINE_EXPIRED",
        at: now.toISOString(),
      };
      current.eventsJson = appendAuditEvent(current.eventsJson, event);
      current.sequence += 1;
      current.status = "ABANDONED";
      current.turnDeadlineAt = null;
      current.updatedAt = now.toISOString();
      persistEmbeddedStore(store);
      return null;
    }
    if (isOpponent) {
      current.opponentLastSeenAt = now.toISOString();
      current.opponentDisconnectedAt = null;
      current.opponentReconnectDeadlineAt = null;
    } else {
      current.lastSeenAt = now.toISOString();
      current.disconnectedAt = null;
      current.reconnectDeadlineAt = null;
    }
    if (current.rulesVersion === "league-v1") current.turnDeadlineAt = new Date(now.getTime() + 5 * 60_000).toISOString();
    current.updatedAt = now.toISOString();
    persistEmbeddedStore(store);
    return current;
  }

  public async sweepBattleSessions(
    now: Date,
    staleBefore: Date,
    graceMs: number,
    sessionId?: string
  ): Promise<number> {
    // Jika sessionId diberikan (dari /reconnect atau /actions), hanya sweep sesi tersebut
    // agar tidak melakukan full scan & lock pada semua sesi ACTIVE.
    const activeSessions: StoredBattleSessionRecord[] = isPrismaDriverEnabled()
      ? (await prisma.battleSession.findMany({ where: { status: "ACTIVE", ...(sessionId ? { id: sessionId } : {}) } })).map(toStoredSession)
      : getEmbeddedStore().battleSessions.filter((session) => session.status === "ACTIVE" && (!sessionId || session.id === sessionId));
    const quickStaleBefore = new Date(now.getTime() - 15_000);

    for (const session of activeSessions) {
      const ownerCutoff = session.isQuickMatch ? quickStaleBefore : staleBefore;
      const reconnectGraceMs = session.rulesVersion === "league-v1" ? 180_000 : 60_000;
      const ownerDisconnected = session.disconnectedAt;
      if (!ownerDisconnected && Date.parse(session.lastSeenAt) <= ownerCutoff.getTime()) {
        const deadline = new Date(Date.parse(session.lastSeenAt) + (session.isQuickMatch
          ? (session.rulesVersion === "league-v1" ? reconnectGraceMs : 15_000 + reconnectGraceMs)
          : (now.getTime() - ownerCutoff.getTime()) + graceMs));
        const event = {
          type: "DISCONNECTED",
          userId: session.userId,
          auditSequence: (JSON.parse(session.eventsJson || "[]") as unknown[]).length,
          at: now.toISOString(),
          reconnectDeadlineAt: deadline.toISOString(),
        };
        if (isPrismaDriverEnabled()) {
          await prisma.battleSession.updateMany({
            where: { id: session.id, sequence: session.sequence, status: "ACTIVE", disconnectedAt: null },
            data: {
              sequence: { increment: 1 },
              eventsJson: appendAuditEvent(session.eventsJson, event),
              disconnectedAt: now,
              reconnectDeadlineAt: deadline,
              ...(session.rulesVersion === "league-v1" ? { turnDeadlineAt: new Date(deadline.getTime() + 5 * 60_000) } : {}),
              updatedAt: now,
            },
          });
        } else {
          session.sequence += 1;
          session.eventsJson = appendAuditEvent(session.eventsJson, event);
          session.disconnectedAt = now.toISOString();
          session.reconnectDeadlineAt = deadline.toISOString();
          if (session.rulesVersion === "league-v1") session.turnDeadlineAt = new Date(deadline.getTime() + 5 * 60_000).toISOString();
        }
      }
      const opponentLastSeen = session.opponentLastSeenAt ?? session.createdAt;
      if (session.isQuickMatch && session.opponentUserId && !session.opponentDisconnectedAt && Date.parse(opponentLastSeen) <= quickStaleBefore.getTime()) {
        const reconnectGraceMs = session.rulesVersion === "league-v1" ? 180_000 : 60_000;
        const deadline = new Date(Date.parse(opponentLastSeen) + (session.rulesVersion === "league-v1" ? reconnectGraceMs : 15_000 + reconnectGraceMs));
        const eventsJson = isPrismaDriverEnabled()
          ? (await prisma.battleSession.findUnique({ where: { id: session.id }, select: { eventsJson: true } }))?.eventsJson ?? session.eventsJson
          : session.eventsJson;
        const event = {
          type: "DISCONNECTED",
          userId: session.opponentUserId,
          auditSequence: (JSON.parse(eventsJson || "[]") as unknown[]).length,
          at: now.toISOString(),
          reconnectDeadlineAt: deadline.toISOString(),
        };
        if (isPrismaDriverEnabled()) {
          const latest = await prisma.battleSession.findUnique({ where: { id: session.id }, select: { sequence: true } });
          if (latest) await prisma.battleSession.updateMany({
            where: { id: session.id, sequence: latest.sequence, status: "ACTIVE", opponentDisconnectedAt: null },
            data: {
              sequence: { increment: 1 },
              eventsJson: appendAuditEvent(eventsJson, event),
              opponentDisconnectedAt: now,
              opponentReconnectDeadlineAt: deadline,
              ...(session.rulesVersion === "league-v1" ? { turnDeadlineAt: new Date(deadline.getTime() + 5 * 60_000) } : {}),
              updatedAt: now,
            },
          });
        } else {
          session.sequence += 1;
          session.eventsJson = appendAuditEvent(session.eventsJson, event);
          session.opponentDisconnectedAt = now.toISOString();
          session.opponentReconnectDeadlineAt = deadline.toISOString();
          if (session.rulesVersion === "league-v1") session.turnDeadlineAt = new Date(deadline.getTime() + 5 * 60_000).toISOString();
        }
      }
    }

    const latestSessions: StoredBattleSessionRecord[] = isPrismaDriverEnabled()
      ? (await prisma.battleSession.findMany({ where: { status: "ACTIVE", ...(sessionId ? { id: sessionId } : {}) } })).map(toStoredSession)
      : getEmbeddedStore().battleSessions.filter((session) => session.status === "ACTIVE" && (!sessionId || session.id === sessionId));
    let completed = 0;
    for (const session of latestSessions) {
      const expiredOwner = Boolean(session.reconnectDeadlineAt && Date.parse(session.reconnectDeadlineAt) <= now.getTime());
      const expiredOpponent = Boolean(session.opponentReconnectDeadlineAt && Date.parse(session.opponentReconnectDeadlineAt) <= now.getTime());
      const expiredTurn = Boolean(session.turnDeadlineAt && Date.parse(session.turnDeadlineAt) <= now.getTime());
      if (!expiredOwner && !expiredOpponent && !expiredTurn) continue;
      if (!session.isQuickMatch || !session.opponentUserId) {
        const event = {
          type: "TIMEOUT",
          auditSequence: (JSON.parse(session.eventsJson || "[]") as unknown[]).length,
          cause: "TURN_OR_RECONNECT_DEADLINE_EXPIRED",
          at: now.toISOString(),
        };
        if (isPrismaDriverEnabled()) {
          await prisma.battleSession.updateMany({
            where: { id: session.id, sequence: session.sequence, status: "ACTIVE" },
            data: { sequence: { increment: 1 }, eventsJson: appendAuditEvent(session.eventsJson, event), status: "ABANDONED", turnDeadlineAt: null, updatedAt: now },
          });
        } else {
          session.sequence += 1;
          session.eventsJson = appendAuditEvent(session.eventsJson, event);
          session.status = "ABANDONED";
          session.turnDeadlineAt = null;
          session.updatedAt = now.toISOString();
        }
        continue;
      }
      if (expiredOwner && expiredOpponent) {
        const event = {
          type: "TIMEOUT_DRAW",
          auditSequence: (JSON.parse(session.eventsJson || "[]") as unknown[]).length,
          cause: "BOTH_PLAYERS_DISCONNECTED_5M",
          at: now.toISOString(),
        };
        if (isPrismaDriverEnabled()) {
          await prisma.battleSession.updateMany({
            where: { id: session.id, sequence: session.sequence, status: "ACTIVE" },
            data: {
              sequence: { increment: 1 },
              eventsJson: appendAuditEvent(session.eventsJson, event),
              status: "ABANDONED",
              turnDeadlineAt: null,
              updatedAt: now,
            },
          });
        } else {
          session.sequence += 1;
          session.eventsJson = appendAuditEvent(session.eventsJson, event);
          session.status = "ABANDONED";
          session.turnDeadlineAt = null;
          session.updatedAt = now.toISOString();
        }
        completed += 1;
        continue;
      }
      const state = JSON.parse(session.stateJson) as import("@/client/domain/battle/entity/battle_entity").BattleStateEntity;
      const losingSide = expiredOwner
        ? "PLAYER"
        : expiredOpponent
          ? "BOT"
          : timeoutLosingSide(state);
      const completedState = BattleEngine.surrenderMatch(state, losingSide);
      const event = {
        type: "TIMEOUT",
        cause: expiredTurn ? "TURN_DEADLINE_EXPIRED" : "RECONNECT_GRACE_EXPIRED",
        losingSide,
        at: now.toISOString(),
      };
      const completion = {
        userId: session.userId,
        playerDeckName: session.deckName,
        botDifficulty: "HARD",
        winner: completedState.winner ?? (losingSide === "PLAYER" ? "BOT" : "PLAYER"),
        totalTurns: completedState.turnNumber,
        durationSec: Math.max(1, Math.round((now.getTime() - completedState.startedAtMs) / 1000)),
        playerScore: completedState.botGraveyard.length * 100,
        botScore: completedState.playerGraveyard.length * 100,
        quickMatch: {
          opponentUserId: session.opponentUserId,
          opponentDeckName: session.opponentDeckName ?? "Deck Lawan",
          winner: completedState.winner ?? (losingSide === "PLAYER" ? "BOT" : "PLAYER"),
          playerDeckCardSlugs: JSON.parse(session.playerDeckCardSlugsJson ?? "[]") as string[],
          opponentDeckCardSlugs: JSON.parse(session.opponentDeckCardSlugsJson ?? "[]") as string[],
        },
      } satisfies CreateMatchLogInput;
      const saved = await this.updateBattleSession({
        id: session.id,
        userId: session.userId,
        expectedSequence: session.sequence,
        stateJson: JSON.stringify(completedState),
        eventsJson: appendAuditEvent(session.eventsJson, event),
        status: "COMPLETED",
        rngCounter: session.rngCounter,
        rngDrawsJson: session.rngDrawsJson,
        completion,
      });
      if (saved) completed += 1;
    }
    if (!isPrismaDriverEnabled()) persistEmbeddedStore(getEmbeddedStore());
    return completed;
  }

  public async listMatches(userId: string): Promise<StoredMatchLogRecord[]> {
    if (isPrismaDriverEnabled()) {
      const rows = await prisma.match.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return rows.map((r) => {
        let scores: { playerScore?: number; botScore?: number } = {};
        try {
          scores = JSON.parse(r.battleLogJson) as typeof scores;
        } catch {
          // Keep legacy match records readable when they only contain a summary.
        }
        return {
          id: r.id,
          userId: r.userId,
          playerDeckName: r.deckName,
          botDifficulty: r.botDifficulty,
          winner: r.winner === "BOT" ? "BOT" : "PLAYER",
          totalTurns: r.totalTurns,
          durationSec: r.durationSec,
          playerScore: scores.playerScore ?? 0,
          botScore: scores.botScore ?? 0,
          createdAt: r.createdAt.toISOString(),
        };
      });
    }

    const store = getEmbeddedStore();
    return store.matchLogs.filter((match) => match.userId === userId).slice(0, 30);
  }

}

export const battleRepository: BattleRepository = new BattleRepositoryImpl();

