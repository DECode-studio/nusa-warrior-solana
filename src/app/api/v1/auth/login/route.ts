import { cookies } from "next/headers";
import { z } from "zod";
import {
  getGoogleOAuthConfig,
  loginWithCredentialsUseCase,
} from "@/server/modules/auth/application/auth.usecase";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/server/shared/auth/session";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { getClientIp } from "@/server/shared/http/client-ip";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";

const loginRequestSchema = z.object({
  mode: z.literal("ADMIN"),
  username: z.string().max(128).optional(),
  password: z.string().max(256).optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const config = getGoogleOAuthConfig();
    return okResponse({
      provider: "GOOGLE_SSO",
      loginUrl: "/api/v1/auth/google",
      callbackUrl: config.redirectUri,
      isConfigured: config.isConfigured,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const parsed = await parseJsonWithSchema(request, loginRequestSchema, 8_192);
    const clientIp = getClientIp(request);
    const identity = (parsed.username ?? "").trim().toLowerCase().slice(0, 128) || "missing";
    await enforceRateLimit(`auth:admin-login:ip:${clientIp}`, {
      capacity: 20,
      refillPerSecond: 1 / 45,
    });
    await enforceRateLimit(`auth:admin-login:${clientIp}:${identity}`, {
      capacity: 5,
      refillPerSecond: 1 / 300,
    });
    const result = await loginWithCredentialsUseCase(parsed);

    const cookieStore = await cookies();
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

    const response = okResponse(result.user);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
