"use client";

import React from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Button, InputField } from "@/client/presentation/components/ui";
import { PUBLIC_LOGIN_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { PUBLIC_LOGIN_TEXT_CONSTANT } from "../constants/TextConstant";

export interface PublicLoginCredentialsFormProps {
  readonly username: string;
  readonly onUsernameChange: (value: string) => void;
  readonly password: string;
  readonly onPasswordChange: (value: string) => void;
  readonly showPassword: boolean;
  readonly onToggleShowPassword: () => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function PublicLoginCredentialsForm({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  isLoading,
  error,
  onSubmit,
}: PublicLoginCredentialsFormProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={PUBLIC_LOGIN_SEMANTIC_IDS.CREDENTIALS_SECTION}
      aria-labelledby="credentials-login-heading"
    >
      <h3
        id="credentials-login-heading"
        className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#A8A7FF]"
      >
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_HEADING)}
      </h3>

      {error && (
        <div
          role="alert"
          className="mb-4 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form
        id={PUBLIC_LOGIN_SEMANTIC_IDS.CREDENTIALS_FORM}
        onSubmit={(event) => void onSubmit(event)}
        className="space-y-4"
      >
        <InputField
          id={PUBLIC_LOGIN_SEMANTIC_IDS.CREDENTIALS_USERNAME}
          name="username"
          label={t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_USERNAME_LABEL)}
          autoComplete="username"
          required
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder={t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_USERNAME_PLACEHOLDER)}
          leftIcon={<UserRound className="h-4 w-4" />}
        />

        <InputField
          id={PUBLIC_LOGIN_SEMANTIC_IDS.CREDENTIALS_PASSWORD}
          name="password"
          label={t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_PASSWORD_LABEL)}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder={t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_PASSWORD_PLACEHOLDER)}
          type={showPassword ? "text" : "password"}
          leftIcon={<LockKeyhole className="h-4 w-4" />}
          rightIcon={
            <button
              id={PUBLIC_LOGIN_SEMANTIC_IDS.CREDENTIALS_PASSWORD_TOGGLE_BTN}
              type="button"
              onClick={onToggleShowPassword}
              aria-label={
                showPassword
                  ? t(PUBLIC_LOGIN_TEXT_CONSTANT.PASSWORD_HIDE)
                  : t(PUBLIC_LOGIN_TEXT_CONSTANT.PASSWORD_SHOW)
              }
              aria-pressed={showPassword}
              className="pointer-events-auto rounded p-1 text-[#CFCBE2]/70 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <Button
          id={PUBLIC_LOGIN_SEMANTIC_IDS.CREDENTIALS_SUBMIT_BTN}
          type="submit"
          size="md"
          shape="rounded"
          className="w-full"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {isLoading
            ? t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_SUBMIT_LOADING)
            : t(PUBLIC_LOGIN_TEXT_CONSTANT.CREDENTIALS_SUBMIT_BTN)}
        </Button>
      </form>
    </section>
  );
}

