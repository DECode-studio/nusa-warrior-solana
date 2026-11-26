import { cookies } from "next/headers";
import { z } from "zod";
import { completeSolanaRegistrationUseCase } from "@/server/modules/auth/application/auth.usecase";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  SOLANA_PENDING_NICKNAME_COOKIE_NAME,
  verifySolanaPendingNicknameToken,
} from "@/server/shared/auth/session";
import { AppError } from "@/server/shared/errors/app-error";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { getClientIp } from "@/server/shared/http/client-ip";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const solanaRegisterSchema = z.object({
  nickname: z.string().trim().min(2).max(32),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const clientIp = getClientIp(request);
    await enforceRateLimit(`auth:solana-register:ip:${clientIp}`, {
      capacity: 10,
      refillPerSecond: 1 / 15,
    });

    const parsed = await parseJsonWithSchema(request, solanaRegisterSchema, 4_096);
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get(
      SOLANA_PENDING_NICKNAME_COOKIE_NAME
    )?.value;

    if (!pendingToken) {
      throw AppError.unauthorized(
        "Verifikasi dompet Solana belum dilakukan atau telah kedaluwarsa. Silakan tanda tangani ulang pesan dompet Anda."
      );
    }

    const pending = await verifySolanaPendingNicknameToken(pendingToken);
    if (!pending) {
      cookieStore.delete(SOLANA_PENDING_NICKNAME_COOKIE_NAME);
      throw AppError.unauthorized(
        "Token registrasi dompet Solana tidak valid atau telah kedaluwarsa."
      );
    }

    const result = await completeSolanaRegistrationUseCase({
      walletAddress: pending.walletAddress,
      nickname: parsed.nickname,
    });

    cookieStore.delete(SOLANA_PENDING_NICKNAME_COOKIE_NAME);
    cookieStore.set(SESSION_COOKIE_NAME, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
    cookieStore.set(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });

    const response = okResponse({
      status: "AUTHENTICATED" as const,
      user: result.user,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
