import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import { getCurrentSession, type SessionPayload } from "./session";

export async function requirePlayerSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    throw AppError.unauthorized("Silakan masuk dengan Google untuk melanjutkan.");
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
    throw AppError.unauthorized("Silakan masuk dengan akun Anda untuk melanjutkan.");
  }
  if (session.isGuest) {
    throw AppError.forbidden("Mode tamu tidak dapat menggunakan fitur ini. Silakan hubungkan akun Google Anda.");
  }
  return session;
}
