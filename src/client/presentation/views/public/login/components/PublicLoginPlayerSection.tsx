"use client";

import React from "react";
import { Clock, Gamepad2 } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { PUBLIC_LOGIN_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { PUBLIC_LOGIN_TEXT_CONSTANT } from "../constants/TextConstant";

export interface PublicLoginPlayerSectionProps {
  readonly loading: boolean;
  readonly isConfigured: boolean;
  readonly onGoogleSignIn: () => void;
  readonly guestLoading?: boolean;
  readonly onGuestSignIn?: () => void;
}

export function PublicLoginPlayerSection({
  loading,
  isConfigured,
  onGoogleSignIn,
  guestLoading = false,
  onGuestSignIn,
}: PublicLoginPlayerSectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={PUBLIC_LOGIN_SEMANTIC_IDS.PLAYER_SECTION}
      aria-labelledby="player-login-heading"
      className="space-y-3"
    >
      <h3
        id="player-login-heading"
        className="text-xs font-bold uppercase tracking-[0.14em] text-[#A8A7FF]"
      >
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.PLAYER_HEADING)}
      </h3>
      <Button
        id={PUBLIC_LOGIN_SEMANTIC_IDS.GOOGLE_LOGIN_BTN}
        type="button"
        variant="secondary"
        size="md"
        className="w-full"
        disabled={loading || guestLoading || !isConfigured}
        isLoading={loading}
        onClick={onGoogleSignIn}
        leftIcon={<GoogleMark />}
      >
        {t(PUBLIC_LOGIN_TEXT_CONSTANT.GOOGLE_LOGIN_BTN)}
      </Button>
      {!loading && !isConfigured && (
        <p
          id={PUBLIC_LOGIN_SEMANTIC_IDS.SSO_UNAVAILABLE_NOTICE}
          className="text-xs leading-5 text-[#CFCBE2]/60"
        >
          {t(PUBLIC_LOGIN_TEXT_CONSTANT.SSO_UNAVAILABLE)}
        </p>
      )}

      {onGuestSignIn && (
        <div className="pt-1">
          <Button
            id={PUBLIC_LOGIN_SEMANTIC_IDS.GUEST_LOGIN_BTN}
            type="button"
            variant="ghost"
            size="md"
            className="w-full border border-white/10 bg-white/5 text-[#E6E4F2] hover:border-[#6766FF]/40 hover:bg-[#6766FF]/10 hover:text-white"
            disabled={loading || guestLoading}
            isLoading={guestLoading}
            onClick={onGuestSignIn}
            leftIcon={<Gamepad2 className="h-4 w-4 text-[#A8A7FF]" aria-hidden="true" />}
          >
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.GUEST_LOGIN_BTN)}
          </Button>
          <p
            id={PUBLIC_LOGIN_SEMANTIC_IDS.GUEST_DISCLAIMER}
            className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] leading-4 text-[#CFCBE2]/50"
          >
            <Clock className="h-3 w-3 shrink-0 text-[#A8A7FF]/70" aria-hidden="true" />
            <span>{t(PUBLIC_LOGIN_TEXT_CONSTANT.GUEST_DISCLAIMER)}</span>
          </p>
        </div>
      )}
    </section>
  );
}

function GoogleMark(): React.ReactElement {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

