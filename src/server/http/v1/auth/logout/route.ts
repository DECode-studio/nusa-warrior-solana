import { cookies } from "next/headers";
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  revokeCurrentSession,
} from "@/server/shared/auth/session";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    await revokeCurrentSession();
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(REFRESH_COOKIE_NAME);
    const response = okResponse({ loggedOut: true });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

