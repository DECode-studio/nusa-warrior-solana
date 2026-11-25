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
export const SOLANA_NONCE_COOKIE_NAME = "nusantara_solana_nonce";
export const SOLANA_PENDING_NICKNAME_COOKIE_NAME = "nusantara_solana_pending_nickname";
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SOLANA_NONCE_TTL_SECONDS = 5 * 60;
export const SOLANA_PENDING_NICKNAME_TTL_SECONDS = 10 * 60;

export type UserRoleValue = "PLAYER" | "CURATOR" | "ADMIN";

export interface SessionPayload {
  userId: string;
  walletAddress: string | null;
  name: string;
  role: UserRoleValue;
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

export async function signSolanaNonceToken(payload: {
  nonce: string;
  walletAddress: string;
  message: string;
}): Promise<string> {
  return new SignJWT({
    nonce: payload.nonce,
    walletAddress: payload.walletAddress,
    message: payload.message,
    tokenType: "solana_nonce",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("nusantara-card")
    .setAudience("nusantara-card")
    .setIssuedAt()
    .setExpirationTime(`${SOLANA_NONCE_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySolanaNonceToken(token: string): Promise<{
  nonce: string;
  walletAddress: string;
  message: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      issuer: "nusantara-card",
      audience: "nusantara-card",
    });
    if (
      payload.tokenType === "solana_nonce" &&
      typeof payload.nonce === "string" &&
      typeof payload.walletAddress === "string" &&
      typeof payload.message === "string"
    ) {
      return {
        nonce: payload.nonce,
        walletAddress: payload.walletAddress,
        message: payload.message,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function signSolanaPendingNicknameToken(
  walletAddress: string
): Promise<string> {
  return new SignJWT({
    walletAddress,
    tokenType: "solana_pending_nickname",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("nusantara-card")
    .setAudience("nusantara-card")
    .setIssuedAt()
    .setExpirationTime(`${SOLANA_PENDING_NICKNAME_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySolanaPendingNicknameToken(
  token: string
): Promise<{ walletAddress: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      issuer: "nusantara-card",
      audience: "nusantara-card",
    });
    if (
      payload.tokenType === "solana_pending_nickname" &&
      typeof payload.walletAddress === "string"
    ) {
      return { walletAddress: payload.walletAddress };
    }
    return null;
  } catch {
    return null;
  }
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

  let hasClaimedStarterPack = Boolean(session.hasClaimedStarterPack);
  let avatarUrl: string | null = null;
  let walletAddress: string | null = session.walletAddress ?? null;
  try {
    const { AuthRepositoryImpl } = await import(
      "@/server/modules/auth/infrastructure/auth.repository.impl"
    );
    const authRepo = new AuthRepositoryImpl();
    const liveUser = await authRepo.findById(session.userId);
    if (liveUser) {
      hasClaimedStarterPack = Boolean(liveUser.hasClaimedStarterPack);
      avatarUrl = liveUser.avatarUrl ?? null;
      walletAddress = liveUser.walletAddress ?? walletAddress;
    }
  } catch {
    // Keep session cached fallback
  }

  return {
    userId: session.userId,
    walletAddress,
    name: session.name,
    role: session.role,
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
