import { cookies } from "next/headers";
import { z } from "zod";
import { createSolanaChallengeUseCase } from "@/server/modules/auth/application/auth.usecase";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import {
  SOLANA_NONCE_COOKIE_NAME,
  SOLANA_NONCE_TTL_SECONDS,
  signSolanaNonceToken,
} from "@/server/shared/auth/session";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { getClientIp } from "@/server/shared/http/client-ip";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const solanaNonceSchema = z.object({
  walletAddress: z.string().trim().min(32).max(64),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const clientIp = getClientIp(request);
    await enforceRateLimit(`auth:solana-nonce:ip:${clientIp}`, {
      capacity: 20,
      refillPerSecond: 1 / 5,
    });

    const parsed = await parseJsonWithSchema(request, solanaNonceSchema, 4_096);
    const challenge = createSolanaChallengeUseCase(parsed.walletAddress);
    const nonceToken = await signSolanaNonceToken(challenge);

    const cookieStore = await cookies();
    cookieStore.set(SOLANA_NONCE_COOKIE_NAME, nonceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SOLANA_NONCE_TTL_SECONDS,
    });

    const response = okResponse({
      walletAddress: challenge.walletAddress,
      nonce: challenge.nonce,
      message: challenge.message,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
