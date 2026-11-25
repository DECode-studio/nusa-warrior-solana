import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import { getCurrentSession, type SessionPayload } from "./session";

export async function requirePlayerSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw AppError.unauthorized("Silakan hubungkan dompet Solana untuk melanjutkan.");
  }
  if (session.role !== "PLAYER") {
    throw AppError.forbidden("Akses ini hanya tersedia untuk akun pemain.");
  }
  return session;
}

export async function requireAdminSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw AppError.unauthorized("Silakan masuk sebagai admin untuk melanjutkan.");
  }
  if (session.role !== "ADMIN" && session.role !== "CURATOR") {
    throw AppError.forbidden("Akses ini hanya tersedia untuk admin.");
  }
  return session;
}

export async function requireAuthSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw AppError.unauthorized("Silakan hubungkan dompet Solana Anda untuk melanjutkan.");
  }
  return session;
}
