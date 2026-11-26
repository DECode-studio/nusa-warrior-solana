import { cookies } from "next/headers";
import { z } from "zod";
import { verifySolanaLoginUseCase } from "@/server/modules/auth/application/auth.usecase";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  SOLANA_NONCE_COOKIE_NAME,
  SOLANA_PENDING_NICKNAME_COOKIE_NAME,
  SOLANA_PENDING_NICKNAME_TTL_SECONDS,
  signSolanaPendingNicknameToken,
  verifySolanaNonceToken,
} from "@/server/shared/auth/session";
import { AppError } from "@/server/shared/errors/app-error";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { getClientIp } from "@/server/shared/http/client-ip";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const solanaVerifySchema = z.object({
  walletAddress: z.string().trim().min(32).max(64),
  signature: z.string().trim().min(64).max(128),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const clientIp = getClientIp(request);
    await enforceRateLimit(`auth:solana-verify:ip:${clientIp}`, {
      capacity: 15,
      refillPerSecond: 1 / 10,
    });

    const parsed = await parseJsonWithSchema(request, solanaVerifySchema, 4_096);
    const cookieStore = await cookies();
    const nonceToken = cookieStore.get(SOLANA_NONCE_COOKIE_NAME)?.value;
    cookieStore.delete(SOLANA_NONCE_COOKIE_NAME);

    if (!nonceToken) {
      throw AppError.unauthorized(
        "Sesi tantangan dompet Solana tidak ditemukan atau telah kedaluwarsa. Silakan coba lagi."
      );
    }

    const challenge = await verifySolanaNonceToken(nonceToken);
    if (!challenge || challenge.walletAddress !== parsed.walletAddress.trim()) {
      throw AppError.unauthorized(
        "Tantangan dompet Solana tidak valid atau telah kedaluwarsa."
      );
    }

    const result = await verifySolanaLoginUseCase({
      walletAddress: challenge.walletAddress,
      message: challenge.message,
      signature: parsed.signature,
    });

    if (result.status === "NEEDS_NICKNAME") {
      const pendingToken = await signSolanaPendingNicknameToken(
        result.walletAddress
      );
      cookieStore.set(SOLANA_PENDING_NICKNAME_COOKIE_NAME, pendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SOLANA_PENDING_NICKNAME_TTL_SECONDS,
      });

      const response = okResponse({
        status: "NEEDS_NICKNAME" as const,
        walletAddress: result.walletAddress,
      });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

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
