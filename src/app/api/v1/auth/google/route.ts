import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrlUseCase,
  getGoogleOAuthConfig,
} from "@/server/modules/auth/application/auth.usecase";
import {
  getCurrentSession,
  OAUTH_LINK_USER_COOKIE_NAME,
  OAUTH_LOCALE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@/server/shared/auth/session";

export async function GET(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const locale = reqUrl.searchParams.get("lang") ?? "id";
  const action = reqUrl.searchParams.get("action");
  const config = getGoogleOAuthConfig();

  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ?? reqUrl.origin
  ).replace(/\/$/, "");

  if (!config.isConfigured) {
    return NextResponse.redirect(
      `${appBase}/${locale}/sign-in?error=google_oauth_not_configured`
    );
  }

  const cookieStore = await cookies();
  const session = await getCurrentSession();

  if (action === "link" && session?.isGuest) {
    cookieStore.set(OAUTH_LINK_USER_COOKIE_NAME, session.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  } else {
    cookieStore.delete(OAUTH_LINK_USER_COOKIE_NAME);
  }

  const state = crypto.randomUUID();
  const authorizationUrl = buildGoogleAuthorizationUrlUseCase(state);

  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set(OAUTH_LOCALE_COOKIE_NAME, locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(authorizationUrl);
}

