import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";
import {
  linkGoogleAccountToGuestUseCase,
  loginWithGoogleCodeUseCase,
} from "@/server/modules/auth/application/auth.usecase";
import { logServerEvent } from "@/server/shared/logging/server-logger";
import { AppError } from "@/server/shared/errors/app-error";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  OAUTH_LINK_USER_COOKIE_NAME,
  OAUTH_LOCALE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/server/shared/auth/session";

export async function GET(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get("code");
  const state = reqUrl.searchParams.get("state");
  const oauthError = reqUrl.searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const savedLocale = cookieStore.get(OAUTH_LOCALE_COOKIE_NAME)?.value ?? "id";
  const linkUserId = cookieStore.get(OAUTH_LINK_USER_COOKIE_NAME)?.value;
  const locale = isSupportedLocale(savedLocale) ? savedLocale : DEFAULT_LOCALE;

  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ?? reqUrl.origin
  ).replace(/\/$/, "");

  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  cookieStore.delete(OAUTH_LOCALE_COOKIE_NAME);
  cookieStore.delete(OAUTH_LINK_USER_COOKIE_NAME);

  if (oauthError) {
    const errorDestination = linkUserId
      ? `${appBase}${ROUTES.USER_DASHBOARD(locale)}?error=${encodeURIComponent(oauthError)}`
      : `${appBase}${ROUTES.LOGIN(locale)}?error=${encodeURIComponent(oauthError)}`;
    return NextResponse.redirect(errorDestination);
  }

  if (!code || !state || !savedState || state !== savedState) {
    const errorDestination = linkUserId
      ? `${appBase}${ROUTES.USER_DASHBOARD(locale)}?error=invalid_oauth_state`
      : `${appBase}${ROUTES.LOGIN(locale)}?error=invalid_oauth_state`;
    return NextResponse.redirect(errorDestination);
  }

  try {
    const result = linkUserId
      ? await linkGoogleAccountToGuestUseCase(linkUserId, code)
      : await loginWithGoogleCodeUseCase(code);

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

    const destination =
      result.user.role === "ADMIN" || result.user.role === "CURATOR"
        ? `${appBase}${ROUTES.ADMIN_DASHBOARD(locale)}`
        : linkUserId
        ? `${appBase}${ROUTES.USER_DASHBOARD(locale)}?success=account_linked`
        : `${appBase}${ROUTES.USER_DASHBOARD(locale)}`;

    return NextResponse.redirect(destination);
  } catch (error: unknown) {
    logServerEvent("warn", "auth.google.callback.failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "unknown",
      isLinkAttempt: Boolean(linkUserId),
    });

    const isConflict = error instanceof AppError && error.code === "CONFLICT";
    const errorCode = isConflict ? "google_link_conflict" : "google_login_failed";
    const failureDestination = linkUserId
      ? `${appBase}${ROUTES.USER_DASHBOARD(locale)}?error=${errorCode}`
      : `${appBase}${ROUTES.LOGIN(locale)}?error=${errorCode}`;

    return NextResponse.redirect(failureDestination);
  }
}

