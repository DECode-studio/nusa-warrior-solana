"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Fingerprint } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { IntellioCard } from "@/client/presentation/components/ui";
import { PUBLIC_LOGIN_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { PUBLIC_LOGIN_TEXT_CONSTANT } from "../constants/TextConstant";
import { PublicLoginCredentialsForm } from "./PublicLoginCredentialsForm";
import { PublicLoginPlayerSection } from "./PublicLoginPlayerSection";

export interface PublicLoginCardProps {
  readonly userLoading: boolean;
  readonly guestLoading?: boolean;
  readonly isSsoConfigured: boolean;
  readonly userErrorMsg: string | null;
  readonly onGoogleSignIn: () => void;
  readonly onGuestSignIn?: () => void;
  readonly credentialsUsername: string;
  readonly onCredentialsUsernameChange: (value: string) => void;
  readonly credentialsPassword: string;
  readonly onCredentialsPasswordChange: (value: string) => void;
  readonly credentialsShowPassword: boolean;
  readonly onCredentialsToggleShowPassword: () => void;
  readonly credentialsLoading: boolean;
  readonly credentialsError: string | null;
  readonly onCredentialsSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function PublicLoginCard({
  userLoading,
  guestLoading,
  isSsoConfigured,
  userErrorMsg,
  onGoogleSignIn,
  onGuestSignIn,
  credentialsUsername,
  onCredentialsUsernameChange,
  credentialsPassword,
  onCredentialsPasswordChange,
  credentialsShowPassword,
  onCredentialsToggleShowPassword,
  credentialsLoading,
  credentialsError,
  onCredentialsSubmit,
}: PublicLoginCardProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section className="mx-auto w-full max-w-[520px]">
      <IntellioCard
        id={PUBLIC_LOGIN_SEMANTIC_IDS.CARD_CONTAINER}
        variant="glass"
        padding="md"
        className="shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <div id={PUBLIC_LOGIN_SEMANTIC_IDS.CARD_HEADER} className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#6766FF]/35 bg-[#6766FF]/15 text-[#B9B8FF]">
            <Fingerprint className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2
            id={PUBLIC_LOGIN_SEMANTIC_IDS.CARD_TITLE}
            className="nc-type-section-title font-display font-extrabold"
          >
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.CARD_TITLE)}
          </h2>
          <p
            id={PUBLIC_LOGIN_SEMANTIC_IDS.CARD_SUBTITLE}
            className="mt-1.5 text-sm text-[#CFCBE2]/70"
          >
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.CARD_SUBTITLE)}
          </p>
        </div>

        {userErrorMsg && (
          <div
            role="alert"
            className="mb-4 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm leading-5 text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{userErrorMsg}</span>
          </div>
        )}

        {/* Player Login Section */}
        <PublicLoginPlayerSection
          loading={userLoading}
          guestLoading={guestLoading}
          isConfigured={isSsoConfigured}
          onGoogleSignIn={onGoogleSignIn}
          onGuestSignIn={onGuestSignIn}
        />

        {/* Divider */}
        <div
          id={PUBLIC_LOGIN_SEMANTIC_IDS.DIVIDER_CREDENTIALS}
          aria-hidden="true"
          className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#CFCBE2]/45"
        >
          <span className="h-px flex-1 bg-white/10" />
          {t(PUBLIC_LOGIN_TEXT_CONSTANT.DIVIDER_CREDENTIALS)}
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Credentials Login Form */}
        <PublicLoginCredentialsForm
          username={credentialsUsername}
          onUsernameChange={onCredentialsUsernameChange}
          password={credentialsPassword}
          onPasswordChange={onCredentialsPasswordChange}
          showPassword={credentialsShowPassword}
          onToggleShowPassword={onCredentialsToggleShowPassword}
          isLoading={credentialsLoading}
          error={credentialsError}
          onSubmit={onCredentialsSubmit}
        />

        {/* Secure connection footnote */}
        <div
          id={PUBLIC_LOGIN_SEMANTIC_IDS.SECURE_NOTICE}
          className="nc-type-caption mt-6 flex items-center justify-center gap-2 border-t border-white/[0.08] pt-5 text-center text-[#CFCBE2]/60"
        >
          <Fingerprint className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t(PUBLIC_LOGIN_TEXT_CONSTANT.SECURE_NOTICE)}
        </div>
      </IntellioCard>

      <p className="mt-5 text-center text-xs text-[#CFCBE2]/45">
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.NEW_TO_GAME)}{" "}
        <Link
          id={PUBLIC_LOGIN_SEMANTIC_IDS.HOME_LINK}
          href={ROUTES.HOME(locale)}
          className="font-semibold text-[#B9B8FF] hover:text-white"
        >
          {t(PUBLIC_LOGIN_TEXT_CONSTANT.HOME)}{" "}
          <ArrowRight className="inline h-3 w-3" aria-hidden="true" />
        </Link>
      </p>
    </section>
  );
}
