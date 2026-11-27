"use client";

import { useState, useCallback, useRef } from "react";
import { ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import {
  clearAuthRefreshCache,
  runWithAuthMutationLock,
} from "@/core/http-client/auth-refresh";
import { useTranslator } from "@/core/translator";

export interface UseCredentialsLoginReturn {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  toggleShowPassword: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useCredentialsLogin(): UseCredentialsLoginReturn {
  const { locale } = useTranslator();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const toggleShowPassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (submittingRef.current) return;
      submittingRef.current = true;
      setError(null);
      setIsLoading(true);

      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        const user = await runWithAuthMutationLock(() =>
          authUseCase.loginWithCredentials({
            mode: "ADMIN",
            username: username.trim(),
            password,
          })
        );
        clearAuthRefreshCache();
        const targetPath =
          user.role === "ADMIN" || user.role === "CURATOR"
            ? ROUTES.ADMIN_DASHBOARD(locale)
            : ROUTES.USER_DASHBOARD(locale);
        window.location.assign(targetPath);
      } catch (err: unknown) {
        submittingRef.current = false;
        setIsLoading(false);
        const message =
          err instanceof Error
            ? err.message
            : "Username atau kata sandi tidak sesuai.";
        setError(message);
      }
    },
    [locale, password, username]
  );

  return {
    username,
    password,
    showPassword,
    isLoading,
    error,
    setUsername,
    setPassword,
    toggleShowPassword,
    handleSubmit,
  };
}

