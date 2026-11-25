import "server-only";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredUserRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import { lockBattleDataIntegrity } from "@/server/modules/battle/infrastructure/battle-integrity.guard";
import type { UserRoleValue } from "@/server/shared/auth/session";
import type {
  AuthRepository,
  CreateGuestUserInput,
  LinkGoogleUserInput,
  ServerUserEntity,
  UpsertGoogleUserInput,
} from "../domain/auth.repository";

export class AuthRepositoryImpl implements AuthRepository {
  public async findByEmail(email: string): Promise<ServerUserEntity | null> {
    const normalized = email.trim().toLowerCase();
    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { email: normalized },
      });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId ?? null,
        avatarUrl: user.avatarUrl ?? null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        isGuest: user.isGuest,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const found = store.users.find(
      (u) => u.email.toLowerCase() === normalized
    );
    if (!found) return null;
    return {
      id: found.id,
      email: found.email,
      name: found.name,
      googleId: found.googleId ?? null,
      avatarUrl: found.avatarUrl ?? null,
      passwordHash: found.passwordHash,
      role: found.role,
      isGuest: Boolean(found.isGuest),
      hasClaimedStarterPack: Boolean(found.hasClaimedStarterPack),
      lastActiveAt: found.lastActiveAt,
    };
  }

  public async findById(id: string): Promise<ServerUserEntity | null> {
    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId ?? null,
        avatarUrl: user.avatarUrl ?? null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        isGuest: user.isGuest,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const found = store.users.find((u) => u.id === id);
    if (!found) return null;
    return {
      id: found.id,
      email: found.email,
      name: found.name,
      googleId: found.googleId ?? null,
      avatarUrl: found.avatarUrl ?? null,
      passwordHash: found.passwordHash,
      role: found.role,
      isGuest: Boolean(found.isGuest),
      hasClaimedStarterPack: Boolean(found.hasClaimedStarterPack),
      lastActiveAt: found.lastActiveAt,
    };
  }

  public async findByGoogleId(googleId: string): Promise<ServerUserEntity | null> {
    const trimmed = googleId.trim();
    if (!trimmed) return null;

    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { googleId: trimmed },
      });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId ?? null,
        avatarUrl: user.avatarUrl ?? null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        isGuest: user.isGuest,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const found = store.users.find((u) => u.googleId === trimmed);
    if (!found) return null;
    return {
      id: found.id,
      email: found.email,
      name: found.name,
      googleId: found.googleId ?? null,
      avatarUrl: found.avatarUrl ?? null,
      passwordHash: found.passwordHash,
      role: found.role,
      isGuest: Boolean(found.isGuest),
      hasClaimedStarterPack: Boolean(found.hasClaimedStarterPack),
      lastActiveAt: found.lastActiveAt,
    };
  }

  public async createGuestUser(input: CreateGuestUserInput): Promise<ServerUserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.create({
        data: {
          id: input.id,
          email: normalizedEmail,
          name: input.name,
          role: "PLAYER",
          isGuest: true,
          lastActiveAt: new Date(),
          passwordHash: "",
        },
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: null,
        avatarUrl: null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        isGuest: true,
        hasClaimedStarterPack: false,
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const nowIso = new Date().toISOString();
    const created: StoredUserRecord = {
      id: input.id ?? `usr-guest-${Date.now()}`,
      email: normalizedEmail,
      name: input.name,
      role: "PLAYER",
      isGuest: true,
      lastActiveAt: nowIso,
      passwordHash: "",
      hasClaimedStarterPack: false,
      createdAt: nowIso,
    };
    store.users.push(created);
    persistEmbeddedStore(store);

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      googleId: null,
      avatarUrl: null,
      passwordHash: created.passwordHash,
      role: created.role,
      isGuest: true,
      lastActiveAt: created.lastActiveAt,
    };
  }

  public async touchLastActiveAt(userId: string): Promise<void> {
    if (isPrismaDriverEnabled()) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
      return;
    }

    const store = getEmbeddedStore();
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.lastActiveAt = new Date().toISOString();
      persistEmbeddedStore(store);
    }
  }

  public async deleteInactiveGuestAccounts(cutoffDate: Date): Promise<{
    deletedUsers: number;
    deletedDecks: number;
  }> {
    if (isPrismaDriverEnabled()) {
      return prisma.$transaction(async (tx) => {
        await lockBattleDataIntegrity(tx);
        const [inactiveCandidates, activeSessions, waitingEntries, activeLeagueRooms] = await Promise.all([
          tx.user.findMany({
            where: { isGuest: true, lastActiveAt: { lt: cutoffDate } },
            select: { id: true },
          }),
          tx.battleSession.findMany({
            where: { status: "ACTIVE" },
            select: { userId: true, opponentUserId: true },
          }),
          tx.quickMatchQueueEntry.findMany({
            where: { status: "WAITING" },
            select: { userId: true },
          }),
          tx.leagueRoom.findMany({
            where: { status: { in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"] } },
            select: { creatorId: true, participants: { select: { userId: true } } },
          }),
        ]);
        const protectedUserIds = new Set([
          ...activeSessions.flatMap((session) => [session.userId, session.opponentUserId].filter((id): id is string => Boolean(id))),
          ...waitingEntries.map((entry) => entry.userId),
          ...activeLeagueRooms.flatMap((room) => [room.creatorId, ...room.participants.map((participant) => participant.userId)]),
        ]);
        const inactiveGuests = inactiveCandidates.filter((user) => !protectedUserIds.has(user.id));
        if (inactiveGuests.length === 0) {
          return { deletedUsers: 0, deletedDecks: 0 };
        }
        const userIds = inactiveGuests.map((user) => user.id);

        await tx.authSession.deleteMany({
          where: { userId: { in: userIds } },
        });

        await tx.deckCard.deleteMany({
          where: { deck: { userId: { in: userIds } } },
        });

        const deletedDecksResult = await tx.deck.deleteMany({
          where: { userId: { in: userIds } },
        });

        await tx.userCard.deleteMany({
          where: { userId: { in: userIds } },
        });

        await tx.battleSession.deleteMany({
          where: { userId: { in: userIds } },
        });

        const deletedUsersResult = await tx.user.deleteMany({
          where: { id: { in: userIds } },
        });

        return {
          deletedUsers: deletedUsersResult.count,
          deletedDecks: deletedDecksResult.count,
        };
      });
    }

    const store = getEmbeddedStore();
    const cutoffTime = cutoffDate.getTime();
    const inactiveUsers = store.users.filter((u) => {
      if (!u.isGuest) return false;
      if (store.battleSessions.some((session) =>
        session.status === "ACTIVE" && (session.userId === u.id || session.opponentUserId === u.id)
      )) return false;
      if (store.quickMatchQueue.some((entry) => entry.status === "WAITING" && entry.userId === u.id)) return false;
      if (store.leagueRooms.some((room) =>
        ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS"].includes(room.status) &&
        (room.creatorId === u.id || room.participants.some((participant) => participant.userId === u.id))
      )) return false;
      const activeTime = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : new Date(u.createdAt).getTime();
      return activeTime < cutoffTime;
    });

    if (inactiveUsers.length === 0) {
      return { deletedUsers: 0, deletedDecks: 0 };
    }

    const inactiveUserIds = new Set(inactiveUsers.map((u) => u.id));
    const initialDecksCount = store.decks.length;
    store.decks = store.decks.filter((d) => !d.userId || !inactiveUserIds.has(d.userId));
    const deletedDecks = initialDecksCount - store.decks.length;

    store.userCards = store.userCards.filter((uc) => !inactiveUserIds.has(uc.userId));
    store.battleSessions = store.battleSessions.filter((bs) => !inactiveUserIds.has(bs.userId));
    store.users = store.users.filter((u) => !inactiveUserIds.has(u.id));

    persistEmbeddedStore(store);

    return {
      deletedUsers: inactiveUsers.length,
      deletedDecks,
    };
  }

  public async linkGoogleAccount(input: LinkGoogleUserInput): Promise<ServerUserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (isPrismaDriverEnabled()) {
      const updated = await prisma.user.update({
        where: { id: input.userId },
        data: {
          googleId: input.googleId,
          email: normalizedEmail,
          name: input.name,
          avatarUrl: input.avatarUrl,
          isGuest: false,
          lastActiveAt: new Date(),
        },
      });

      await prisma.authSession.updateMany({
        where: { userId: input.userId },
        data: {
          email: normalizedEmail,
          name: input.name,
          isGuest: false,
        },
      });

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        googleId: updated.googleId,
        avatarUrl: updated.avatarUrl,
        passwordHash: updated.passwordHash,
        role: updated.role as UserRoleValue,
        isGuest: false,
        lastActiveAt: updated.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const userIndex = store.users.findIndex((u) => u.id === input.userId);
    if (userIndex < 0) {
      throw new Error(`User ${input.userId} tidak ditemukan`);
    }

    const user = store.users[userIndex];
    user.googleId = input.googleId;
    user.email = normalizedEmail;
    user.name = input.name;
    user.avatarUrl = input.avatarUrl;
    user.isGuest = false;
    user.lastActiveAt = new Date().toISOString();
    persistEmbeddedStore(store);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      googleId: user.googleId,
      avatarUrl: user.avatarUrl,
      passwordHash: user.passwordHash,
      role: user.role,
      isGuest: false,
      hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
      lastActiveAt: user.lastActiveAt,
    };
  }

  public async upsertGoogleUser(
    input: UpsertGoogleUserInput
  ): Promise<ServerUserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (isPrismaDriverEnabled()) {
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      const resolvedRole = input.role ?? (existing ? (existing.role as UserRoleValue) : "PLAYER");
      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: input.name,
          googleId: input.googleId,
          avatarUrl: input.avatarUrl,
          role: resolvedRole,
          lastActiveAt: new Date(),
        },
        create: {
          email: normalizedEmail,
          name: input.name,
          googleId: input.googleId,
          avatarUrl: input.avatarUrl,
          passwordHash: "",
          role: resolvedRole,
          isGuest: false,
          hasClaimedStarterPack: false,
          lastActiveAt: new Date(),
        },
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        isGuest: user.isGuest,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const existingIndex = store.users.findIndex(
      (u) =>
        u.email.toLowerCase() === normalizedEmail ||
        (u.googleId && u.googleId === input.googleId)
    );

    if (existingIndex >= 0) {
      const existing = store.users[existingIndex];
      const updatedRole = input.role ?? existing.role;
      const updated = {
        ...existing,
        email: normalizedEmail,
        name: input.name,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        role: updatedRole,
        lastActiveAt: new Date().toISOString(),
      };
      store.users[existingIndex] = updated;
      persistEmbeddedStore(store);
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        googleId: updated.googleId ?? null,
        avatarUrl: updated.avatarUrl ?? null,
        passwordHash: updated.passwordHash,
        role: updated.role,
        isGuest: Boolean(updated.isGuest),
        hasClaimedStarterPack: Boolean(updated.hasClaimedStarterPack),
        lastActiveAt: updated.lastActiveAt,
      };
    }

    const created = {
      id: `usr-google-${Date.now()}`,
      email: normalizedEmail,
      name: input.name,
      googleId: input.googleId,
      avatarUrl: input.avatarUrl,
      passwordHash: "",
      role: input.role ?? ("PLAYER" as UserRoleValue),
      isGuest: false,
      hasClaimedStarterPack: false,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.users.push(created);
    persistEmbeddedStore(store);

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      googleId: created.googleId,
      avatarUrl: created.avatarUrl,
      passwordHash: created.passwordHash,
      role: created.role,
      isGuest: false,
      hasClaimedStarterPack: false,
      lastActiveAt: created.lastActiveAt,
    };
  }
}

export const authRepository: AuthRepository = new AuthRepositoryImpl();
