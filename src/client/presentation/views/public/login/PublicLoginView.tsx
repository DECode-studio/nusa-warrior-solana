"use client";

import React, { Suspense } from "react";
import { useTranslator } from "@/core/translator";
import {
  PublicContainer,
  PublicPageLayout,
} from "@/client/presentation/components";
import { useCredentialsLogin } from "./hooks/useCredentialsLogin";
import { useUserLogin } from "./hooks/useUserLogin";
import {
  PublicLoginCard,
  PublicLoginPitchSection,
} from "./components";
import { PUBLIC_LOGIN_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { PUBLIC_LOGIN_TEXT_CONSTANT } from "./constants/TextConstant";

export function PublicLoginView(): React.ReactElement {
  const { t } = useTranslator();

  return (
    <PublicPageLayout showFooter={false}>
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-[#080220] text-sm text-[#CFCBE2]">
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.LOADING_PAGE)}
          </main>
        }
      >
        <PublicLoginContent />
      </Suspense>
    </PublicPageLayout>
  );
}

function PublicLoginContent(): React.ReactElement {
  const user = useUserLogin();
  const credentials = useCredentialsLogin();

  return (
    <main
      id={PUBLIC_LOGIN_SEMANTIC_IDS.ROOT}
      className="relative min-h-screen overflow-hidden bg-[#080220] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_10%,rgba(103,102,255,0.25),transparent_42%),radial-gradient(ellipse_at_90%_85%,rgba(255,159,49,0.12),transparent_36%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />

      <PublicContainer
        size="wide"
        className="relative z-10 grid min-h-screen items-center gap-10 pb-10 pt-20 lg:grid-cols-[1fr_0.92fr] lg:gap-16 lg:pb-16"
      >
        {/* Left Column: Brand Pitch & Highlights */}
        <PublicLoginPitchSection />

        {/* Right Column: Unified Authentication Card */}
        <PublicLoginCard
          connected={user.connected}
          walletAddress={user.walletAddress}
          walletName={user.walletName}
          userLoading={user.loading}
          needsNickname={user.needsNickname}
          nickname={user.nickname}
          onNicknameChange={user.setNickname}
          userErrorMsg={user.errorMsg}
          onSolanaSignIn={user.startSolanaSignIn}
          onSubmitNickname={user.submitNickname}
          onDisconnectWallet={user.disconnectWallet}
          credentialsUsername={credentials.username}
          onCredentialsUsernameChange={credentials.setUsername}
          credentialsPassword={credentials.password}
          onCredentialsPasswordChange={credentials.setPassword}
          credentialsShowPassword={credentials.showPassword}
          onCredentialsToggleShowPassword={credentials.toggleShowPassword}
          credentialsLoading={credentials.isLoading}
          credentialsError={credentials.error}
          onCredentialsSubmit={credentials.handleSubmit}
        />
      </PublicContainer>
    </main>
  );
}
