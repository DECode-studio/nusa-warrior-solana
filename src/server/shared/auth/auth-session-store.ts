import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import type { SessionPayload, UserRoleValue } from "./session";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export interface StoredAuthSession extends SessionPayload {
  id: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

const memoryStore = globalThis as typeof globalThis & {
  __nusantaraAuthSessions?: Map<string, StoredAuthSession>;
};

function sessions(): Map<string, StoredAuthSession> {
  return (memoryStore.__nusantaraAuthSessions ??= new Map());
}

function usePersistentSessionStore(): boolean {
  return process.env.NODE_ENV === "production" && isPrismaDriverEnabled();
}

function hashToken(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function newRefreshToken(id: string): { token: string; hash: string } {
  const secret = randomBytes(32).toString("base64url");
  return { token: `${id}.${secret}`, hash: hashToken(secret) };
}

export function parseRefreshToken(token: string): { id: string; secret: string } | null {
  const separator = token.indexOf(".");
  if (separator < 1 || separator === token.length - 1) return null;
  return { id: token.slice(0, separator), secret: token.slice(separator + 1) };
}

export async function createAuthSession(
  user: SessionPayload
): Promise<{ sessionId: string; refreshToken: string }> {
  const id = randomUUID();
  const refresh = newRefreshToken(id);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + REFRESH_TTL_MS);
  const data = {
    id,
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    isGuest: Boolean(user.isGuest),
    refreshTokenHash: refresh.hash,
    expiresAt,
    createdAt,
    revokedAt: null,
  };

  if (usePersistentSessionStore()) {
    await prisma.authSession.create({ data });
  } else {
    const store = sessions();
    if (store.size % 100 === 0) {
      const now = Date.now();
      for (const [sessionId, session] of store) {
        if (session.expiresAt.getTime() <= now || session.revokedAt) store.delete(sessionId);
      }
    }
    store.set(id, data);
  }
  return { sessionId: id, refreshToken: refresh.token };
}

export async function getActiveAuthSession(
  id: string
): Promise<StoredAuthSession | null> {
  const session = usePersistentSessionStore()
    ? await prisma.authSession.findUnique({ where: { id } })
    : sessions().get(id) ?? null;
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return {
    id: session.id,
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role as UserRoleValue,
    isGuest: Boolean((session as { isGuest?: boolean }).isGuest),
    refreshTokenHash: session.refreshTokenHash,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    revokedAt: session.revokedAt,
  };
}

export async function rotateAuthSession(
  token: string
): Promise<{ session: StoredAuthSession; refreshToken: string } | null> {
  const parsed = parseRefreshToken(token);
  if (!parsed) return null;
  const session = await getActiveAuthSession(parsed.id);
  if (!session || session.refreshTokenHash !== hashToken(parsed.secret)) {
    return null;
  }

  const refresh = newRefreshToken(session.id);
  const expiresAt = new Date(Math.min(
    Date.now() + REFRESH_TTL_MS,
    session.createdAt.getTime() + MAX_SESSION_TTL_MS
  ));
  if (expiresAt.getTime() <= Date.now()) return null;
  if (usePersistentSessionStore()) {
    const result = await prisma.authSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { refreshTokenHash: refresh.hash, expiresAt },
    });
    if (result.count !== 1) return null;
  } else {
    const current = sessions().get(session.id);
    if (!current || current.refreshTokenHash !== session.refreshTokenHash || current.revokedAt) {
      return null;
    }
    sessions().set(session.id, { ...current, refreshTokenHash: refresh.hash, expiresAt });
  }

  return {
    session: { ...session, refreshTokenHash: refresh.hash, expiresAt },
    refreshToken: refresh.token,
  };
}

export async function revokeAuthSession(id: string): Promise<void> {
  if (usePersistentSessionStore()) {
    await prisma.authSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else {
    const session = sessions().get(id);
    if (session) sessions().set(id, { ...session, revokedAt: new Date() });
  }
}

export async function revokeAuthSessionsForUser(userId: string): Promise<void> {
  if (usePersistentSessionStore()) {
    await prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return;
  }
  for (const [id, session] of sessions()) {
    if (session.userId === userId && !session.revokedAt) {
      sessions().set(id, { ...session, revokedAt: new Date() });
    }
  }
}

export async function pruneExpiredAuthSessions(now = new Date()): Promise<number> {
  const revokedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (usePersistentSessionStore()) {
    const result = await prisma.authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { revokedAt: { lt: revokedBefore } },
        ],
      },
    });
    return result.count;
  }
  let deleted = 0;
  for (const [id, session] of sessions()) {
    if (
      session.expiresAt < now ||
      (session.revokedAt && session.revokedAt < revokedBefore)
    ) {
      sessions().delete(id);
      deleted += 1;
    }
  }
  return deleted;
}
