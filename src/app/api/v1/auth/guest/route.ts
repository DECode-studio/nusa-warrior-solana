import { cookies } from "next/headers";
import { loginAsGuestUseCase } from "@/server/modules/auth/application/auth.usecase";
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

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    const clientIp = getClientIp(request);
    await enforceRateLimit(`auth:guest-login:ip:${clientIp}`, {
      capacity: 10,
      refillPerSecond: 1 / 10,
    });

    const result = await loginAsGuestUseCase();

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

