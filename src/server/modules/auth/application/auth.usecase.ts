import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import bcrypt from "bcryptjs";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { AppError } from "@/server/shared/errors/app-error";
import {
  type SessionPayload,
  createSessionTokens,
} from "@/server/shared/auth/session";
import { authRepository } from "../infrastructure/auth.repository.impl";

export interface LoginResult {
  user: SessionPayload;
  accessToken: string;
  refreshToken: string;
}

export type SolanaVerifyResult =
  | {
      status: "AUTHENTICATED";
      user: SessionPayload;
      accessToken: string;
      refreshToken: string;
    }
  | {
      status: "NEEDS_NICKNAME";
      walletAddress: string;
    };

let dummyAdminPasswordHash: Promise<string> | null = null;

export function normalizeSolanaWalletAddress(walletAddress: string): string {
  try {
    const pubkey = new PublicKey(walletAddress.trim());
    return pubkey.toBase58();
  } catch {
    throw AppError.badRequest("Alamat dompet Solana tidak valid.");
  }
}

export function createSolanaChallengeUseCase(walletAddress: string): {
  walletAddress: string;
  nonce: string;
  message: string;
} {
  const normalizedAddress = normalizeSolanaWalletAddress(walletAddress);
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const message = [
    "Sign in to Nusa Warriors (Solana Devnet)",
    `Wallet: ${normalizedAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");

  return {
    walletAddress: normalizedAddress,
    nonce,
    message,
  };
}

export function verifySolanaSignature(input: {
  walletAddress: string;
  message: string;
  signature: string;
}): string {
  const normalizedAddress = normalizeSolanaWalletAddress(input.walletAddress);
  let pubkeyBytes: Uint8Array;
  let signatureBytes: Uint8Array;

  try {
    pubkeyBytes = new PublicKey(normalizedAddress).toBytes();
    signatureBytes = bs58.decode(input.signature.trim());
  } catch {
    throw AppError.badRequest("Format signature dompet Solana tidak valid.");
  }

  if (signatureBytes.length !== nacl.sign.signatureLength) {
    throw AppError.unauthorized("Panjang signature dompet Solana tidak valid.");
  }

  const messageBytes = new TextEncoder().encode(input.message);
  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    pubkeyBytes
  );

  if (!isValid) {
    throw AppError.unauthorized("Verifikasi signature dompet Solana gagal.");
  }

  return normalizedAddress;
}

export async function verifySolanaLoginUseCase(input: {
  walletAddress: string;
  message: string;
  signature: string;
}): Promise<SolanaVerifyResult> {
  const normalizedAddress = verifySolanaSignature(input);

  const existingUser = await authRepository.findByWalletAddress(normalizedAddress);
  if (!existingUser) {
    return {
      status: "NEEDS_NICKNAME",
      walletAddress: normalizedAddress,
    };
  }

  if (existingUser.role !== "PLAYER") {
    throw AppError.forbidden(
      "Akun admin tidak dapat masuk menggunakan dompet Solana. Gunakan username dan password admin."
    );
  }

  void authRepository.touchLastActiveAt(existingUser.id).catch(() => {});

  const sessionPayload: SessionPayload = {
    userId: existingUser.id,
    walletAddress: existingUser.walletAddress,
    name: existingUser.name,
    role: existingUser.role,
    hasClaimedStarterPack: Boolean(existingUser.hasClaimedStarterPack),
    avatarUrl: existingUser.avatarUrl ?? null,
  };

  const tokens = await createSessionTokens(sessionPayload);
  return {
    status: "AUTHENTICATED",
    user: sessionPayload,
    ...tokens,
  };
}

export async function completeSolanaRegistrationUseCase(input: {
  walletAddress: string;
  nickname: string;
}): Promise<LoginResult> {
  const normalizedAddress = normalizeSolanaWalletAddress(input.walletAddress);
  const nickname = input.nickname.trim();

  if (nickname.length < 2 || nickname.length > 32) {
    throw AppError.badRequest("Nickname harus terdiri dari 2 hingga 32 karakter.");
  }

  const existingUser = await authRepository.findByWalletAddress(normalizedAddress);
  if (existingUser) {
    throw AppError.conflict("Alamat dompet Solana ini sudah terdaftar.");
  }

  const createdUser = await authRepository.createSolanaUser({
    walletAddress: normalizedAddress,
    name: nickname,
  });

  const sessionPayload: SessionPayload = {
    userId: createdUser.id,
    walletAddress: createdUser.walletAddress,
    name: createdUser.name,
    role: createdUser.role,
    hasClaimedStarterPack: Boolean(createdUser.hasClaimedStarterPack),
    avatarUrl: createdUser.avatarUrl ?? null,
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
    walletAddress: null,
    name: "Admin Nusa Warriors",
    role: "ADMIN",
    hasClaimedStarterPack: true,
  };

  const tokens = await createSessionTokens(sessionPayload);
  return { user: sessionPayload, ...tokens };
}
