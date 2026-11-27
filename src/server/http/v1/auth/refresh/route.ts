import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  rotateRefreshToken,
} from "@/server/shared/auth/session";
import { parseRefreshToken } from "@/server/shared/auth/auth-session-store";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { getClientIp } from "@/server/shared/http/client-ip";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const parsedRefresh = parseRefreshToken(refreshToken);
    const rateLimitKey = parsedRefresh?.id ?? getClientIp(request);
    await enforceRateLimit(`auth:refresh:${rateLimitKey}`, {
      capacity: 20,
      refillPerSecond: 1 / 30,
    });
    const tokens = await rotateRefreshToken(refreshToken);
    if (!tokens) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      cookieStore.delete(REFRESH_COOKIE_NAME);
      return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    cookieStore.set(SESSION_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
    cookieStore.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
    const response = okResponse({ refreshed: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
