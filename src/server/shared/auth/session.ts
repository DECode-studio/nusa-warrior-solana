import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  createAuthSession,
  getActiveAuthSession,
  parseRefreshToken,
  revokeAuthSession,
  rotateAuthSession,
} from "./auth-session-store";

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-nusantara_session"
    : "nusantara_session";
export const REFRESH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-nusantara_refresh"
    : "nusantara_refresh";
export const OAUTH_STATE_COOKIE_NAME = "nusantara_google_oauth_state";
export const OAUTH_LOCALE_COOKIE_NAME = "nusantara_google_oauth_locale";
export const OAUTH_LINK_USER_COOKIE_NAME = "nusantara_google_oauth_link_user";
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export type UserRoleValue = "PLAYER" | "CURATOR" | "ADMIN";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRoleValue;
  isGuest?: boolean;
  hasClaimedStarterPack?: boolean;
  avatarUrl?: string | null;
  nusaPoints?: number;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (
    !secret ||
    secret.length < 32 ||
    /nusantara-card-super-secret|change-me|replace-with|generate-a-unique/i.test(secret)
  ) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

async function signSessionToken(
  sessionId: string
): Promise<string> {
  return new SignJWT({
    sessionId,
    tokenType: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("nusantara-card")
    .setAudience("nusantara-card")
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function createSessionTokens(payload: SessionPayload): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const session = await createAuthSession(payload);
  return {
    accessToken: await signSessionToken(session.sessionId),
    refreshToken: session.refreshToken,
  };
}

export async function refreshSessionTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const rotated = await rotateAuthSession(refreshToken);
  if (!rotated) return null;
  return {
    accessToken: await signSessionToken(rotated.session.id),
    refreshToken: rotated.refreshToken,
  };
}

export async function verifySessionToken(token: string): Promise<{ sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      issuer: "nusantara-card",
      audience: "nusantara-card",
    });
    if (typeof payload.sessionId === "string" && payload.tokenType === "access") {
      return { sessionId: payload.sessionId };
    }
    return null;
  } catch {
    return null;
  }
}

const userLastTouchMap = new Map<string, number>();
const TOUCH_THROTTLE_MS = 15 * 60 * 1000; // 15 mins

export async function touchSessionUserActivity(userId: string): Promise<void> {
  const now = Date.now();
  const last = userLastTouchMap.get(userId) ?? 0;
  if (now - last < TOUCH_THROTTLE_MS) return;
  userLastTouchMap.set(userId, now);
  try {
    const { authRepository } = await import("@/server/modules/auth/infrastructure/auth.repository.impl");
    await authRepository.touchLastActiveAt(userId);
  } catch {
    // Ignore background touch failures
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  const verified = await verifySessionToken(token);
  if (!verified) return null;
  const session = await getActiveAuthSession(verified.sessionId);
  if (!session) return null;

  if (session.isGuest) {
    void touchSessionUserActivity(session.userId);
  }

  let hasClaimedStarterPack = Boolean(session.hasClaimedStarterPack);
  let avatarUrl: string | null = null;
  try {
    const { AuthRepositoryImpl } = await import(
      "@/server/modules/auth/infrastructure/auth.repository.impl"
    );
    const authRepo = new AuthRepositoryImpl();
    const liveUser = await authRepo.findById(session.userId);
    if (liveUser) {
      hasClaimedStarterPack = Boolean(liveUser.hasClaimedStarterPack);
      avatarUrl = liveUser.avatarUrl ?? null;
    }
  } catch {
    // Keep session cached fallback
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    isGuest: session.isGuest,
    hasClaimedStarterPack,
    avatarUrl,
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const verified = token ? await verifySessionToken(token) : null;
  const refresh = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  const refreshSession = refresh ? parseRefreshToken(refresh) : null;
  const sessionId = verified?.sessionId ?? refreshSession?.id;
  if (sessionId) await revokeAuthSession(sessionId);
}

export async function revokeSessionById(sessionId: string): Promise<void> {
  await revokeAuthSession(sessionId);
}

export async function rotateRefreshToken(refreshToken: string) {
  return refreshSessionTokens(refreshToken);
}

