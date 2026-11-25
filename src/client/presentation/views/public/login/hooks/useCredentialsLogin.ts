"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
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
  const router = useRouter();
  const { locale } = useTranslator();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShowPassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        const user = await authUseCase.loginWithCredentials({
          mode: "ADMIN",
          username: username.trim(),
          password,
        });
        if (user.role === "ADMIN" || user.role === "CURATOR") {
          router.push(ROUTES.ADMIN_DASHBOARD(locale));
        } else {
          router.push(ROUTES.USER_DASHBOARD(locale));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Username atau kata sandi tidak sesuai.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [locale, password, router, username]
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

