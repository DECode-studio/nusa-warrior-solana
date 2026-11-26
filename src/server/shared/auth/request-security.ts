import "server-only";
import { AppError } from "@/server/shared/errors/app-error";

export function assertSameOriginMutation(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw AppError.forbidden("Permintaan lintas origin tidak diizinkan.");
  }
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : requestOrigin;
  if (origin !== configuredOrigin && origin !== requestOrigin) {
    throw AppError.forbidden("Permintaan lintas origin tidak diizinkan.");
  }
}
