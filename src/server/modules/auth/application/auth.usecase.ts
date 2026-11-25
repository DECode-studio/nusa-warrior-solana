import "server-only";
import { randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { AppError } from "@/server/shared/errors/app-error";
import {
  type SessionPayload,
  type UserRoleValue,
  createSessionTokens,
} from "@/server/shared/auth/session";
import { authRepository } from "../infrastructure/auth.repository.impl";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isConfigured: boolean;
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface LoginResult {
  user: SessionPayload;
  accessToken: string;
  refreshToken: string;
}

let dummyAdminPasswordHash: Promise<string> | null = null;

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = (process.env.GOOGLE_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const redirectUri = (
    process.env.GOOGLE_REDIRECT_URI ??
    `${baseUrl}/api/v1/auth/google/callback`
  ).trim();

  const isConfigured =
    Boolean(clientId) &&
    Boolean(clientSecret) &&
    !clientId.startsWith("your-google-client-id") &&
    !clientSecret.startsWith("your-google-client-secret");

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured,
  };
}

export function buildGoogleAuthorizationUrlUseCase(state: string): string {
  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    throw AppError.badRequest(
      "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum dikonfigurasi pada file .env server."
    );
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);

  return url.toString();
}

async function exchangeGoogleCodeForProfile(
  code: string
): Promise<GoogleUserInfoResponse> {
  const config = getGoogleOAuthConfig();
  if (!config.isConfigured) {
    throw AppError.badRequest(
      "Konfigurasi Google SSO (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) belum diisi di .env."
    );
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenParams.toString(),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    throw AppError.unauthorized(
      "Gagal menukar authorization code dengan Google OAuth 2.0 Token."
    );
  }

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenData.access_token) {
    throw AppError.unauthorized(
      "Respons token Google tidak menyertakan access_token."
    );
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      cache: "no-store",
    }
  );

  if (!profileRes.ok) {
    throw AppError.unauthorized("Gagal mengambil profil pengguna dari Google.");
  }

  const profile = (await profileRes.json()) as GoogleUserInfoResponse;
  if (!profile.email || !profile.sub || profile.email_verified !== true) {
    throw AppError.unauthorized(
      "Akun Google harus memiliki alamat email terverifikasi untuk masuk."
    );
  }

  return profile;
}

export async function loginWithGoogleCodeUseCase(
  code: string
): Promise<LoginResult> {
  const profile = await exchangeGoogleCodeForProfile(code);

  const displayName =
    profile.name?.trim() ||
    profile.given_name?.trim() ||
    profile.email.split("@")[0] ||
    "Pemain Nusantara";

  const user = await authRepository.upsertGoogleUser({
    googleId: profile.sub,
    email: profile.email,
    name: displayName,
    avatarUrl: profile.picture ?? null,
  });

  if (user.role !== "PLAYER") {
    throw AppError.forbidden(
      "Akun admin tidak dapat masuk menggunakan Google SSO. Gunakan username dan password admin."
    );
  }

  const sessionPayload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isGuest: false,
    hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
  };

  const tokens = await createSessionTokens(sessionPayload);
  return { user: sessionPayload, ...tokens };
}

export async function loginAsGuestUseCase(): Promise<LoginResult> {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const guestName = `Guest #${guestNumber}`;
  const guestId = `usr-guest-${randomUUID()}`;
  const guestEmail = `guest_${randomUUID().replace(/-/g, "").slice(0, 16)}@guest.local`;

  const user = await authRepository.createGuestUser({
    id: guestId,
    name: guestName,
    email: guestEmail,
  });

  // Serverless opportunistic cleanup for inactive guests (> 2 days)
  void cleanupInactiveGuestsUseCase().catch(() => {});

  const sessionPayload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isGuest: true,
    hasClaimedStarterPack: false,
  };

  const tokens = await createSessionTokens(sessionPayload);
  return { user: sessionPayload, ...tokens };
}

export async function cleanupInactiveGuestsUseCase(): Promise<{
  deletedUsers: number;
  deletedDecks: number;
}> {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return authRepository.deleteInactiveGuestAccounts(twoDaysAgo);
}

export async function linkGoogleAccountToGuestUseCase(
  guestUserId: string,
  code: string
): Promise<LoginResult> {
  const profile = await exchangeGoogleCodeForProfile(code);

  const existingGuest = await authRepository.findById(guestUserId);
  if (!existingGuest) {
    throw AppError.notFound("Sesi akun tamu tidak ditemukan atau telah kedaluwarsa.");
  }
  if (!existingGuest.isGuest) {
    throw AppError.badRequest("Akun saat ini bukan akun tamu.");
  }

  // Conflict handling: reject immediately if Google email or googleId already exists
  const userByGoogleId = await authRepository.findByGoogleId(profile.sub);
  if (userByGoogleId && userByGoogleId.id !== guestUserId) {
    throw AppError.conflict(
      "Akun Google ini sudah terdaftar pada pengguna lain. Silakan keluar dan masuk langsung menggunakan akun Google tersebut."
    );
  }

  const userByEmail = await authRepository.findByEmail(profile.email);
  if (userByEmail && userByEmail.id !== guestUserId) {
    throw AppError.conflict(
      "Alamat email Google ini sudah terdaftar pada akun lain. Silakan keluar dan masuk langsung menggunakan akun tersebut."
    );
  }

  const displayName =
    profile.name?.trim() ||
    profile.given_name?.trim() ||
    existingGuest.name;

  const updatedUser = await authRepository.linkGoogleAccount({
    userId: guestUserId,
    googleId: profile.sub,
    email: profile.email,
    name: displayName,
    avatarUrl: profile.picture ?? null,
  });

  const sessionPayload: SessionPayload = {
    userId: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    isGuest: false,
    hasClaimedStarterPack: Boolean(updatedUser.hasClaimedStarterPack),
  };

  const tokens = await createSessionTokens(sessionPayload);
  return { user: sessionPayload, ...tokens };
}

export interface CredentialsLoginInput {
  mode: "ADMIN";
  username?: string;
  password?: string;
}

export async function loginWithCredentialsUseCase(
  input: CredentialsLoginInput
): Promise<LoginResult> {
  const envUsername = process.env.ADMIN_USERNAME?.trim();
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const envPassword = process.env.NODE_ENV === "production"
    ? undefined
    : process.env.ADMIN_PASSWORD;
  if (
    !envUsername ||
    (!envPasswordHash && !envPassword) ||
    (process.env.NODE_ENV === "production" && !envPasswordHash)
  ) {
    throw AppError.internal(
      "Set a unique ADMIN_USERNAME and ADMIN_PASSWORD_HASH in the server environment before enabling admin login."
    );
  }
  const providedUser = (input.username ?? "").trim();
  const providedPass = input.password ?? "";
  const providedUserBytes = Buffer.from(providedUser);
  const expectedUserBytes = Buffer.from(envUsername);
  const usernameMatches = providedUserBytes.length === expectedUserBytes.length &&
    timingSafeEqual(providedUserBytes, expectedUserBytes);
  let passwordMatches = false;
  if (envPasswordHash) {
    dummyAdminPasswordHash ??= bcrypt.hash("invalid-admin-password", 12);
    const dummyHash = await dummyAdminPasswordHash;
    passwordMatches = await bcrypt.compare(
      providedPass,
      usernameMatches ? envPasswordHash : dummyHash
    );
  } else if (envPassword) {
    const providedPasswordBytes = Buffer.from(providedPass);
    const expectedPasswordBytes = Buffer.from(envPassword);
    passwordMatches = providedPasswordBytes.length === expectedPasswordBytes.length &&
      timingSafeEqual(providedPasswordBytes, expectedPasswordBytes);
  }
  if (!providedUser || !providedPass || !usernameMatches || !passwordMatches) {
    throw AppError.unauthorized(
      "Username atau kata sandi tidak sesuai."
    );
  }

  const sessionPayload: SessionPayload = {
    userId: "usr-admin-01",
    email: "admin@nusawarriors.id",
    name: "Admin Nusa Warriors",
    role: "ADMIN",
    isGuest: false,
    hasClaimedStarterPack: true,
  };

  const tokens = await createSessionTokens(sessionPayload);
  return { user: sessionPayload, ...tokens };
}
