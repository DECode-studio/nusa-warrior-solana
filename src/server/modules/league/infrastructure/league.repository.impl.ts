import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma, isPrismaDriverEnabled } from "@/server/shared/db/prisma";
import { AppError } from "@/server/shared/errors/app-error";
import { NUSA_POINT_POLICY, grantNusaPointsPrisma } from "@/server/modules/nusa-points/domain/nusa-point-policy";
import { grantNusaPoints } from "@/server/modules/nusa-points/infrastructure/nusa-point.repository.impl";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredBattleSessionRecord,
  type StoredLeagueRoomRecord,
} from "@/server/shared/db/embedded-store";
import { assertEmbeddedBattleDataUnlocked, lockBattleDataIntegrity } from "@/server/modules/battle/infrastructure/battle-integrity.guard";
import type {
  CreateLeagueRoomRecordInput,
  LeagueRepository,
  LeagueRoomRecord,
} from "../domain/league.repository";

const roomInclude = {
  participants: {
    include: { user: { select: { name: true } } },
    orderBy: { joinedAt: "asc" },
  },
  rounds: {
    include: { matches: { include: { battleSession: { select: { status: true, stateJson: true } } } } },
    orderBy: { roundNumber: "asc" },
  },
} satisfies Prisma.LeagueRoomInclude;

function toEmbeddedRoomRecord(stored: StoredLeagueRoomRecord): LeagueRoomRecord {
  const store = getEmbeddedStore();
  return {
    id: stored.id,
    creatorId: stored.creatorId,
    joinCode: stored.joinCode,
    isPublic: stored.isPublic,
    status: stored.status,
    maxParticipants: stored.maxParticipants,
    registrationClosesAt: new Date(stored.registrationClosesAt),
    startMode: stored.startMode,
    startDelayMinutes: stored.startDelayMinutes,
    scheduledStartAt: stored.scheduledStartAt ? new Date(stored.scheduledStartAt) : null,
    manualStartDeadlineAt: stored.manualStartDeadlineAt ? new Date(stored.manualStartDeadlineAt) : null,
    rulesJson: stored.rulesJson,
    createdAt: new Date(stored.createdAt),
    terminalAt: stored.terminalAt ? new Date(stored.terminalAt) : null,
    participants: stored.participants.map((participant) => ({
      ...participant,
      joinedAt: new Date(participant.joinedAt),
      user: { name: store.users.find((user) => user.id === participant.userId)?.name ?? "Player" },
    })),
    rounds: stored.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => {
        const session = match.battleSessionId
          ? store.battleSessions.find((item) => item.id === match.battleSessionId)
          : undefined;
        return {
          ...match,
          durationDeadlineAt: match.durationDeadlineAt ? new Date(match.durationDeadlineAt) : null,
          battleSession: session ? { status: session.status, stateJson: session.stateJson } : null,
        };
      }),
    })),
  };
}

function createEmbeddedBattleSession(item: import("../domain/league.repository").LeagueBattleSessionInput): StoredBattleSessionRecord {
  const now = new Date();
  return {
    id: item.id,
    createRequestKey: null,
    userId: item.userId,
    opponentUserId: item.opponentUserId,
    deckId: item.deckId,
    deckName: item.deckName,
    opponentDeckId: item.opponentDeckId,
    opponentDeckName: item.opponentDeckName,
    isQuickMatch: true,
    playerDeckCardSlugsJson: JSON.stringify([item.playerStakeCardSlug]),
    opponentDeckCardSlugsJson: JSON.stringify([item.opponentStakeCardSlug]),
    botDifficulty: "HARD",
    rulesVersion: "league-v1",
    sequence: 0,
    status: "ACTIVE",
    stateJson: item.stateJson,
    eventsJson: item.eventsJson,
    lastSeenAt: now.toISOString(),
    opponentLastSeenAt: now.toISOString(),
    disconnectedAt: null,
    opponentDisconnectedAt: null,
    reconnectDeadlineAt: null,
    opponentReconnectDeadlineAt: null,
    turnDeadlineAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
    rngCommitment: item.rngCommitment,
    rngSecret: item.rngSecret,
    rngCounter: item.rngCounter,
    rngDrawsJson: item.rngDrawsJson,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function closeStoredRegistration(room: StoredLeagueRoomRecord, now: Date): void {
  room.status = "REGISTRATION_CLOSED";
  room.scheduledStartAt = room.startMode === "AUTO"
    ? new Date(now.getTime() + room.startDelayMinutes * 60_000).toISOString()
    : null;
  room.manualStartDeadlineAt = room.startMode === "MANUAL"
    ? new Date(now.getTime() + 10 * 60_000).toISOString()
    : null;
  room.updatedAt = now.toISOString();
}

export class LeagueRepositoryImpl implements LeagueRepository {
  public async createRoom(input: CreateLeagueRoomRecordInput): Promise<LeagueRoomRecord> {
    if (!isPrismaDriverEnabled()) {
      const now = new Date().toISOString();
      const stored: StoredLeagueRoomRecord = {
        id: input.id,
        creatorId: input.creatorId,
        joinCode: input.joinCode,
        isPublic: input.isPublic,
        status: "REGISTRATION_OPEN",
        maxParticipants: input.maxParticipants,
        registrationClosesAt: input.registrationClosesAt.toISOString(),
        startMode: input.startMode,
        startDelayMinutes: input.startDelayMinutes,
        scheduledStartAt: input.scheduledStartAt?.toISOString() ?? null,
        manualStartDeadlineAt: input.manualStartDeadlineAt?.toISOString() ?? null,
        rulesJson: input.rulesJson,
        createdAt: now,
        updatedAt: now,
        terminalAt: null,
        participants: [{
          id: randomUUID(), userId: input.creatorId, role: input.creatorRole,
          status: input.creatorRole === "PARTICIPANT" ? "REGISTERED" : "SPECTATING",
          deckId: input.creatorDeckId, stakeCardSlug: input.creatorStakeCardSlug, joinedAt: now, updatedAt: now,
        }],
        rounds: [],
      };
      const store = getEmbeddedStore();
      store.leagueRooms.unshift(stored);
      persistEmbeddedStore(store);
      return toEmbeddedRoomRecord(stored);
    }
    return prisma.leagueRoom.create({
      data: {
        id: input.id,
        creatorId: input.creatorId,
        joinCode: input.joinCode,
        isPublic: input.isPublic,
        maxParticipants: input.maxParticipants,
        registrationClosesAt: input.registrationClosesAt,
        startMode: input.startMode,
        startDelayMinutes: input.startDelayMinutes,
        scheduledStartAt: input.scheduledStartAt,
        manualStartDeadlineAt: input.manualStartDeadlineAt,
        rulesJson: input.rulesJson,
        participants: {
          create: {
            id: randomUUID(),
            userId: input.creatorId,
            role: input.creatorRole,
            status: input.creatorRole === "PARTICIPANT" ? "REGISTERED" : "SPECTATING",
            deckId: input.creatorDeckId,
            stakeCardSlug: input.creatorStakeCardSlug,
          },
        },
      },
      include: roomInclude,
    });
  }

  public async findRoom(id: string, includePrivate: boolean, userId?: string): Promise<LeagueRoomRecord | null> {
    if (!isPrismaDriverEnabled()) {
      const stored = getEmbeddedStore().leagueRooms.find((item) => item.id === id);
      if (!stored || (!stored.isPublic && !includePrivate && stored.creatorId !== userId &&
        !stored.participants.some((participant) => participant.userId === userId))) return null;
      return toEmbeddedRoomRecord(stored);
    }
    const room = await prisma.leagueRoom.findUnique({ where: { id }, include: roomInclude });
    if (!room || (!room.isPublic && !includePrivate &&
      room.creatorId !== userId && !room.participants.some((participant) => participant.userId === userId))) {
      return null;
    }
    return room;
  }

  public async listPublicRooms(): Promise<LeagueRoomRecord[]> {
    if (!isPrismaDriverEnabled()) {
      return getEmbeddedStore().leagueRooms
        .filter((room) => room.isPublic && ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"].includes(room.status))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 50)
        .map(toEmbeddedRoomRecord);
    }
    return prisma.leagueRoom.findMany({
      where: { isPublic: true, status: { in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"] } },
      include: roomInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  public async listRoomsForUser(userId: string): Promise<LeagueRoomRecord[]> {
    if (!isPrismaDriverEnabled()) {
      return getEmbeddedStore().leagueRooms
        .filter((room) => room.creatorId === userId || room.participants.some((participant) => participant.userId === userId))
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, 100)
        .map(toEmbeddedRoomRecord);
    }
    return prisma.leagueRoom.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: roomInclude,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  public async listDueRooms(now: Date): Promise<LeagueRoomRecord[]> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      return store.leagueRooms.filter((room) =>
        (room.status === "REGISTRATION_OPEN" && Date.parse(room.registrationClosesAt) <= now.getTime()) ||
        (room.status === "REGISTRATION_CLOSED" && Boolean(room.scheduledStartAt && Date.parse(room.scheduledStartAt) <= now.getTime())) ||
        (room.status === "REGISTRATION_CLOSED" && Boolean(room.manualStartDeadlineAt && Date.parse(room.manualStartDeadlineAt) <= now.getTime())) ||
        (room.status === "IN_PROGRESS" && room.participants.filter((participant) => participant.role === "PARTICIPANT").length < 2) ||
        (room.status === "IN_PROGRESS" && room.rounds.some((round) => round.matches.some((match) =>
          Boolean(match.battleSessionId && store.battleSessions.some((session) => session.id === match.battleSessionId && session.status === "COMPLETED"))))) ||
        (room.status === "IN_PROGRESS" && room.rounds.some((round) => round.matches.some((match) =>
          match.status === "ACTIVE" && match.durationDeadlineAt !== null && Date.parse(match.durationDeadlineAt) <= now.getTime())))
      ).map(toEmbeddedRoomRecord);
    }
    const integrityRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT room."id"
      FROM "league_rooms" AS room
      LEFT JOIN "league_participants" AS participant
        ON participant."leagueId" = room."id" AND participant."role" = 'PARTICIPANT'
      WHERE room."status" = 'IN_PROGRESS'
      GROUP BY room."id"
      HAVING COUNT(participant."id") < 2
    `);
    return prisma.leagueRoom.findMany({
      where: {
        OR: [
          { status: "REGISTRATION_OPEN", registrationClosesAt: { lte: now } },
          { status: "REGISTRATION_CLOSED", scheduledStartAt: { lte: now } },
          { status: "REGISTRATION_CLOSED", manualStartDeadlineAt: { lte: now } },
          { status: "IN_PROGRESS", rounds: { some: { matches: { some: { battleSession: { is: { status: "COMPLETED" } } } } } } },
          { status: "IN_PROGRESS", rounds: { some: { matches: { some: { status: "ACTIVE", durationDeadlineAt: { lte: now } } } } } },
          ...(integrityRows.length > 0 ? [{ id: { in: integrityRows.map((row) => row.id) } }] : []),
        ],
      },
      include: roomInclude,
      orderBy: { updatedAt: "asc" },
      take: 100,
    });
  }

  public async cancelStalledRoom(leagueId: string, now: Date): Promise<void> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const room = store.leagueRooms.find((item) => item.id === leagueId && item.status === "IN_PROGRESS");
      if (!room) return;
      room.status = "CANCELLED";
      room.terminalAt = now.toISOString();
      room.updatedAt = now.toISOString();
      persistEmbeddedStore(store);
      return;
    }
    await prisma.leagueRoom.updateMany({
      where: { id: leagueId, status: "IN_PROGRESS" },
      data: { status: "CANCELLED", terminalAt: now },
    });
  }

  public async deleteExpiredPublicRooms(input: { cancelledBefore: Date; completedBefore: Date; limit: number }): Promise<number> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const expired = store.leagueRooms
        .filter((room) => room.isPublic && room.terminalAt !== null && (
          (room.status === "CANCELLED" && Date.parse(room.terminalAt) <= input.cancelledBefore.getTime()) ||
          (room.status === "COMPLETED" && Date.parse(room.terminalAt) <= input.completedBefore.getTime())
        ))
        .sort((a, b) => Date.parse(a.terminalAt ?? "") - Date.parse(b.terminalAt ?? ""))
        .slice(0, input.limit);
      if (expired.length === 0) return 0;
      const expiredIds = new Set(expired.map((room) => room.id));
      store.leagueRooms = store.leagueRooms.filter((room) => !expiredIds.has(room.id));
      persistEmbeddedStore(store);
      return expired.length;
    }

    return prisma.$transaction(async (tx) => {
      const expired = await tx.leagueRoom.findMany({
        where: {
          isPublic: true,
          OR: [
            { status: "CANCELLED", terminalAt: { lte: input.cancelledBefore } },
            { status: "COMPLETED", terminalAt: { lte: input.completedBefore } },
          ],
        },
        select: { id: true },
        orderBy: { terminalAt: "asc" },
        take: input.limit,
      });
      if (expired.length === 0) return 0;
      const result = await tx.leagueRoom.deleteMany({
        where: {
          id: { in: expired.map((room) => room.id) },
          isPublic: true,
          OR: [
            { status: "CANCELLED", terminalAt: { lte: input.cancelledBefore } },
            { status: "COMPLETED", terminalAt: { lte: input.completedBefore } },
          ],
        },
      });
      return result.count;
    });
  }

  public async findRoomByCode(joinCode: string): Promise<LeagueRoomRecord | null> {
    if (!isPrismaDriverEnabled()) {
      const stored = getEmbeddedStore().leagueRooms.find((room) => room.joinCode === joinCode.trim().toUpperCase());
      return stored ? toEmbeddedRoomRecord(stored) : null;
    }
    return prisma.leagueRoom.findUnique({ where: { joinCode: joinCode.trim().toUpperCase() }, include: roomInclude });
  }

  public async joinRoom(input: {
    leagueId: string;
    joinCode: string | null;
    userId: string;
    role: "PARTICIPANT" | "SPECTATOR";
    deckId: string | null;
    stakeCardSlug: string | null;
  }): Promise<LeagueRoomRecord> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const stored = store.leagueRooms.find((item) => item.id === input.leagueId);
      if (!stored) throw AppError.notFound("League tidak ditemukan.");
      if (!stored.isPublic && stored.joinCode !== input.joinCode) throw AppError.notFound("Kode league tidak valid.");
      const now = new Date();
      let participant = stored.participants.find((item) => item.userId === input.userId);
      if (participant) {
        if (input.role === "PARTICIPANT" && participant.role !== "PARTICIPANT") {
          if (stored.status !== "REGISTRATION_OPEN" || Date.parse(stored.registrationClosesAt) <= now.getTime()) {
            throw AppError.conflict("Spectator tidak dapat menjadi participant setelah pendaftaran ditutup.");
          }
          const count = stored.participants.filter((item) => item.role === "PARTICIPANT").length;
          if (count >= (stored.maxParticipants ?? 32)) throw AppError.conflict("Kapasitas participant league sudah penuh.");
          participant.role = "PARTICIPANT";
          participant.status = "REGISTERED";
          participant.deckId = input.deckId;
          participant.stakeCardSlug = input.stakeCardSlug;
          participant.updatedAt = now.toISOString();
          if (count + 1 >= (stored.maxParticipants ?? 32)) closeStoredRegistration(stored, now);
        }
      } else {
        if (stored.status !== "REGISTRATION_OPEN" || Date.parse(stored.registrationClosesAt) <= now.getTime()) {
          if (input.role === "PARTICIPANT") throw AppError.conflict("Pendaftaran participant sudah ditutup.");
          if (["COMPLETED", "CANCELLED"].includes(stored.status)) throw AppError.conflict("League sudah berakhir.");
        }
        const count = stored.participants.filter((item) => item.role === "PARTICIPANT").length;
        if (input.role === "PARTICIPANT" && count >= (stored.maxParticipants ?? 32)) throw AppError.conflict("Kapasitas participant league sudah penuh.");
        participant = {
          id: randomUUID(), userId: input.userId, role: input.role,
          status: input.role === "PARTICIPANT" ? "REGISTERED" : "SPECTATING",
          deckId: input.role === "PARTICIPANT" ? input.deckId : null,
          stakeCardSlug: input.role === "PARTICIPANT" ? input.stakeCardSlug : null,
          joinedAt: now.toISOString(), updatedAt: now.toISOString(),
        };
        stored.participants.push(participant);
        if (input.role === "PARTICIPANT" && count + 1 >= (stored.maxParticipants ?? 32)) closeStoredRegistration(stored, now);
      }
      stored.updatedAt = now.toISOString();
      persistEmbeddedStore(store);
      return toEmbeddedRoomRecord(stored);
    }
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "league_rooms" WHERE "id" = ${input.leagueId} FOR UPDATE`);
      const room = await tx.leagueRoom.findUnique({ where: { id: input.leagueId } });
      if (!room) throw AppError.notFound("League tidak ditemukan.");
      if (!room.isPublic && room.joinCode !== input.joinCode) throw AppError.notFound("Kode league tidak valid.");
      const existing = await tx.leagueParticipant.findUnique({
        where: { leagueId_userId: { leagueId: input.leagueId, userId: input.userId } },
      });
      if (existing) {
        if (input.role === "PARTICIPANT" && existing.role !== "PARTICIPANT") {
          if (room.status !== "REGISTRATION_OPEN" || room.registrationClosesAt <= now) {
            throw AppError.conflict("Spectator tidak dapat menjadi participant setelah pendaftaran ditutup.");
          }
          const count = await tx.leagueParticipant.count({ where: { leagueId: input.leagueId, role: "PARTICIPANT" } });
          if (count >= (room.maxParticipants ?? 32)) throw AppError.conflict("Kapasitas participant league sudah penuh.");
          await tx.leagueParticipant.update({
            where: { id: existing.id },
            data: { role: "PARTICIPANT", status: "REGISTERED", deckId: input.deckId, stakeCardSlug: input.stakeCardSlug },
          });
          if (count + 1 >= (room.maxParticipants ?? 32)) {
            await tx.leagueRoom.update({
              where: { id: input.leagueId },
              data: {
                status: "REGISTRATION_CLOSED",
                scheduledStartAt: room.startMode === "AUTO" ? new Date(now.getTime() + room.startDelayMinutes * 60_000) : null,
                manualStartDeadlineAt: room.startMode === "MANUAL" ? new Date(now.getTime() + 10 * 60_000) : null,
              },
            });
          }
          return tx.leagueRoom.findUniqueOrThrow({ where: { id: input.leagueId }, include: roomInclude });
        }
        return tx.leagueRoom.findUniqueOrThrow({ where: { id: input.leagueId }, include: roomInclude });
      }
      if (room.status !== "REGISTRATION_OPEN" || room.registrationClosesAt <= now) {
        if (input.role === "PARTICIPANT") throw AppError.conflict("Pendaftaran participant sudah ditutup.");
        if (room.status === "COMPLETED" || room.status === "CANCELLED") throw AppError.conflict("League sudah berakhir.");
      }
      if (input.role === "PARTICIPANT" && room.maxParticipants !== null) {
        const count = await tx.leagueParticipant.count({ where: { leagueId: input.leagueId, role: "PARTICIPANT" } });
        if (count >= room.maxParticipants) throw AppError.conflict("Kapasitas participant league sudah penuh.");
      }
      if (input.role === "PARTICIPANT" && room.maxParticipants === null) {
        const count = await tx.leagueParticipant.count({ where: { leagueId: input.leagueId, role: "PARTICIPANT" } });
        if (count >= 32) throw AppError.conflict("League sudah mencapai batas sistem 32 participant.");
      }
      await tx.leagueParticipant.create({
        data: {
          id: randomUUID(),
          leagueId: input.leagueId,
          userId: input.userId,
          role: input.role,
          status: input.role === "PARTICIPANT" ? "REGISTERED" : "SPECTATING",
          deckId: input.role === "PARTICIPANT" ? input.deckId : null,
          stakeCardSlug: input.role === "PARTICIPANT" ? input.stakeCardSlug : null,
        },
      });
      if (input.role === "PARTICIPANT") {
        const participantCount = await tx.leagueParticipant.count({ where: { leagueId: input.leagueId, role: "PARTICIPANT" } });
        const capacity = room.maxParticipants ?? 32;
        if (participantCount >= capacity) {
          await tx.leagueRoom.update({
            where: { id: input.leagueId },
            data: {
              status: "REGISTRATION_CLOSED",
              scheduledStartAt: room.startMode === "AUTO"
                ? new Date(now.getTime() + room.startDelayMinutes * 60_000)
                : null,
              manualStartDeadlineAt: room.startMode === "MANUAL"
                ? new Date(now.getTime() + 10 * 60_000)
                : null,
            },
          });
        }
      }
      return tx.leagueRoom.findUniqueOrThrow({ where: { id: input.leagueId }, include: roomInclude });
    });
  }

  public async closeRegistration(leagueId: string, userId: string, now: Date): Promise<LeagueRoomRecord> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const room = store.leagueRooms.find((item) => item.id === leagueId);
      if (!room) throw AppError.notFound("League tidak ditemukan.");
      if (room.creatorId !== userId) throw AppError.forbidden("Hanya creator yang dapat menutup pendaftaran.");
      if (room.status !== "REGISTRATION_OPEN") throw AppError.conflict("Pendaftaran league sudah ditutup.");
      closeStoredRegistration(room, now);
      persistEmbeddedStore(store);
      return toEmbeddedRoomRecord(room);
    }
    return prisma.$transaction(async (tx) => {
      const room = await tx.leagueRoom.findUnique({ where: { id: leagueId } });
      if (!room) throw AppError.notFound("League tidak ditemukan.");
      if (room.creatorId !== userId) throw AppError.forbidden("Hanya creator yang dapat menutup pendaftaran.");
      if (room.status !== "REGISTRATION_OPEN") throw AppError.conflict("Pendaftaran league sudah ditutup.");
      await tx.leagueRoom.update({
        where: { id: leagueId },
        data: {
          status: "REGISTRATION_CLOSED",
          scheduledStartAt: room.startMode === "AUTO"
            ? new Date(now.getTime() + room.startDelayMinutes * 60_000)
            : null,
          manualStartDeadlineAt: room.startMode === "MANUAL"
            ? new Date(now.getTime() + 10 * 60_000)
            : null,
        },
      });
      return tx.leagueRoom.findUniqueOrThrow({ where: { id: leagueId }, include: roomInclude });
    });
  }

  public async cancelRoom(leagueId: string, userId: string): Promise<void> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const room = store.leagueRooms.find((item) => item.id === leagueId && item.creatorId === userId &&
        ["REGISTRATION_OPEN", "REGISTRATION_CLOSED"].includes(item.status));
      if (!room) throw AppError.conflict("League tidak dapat dibatalkan.");
      room.status = "CANCELLED";
      room.terminalAt = new Date().toISOString();
      room.updatedAt = room.terminalAt;
      persistEmbeddedStore(store);
      return;
    }
    const changed = await prisma.leagueRoom.updateMany({
      where: { id: leagueId, creatorId: userId, status: { in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED"] } },
      data: { status: "CANCELLED", terminalAt: new Date() },
    });
    if (changed.count === 0) throw AppError.conflict("League tidak dapat dibatalkan.");
  }

  public async startRound(input: { leagueId: string; roundNumber: number; matches: import("../domain/league.repository").LeagueRoundMatchInput[] }): Promise<LeagueRoomRecord> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const room = store.leagueRooms.find((item) => item.id === input.leagueId);
      if (!room) throw AppError.notFound("League tidak ditemukan.");
      if (room.rounds.some((round) => round.roundNumber === input.roundNumber)) return toEmbeddedRoomRecord(room);
      if (room.status !== "REGISTRATION_CLOSED" && room.status !== "IN_PROGRESS") throw AppError.conflict("Pendaftaran harus ditutup sebelum liga dimulai.");
      if (room.participants.filter((item) => item.role === "PARTICIPANT").length < 2) {
        room.status = "CANCELLED";
        room.terminalAt = new Date().toISOString();
        persistEmbeddedStore(store);
        throw AppError.conflict("League dibatalkan karena kurang dari dua participant.");
      }
      const playerIds = [...new Set(input.matches.flatMap((match) => [match.playerOneId, ...(match.playerTwoId ? [match.playerTwoId] : [])]))];
      assertEmbeddedBattleDataUnlocked(playerIds);
      const now = new Date();
      const round = {
        id: randomUUID(), roundNumber: input.roundNumber, status: "ACTIVE", createdAt: now.toISOString(),
        matches: input.matches.map((match) => {
          const session = match.session ? createEmbeddedBattleSession(match.session) : null;
          if (session) store.battleSessions.unshift(session);
          return {
            id: match.id,
            playerOneId: match.playerOneId,
            playerTwoId: match.playerTwoId,
            winnerId: match.winnerId,
            status: match.winnerId ? "COMPLETED" : "ACTIVE",
            battleSessionId: session?.id ?? null,
            durationDeadlineAt: match.durationMinutes === null ? null : new Date(now.getTime() + match.durationMinutes * 60_000).toISOString(),
            createdAt: now.toISOString(),
            completedAt: match.winnerId ? now.toISOString() : null,
          };
        }),
      };
      room.rounds.push(round);
      room.status = "IN_PROGRESS";
      room.participants.filter((item) => item.role === "PARTICIPANT").forEach((item) => { item.status = "PLAYING"; });
      room.updatedAt = now.toISOString();
      persistEmbeddedStore(store);
      return toEmbeddedRoomRecord(room);
    }
    return prisma.$transaction(async (tx) => {
      await lockBattleDataIntegrity(tx);
      const room = await tx.leagueRoom.findUnique({ where: { id: input.leagueId } });
      if (!room) throw AppError.notFound("League tidak ditemukan.");
      const existingRound = await tx.leagueRound.findUnique({
        where: { leagueId_roundNumber: { leagueId: input.leagueId, roundNumber: input.roundNumber } },
        select: { id: true },
      });
      if (existingRound) return tx.leagueRoom.findUniqueOrThrow({ where: { id: input.leagueId }, include: roomInclude });
      if (room.status !== "REGISTRATION_CLOSED" && room.status !== "IN_PROGRESS") {
        throw AppError.conflict("Pendaftaran harus ditutup sebelum liga dimulai.");
      }
      const participantCount = await tx.leagueParticipant.count({ where: { leagueId: input.leagueId, role: "PARTICIPANT" } });
      if (participantCount < 2) {
        await tx.leagueRoom.update({ where: { id: input.leagueId }, data: { status: "CANCELLED", terminalAt: new Date() } });
        throw AppError.conflict("League dibatalkan karena kurang dari dua participant.");
      }
      const playerIds = [...new Set(input.matches.flatMap((match) => [match.playerOneId, ...(match.playerTwoId ? [match.playerTwoId] : [])]))];
      const conflictingSession = await tx.battleSession.findFirst({
        where: { status: "ACTIVE", OR: [{ userId: { in: playerIds } }, { opponentUserId: { in: playerIds } }] },
        select: { id: true },
      });
      const queuedPlayer = await tx.quickMatchQueueEntry.findFirst({
        where: { status: "WAITING", userId: { in: playerIds } },
        select: { id: true },
      });
      if (conflictingSession || queuedPlayer) throw AppError.conflict("Participant memiliki battle aktif atau quick match yang sedang dicari.");
      const claimedRoom = await tx.leagueRoom.updateMany({
        where: { id: input.leagueId, status: room.status },
        data: { status: "IN_PROGRESS" },
      });
      if (claimedRoom.count !== 1) throw AppError.conflict("Status league berubah sebelum pertandingan dimulai.");
      const round = await tx.leagueRound.create({
        data: { id: randomUUID(), leagueId: input.leagueId, roundNumber: input.roundNumber, status: "ACTIVE" },
      });
      for (const match of input.matches) {
        let battleSessionId: string | null = null;
        const createdAt = new Date();
        if (match.session) {
          const item = match.session;
          const now = createdAt;
          const session = await tx.battleSession.create({
            data: {
              id: item.id,
              userId: item.userId,
              opponentUserId: item.opponentUserId,
              deckId: item.deckId,
              deckName: item.deckName,
              opponentDeckId: item.opponentDeckId,
              opponentDeckName: item.opponentDeckName,
              isQuickMatch: true,
              playerDeckCardSlugsJson: JSON.stringify([item.playerStakeCardSlug]),
              opponentDeckCardSlugsJson: JSON.stringify([item.opponentStakeCardSlug]),
              botDifficulty: "HARD",
              rulesVersion: "league-v1",
              stateJson: item.stateJson,
              eventsJson: item.eventsJson,
              rngCommitment: item.rngCommitment,
              rngSecret: item.rngSecret,
              rngCounter: item.rngCounter,
              rngDrawsJson: item.rngDrawsJson,
              lastSeenAt: now,
              opponentLastSeenAt: now,
              turnDeadlineAt: new Date(now.getTime() + 5 * 60_000),
              createdAt: now,
              updatedAt: now,
            },
          });
          battleSessionId = session.id;
        }
        await tx.leagueMatch.create({
          data: {
            id: match.id,
            roundId: round.id,
            playerOneId: match.playerOneId,
            playerTwoId: match.playerTwoId,
            winnerId: match.winnerId,
            status: match.winnerId ? "COMPLETED" : "ACTIVE",
            battleSessionId,
            durationDeadlineAt: match.durationMinutes === null ? null : new Date(createdAt.getTime() + match.durationMinutes * 60_000),
            completedAt: match.winnerId ? new Date() : null,
          },
        });
      }
      await tx.leagueParticipant.updateMany({
        where: { leagueId: input.leagueId, role: "PARTICIPANT" },
        data: { status: "PLAYING" },
      });
      return tx.leagueRoom.findUniqueOrThrow({ where: { id: input.leagueId }, include: roomInclude });
    });
  }

  public async resolveRound(input: {
    leagueId: string;
    roundNumber: number;
    matches: Array<{ matchId: string; winnerId: string }>;
    nextRound?: { roundNumber: number; matches: import("../domain/league.repository").LeagueRoundMatchInput[] };
  }): Promise<void> {
    if (!isPrismaDriverEnabled()) {
      const store = getEmbeddedStore();
      const room = store.leagueRooms.find((item) => item.id === input.leagueId);
      if (!room) throw AppError.notFound("League tidak ditemukan.");
      const round = room.rounds.find((item) => item.roundNumber === input.roundNumber);
      if (!round) throw AppError.notFound("Ronde league tidak ditemukan.");
      if (round.status === "COMPLETED") return;
      for (const result of input.matches) {
        const match = round.matches.find((item) => item.id === result.matchId);
        if (!match) throw AppError.notFound("Duel league tidak ditemukan.");
        match.winnerId = result.winnerId;
        match.status = "COMPLETED";
        match.completedAt = new Date().toISOString();
        room.participants.filter((item) => item.role === "PARTICIPANT" &&
          [match.playerOneId, match.playerTwoId].includes(item.userId) && item.userId !== result.winnerId)
          .forEach((item) => { item.status = "ELIMINATED"; });
      }
      round.status = "COMPLETED";
      if (input.nextRound) {
        const now = new Date();
        const next = {
          id: randomUUID(), roundNumber: input.nextRound.roundNumber, status: "ACTIVE", createdAt: now.toISOString(),
          matches: input.nextRound.matches.map((match) => {
            const session = match.session ? createEmbeddedBattleSession(match.session) : null;
            if (session) store.battleSessions.unshift(session);
            return {
              id: match.id,
              playerOneId: match.playerOneId,
              playerTwoId: match.playerTwoId,
              winnerId: match.winnerId,
              status: match.winnerId ? "COMPLETED" : "ACTIVE",
              battleSessionId: session?.id ?? null,
              durationDeadlineAt: match.durationMinutes === null ? null : new Date(now.getTime() + match.durationMinutes * 60_000).toISOString(),
              createdAt: now.toISOString(),
              completedAt: match.winnerId ? now.toISOString() : null,
            };
          }),
        };
        room.rounds.push(next);
      } else {
        const final = input.matches[0];
        if (!final) throw AppError.conflict("Tidak ada pemenang untuk menyelesaikan league.");
        const eligiblePlayers = room.participants.filter((participant) =>
          participant.role === "PARTICIPANT" &&
          store.users.some((user) => user.id === participant.userId)
        );
        if (eligiblePlayers.length >= NUSA_POINT_POLICY.leagueChampionMinimumPlayers &&
          eligiblePlayers.some((participant) => participant.userId === final.winnerId)) {
          await grantNusaPoints({
            userId: final.winnerId,
            amount: NUSA_POINT_POLICY.leagueChampionBonus,
            source: "LEAGUE_CHAMPION",
            sourceId: input.leagueId,
          });
        }
        room.status = "COMPLETED";
        room.terminalAt = new Date().toISOString();
        room.participants.filter((item) => item.role === "PARTICIPANT" && item.userId !== final.winnerId)
          .forEach((item) => { item.status = "ELIMINATED"; });
        room.participants.filter((item) => item.userId === final.winnerId)
          .forEach((item) => { item.status = "CHAMPION"; });
      }
      room.updatedAt = new Date().toISOString();
      persistEmbeddedStore(store);
      return;
    }
    await prisma.$transaction(async (tx) => {
      const round = await tx.leagueRound.findUnique({
        where: { leagueId_roundNumber: { leagueId: input.leagueId, roundNumber: input.roundNumber } },
      });
      if (!round) throw AppError.notFound("Ronde league tidak ditemukan.");
      if (round.status === "COMPLETED") return;
      const claimedRound = await tx.leagueRound.updateMany({
        where: { id: round.id, status: "ACTIVE" },
        data: { status: "COMPLETED" },
      });
      if (claimedRound.count !== 1) return;
      const roundMatches = await tx.leagueMatch.findMany({ where: { roundId: round.id } });
      for (const result of input.matches) {
        const match = roundMatches.find((item) => item.id === result.matchId);
        if (!match) throw AppError.notFound("Duel league tidak ditemukan.");
        await tx.leagueMatch.updateMany({
          where: { id: result.matchId, roundId: round.id, status: "ACTIVE" },
          data: { winnerId: result.winnerId, status: "COMPLETED", completedAt: new Date() },
        });
        const losers = [match.playerOneId, match.playerTwoId].filter(
          (userId): userId is string => userId !== null && userId !== result.winnerId,
        );
        if (losers.length > 0) {
          await tx.leagueParticipant.updateMany({
            where: { leagueId: input.leagueId, userId: { in: losers }, role: "PARTICIPANT" },
            data: { status: "ELIMINATED" },
          });
        }
      }
      if (input.nextRound) {
        const next = await tx.leagueRound.create({
          data: { id: randomUUID(), leagueId: input.leagueId, roundNumber: input.nextRound.roundNumber, status: "ACTIVE" },
        });
        for (const match of input.nextRound.matches) {
          let battleSessionId: string | null = null;
          const createdAt = new Date();
          if (match.session) {
            const item = match.session;
            const now = createdAt;
            const session = await tx.battleSession.create({
              data: {
                id: item.id,
                userId: item.userId,
                opponentUserId: item.opponentUserId,
                deckId: item.deckId,
                deckName: item.deckName,
                opponentDeckId: item.opponentDeckId,
                opponentDeckName: item.opponentDeckName,
                isQuickMatch: true,
                playerDeckCardSlugsJson: JSON.stringify([item.playerStakeCardSlug]),
                opponentDeckCardSlugsJson: JSON.stringify([item.opponentStakeCardSlug]),
                botDifficulty: "HARD",
                rulesVersion: "league-v1",
                stateJson: item.stateJson,
                eventsJson: item.eventsJson,
                rngCommitment: item.rngCommitment,
                rngSecret: item.rngSecret,
                rngCounter: item.rngCounter,
                rngDrawsJson: item.rngDrawsJson,
                lastSeenAt: now,
                opponentLastSeenAt: now,
                turnDeadlineAt: new Date(now.getTime() + 5 * 60_000),
                createdAt: now,
                updatedAt: now,
              },
            });
            battleSessionId = session.id;
          }
          await tx.leagueMatch.create({
            data: {
              id: match.id,
              roundId: next.id,
              playerOneId: match.playerOneId,
              playerTwoId: match.playerTwoId,
              winnerId: match.winnerId,
              status: match.winnerId ? "COMPLETED" : "ACTIVE",
              battleSessionId,
              durationDeadlineAt: match.durationMinutes === null ? null : new Date(createdAt.getTime() + match.durationMinutes * 60_000),
              completedAt: match.winnerId ? new Date() : null,
            },
          });
        }
      } else {
        const final = input.matches[0];
        if (!final) throw AppError.conflict("Tidak ada pemenang untuk menyelesaikan league.");
        const eligiblePlayers = await tx.leagueParticipant.findMany({
          where: { leagueId: input.leagueId, role: "PARTICIPANT", user: { isGuest: false } },
          select: { userId: true },
        });
        if (eligiblePlayers.length >= NUSA_POINT_POLICY.leagueChampionMinimumPlayers &&
          eligiblePlayers.some((participant) => participant.userId === final.winnerId)) {
          await grantNusaPointsPrisma(tx, {
            userId: final.winnerId,
            amount: NUSA_POINT_POLICY.leagueChampionBonus,
            source: "LEAGUE_CHAMPION",
            sourceId: input.leagueId,
          });
        }
        await tx.leagueRoom.update({ where: { id: input.leagueId }, data: { status: "COMPLETED", terminalAt: new Date() } });
        await tx.leagueParticipant.updateMany({
          where: { leagueId: input.leagueId, userId: { not: final.winnerId }, role: "PARTICIPANT" },
          data: { status: "ELIMINATED" },
        });
        await tx.leagueParticipant.updateMany({
          where: { leagueId: input.leagueId, userId: final.winnerId },
          data: { status: "CHAMPION" },
        });
      }
    });
  }
}

export const leagueRepository: LeagueRepository = new LeagueRepositoryImpl();
