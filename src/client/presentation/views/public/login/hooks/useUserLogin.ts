"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GoogleSsoConfigEntity } from "@/client/domain/auth/entity/user_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";

export interface UseUserLoginReturn {
  readonly ssoConfig: GoogleSsoConfigEntity | null;
  readonly loading: boolean;
  readonly guestLoading: boolean;
  readonly errorMsg: string | null;
  readonly startGoogleSignIn: () => void;
  readonly startGuestSignIn: () => Promise<void>;
}

export function useUserLogin(): UseUserLoginReturn {
  const router = useRouter();
  const { locale, t } = useTranslator();
  const searchParams = useSearchParams();
  const [ssoConfig, setSsoConfig] = useState<GoogleSsoConfigEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError === "google_oauth_not_configured") {
      setErrorMsg(t("login.googleNotConfigured"));
    } else if (queryError === "invalid_oauth_state") {
      setErrorMsg(t("login.googleSessionExpired"));
    } else if (queryError === "access_denied") {
      setErrorMsg(t("login.googleAccessDenied"));
    } else if (queryError === "google_link_conflict") {
      setErrorMsg(t("login.googleLinkConflict"));
    } else if (queryError) {
      setErrorMsg(t("login.googleAuthFailed"));
    }
  }, [searchParams, t]);

  useEffect(() => {
    let active = true;
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await getService(AUTH_USECASE_TOKEN).getGoogleSsoConfig();
        if (active) setSsoConfig(config);
      } catch {
        if (active) {
          setErrorMsg(t("login.googleStatusUnavailable"));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadConfig();
    return () => {
      active = false;
    };
  }, [t]);

  const startGoogleSignIn = useCallback((): void => {
    setErrorMsg(null);
    if (!ssoConfig?.isConfigured) {
      setErrorMsg(t("login.googleNotConfigured"));
      return;
    }
    window.location.href = `${API_ROUTES.AUTH.GOOGLE}?lang=${encodeURIComponent(locale)}`;
  }, [locale, ssoConfig, t]);

  const startGuestSignIn = useCallback(async (): Promise<void> => {
    setErrorMsg(null);
    setGuestLoading(true);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      await authUseCase.loginAsGuest();
      router.push(ROUTES.USER_DASHBOARD(locale));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("login.guestLoginFailed");
      setErrorMsg(message);
    } finally {
      setGuestLoading(false);
    }
  }, [locale, router, t]);

  return {
    ssoConfig,
    loading,
    guestLoading,
    errorMsg,
    startGoogleSignIn,
    startGuestSignIn,
  };
}
