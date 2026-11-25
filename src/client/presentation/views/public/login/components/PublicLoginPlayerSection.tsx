"use client";

import React from "react";
import { LogOut, UserCheck, Wallet } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Button, InputField } from "@/client/presentation/components/ui";
import { PUBLIC_LOGIN_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { PUBLIC_LOGIN_TEXT_CONSTANT } from "../constants/TextConstant";

export interface PublicLoginPlayerSectionProps {
  readonly connected: boolean;
  readonly walletAddress: string | null;
  readonly walletName: string | null;
  readonly loading: boolean;
  readonly needsNickname: boolean;
  readonly nickname: string;
  readonly onNicknameChange: (value: string) => void;
  readonly onSolanaSignIn: () => void;
  readonly onSubmitNickname: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  readonly onDisconnectWallet: () => void;
}

function shortenWalletAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function PublicLoginPlayerSection({
  connected,
  walletAddress,
  walletName,
  loading,
  needsNickname,
  nickname,
  onNicknameChange,
  onSolanaSignIn,
  onSubmitNickname,
  onDisconnectWallet,
}: PublicLoginPlayerSectionProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <section
      id={PUBLIC_LOGIN_SEMANTIC_IDS.PLAYER_SECTION}
      aria-labelledby="player-login-heading"
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          id="player-login-heading"
          className="text-xs font-bold uppercase tracking-[0.14em] text-[#A8A7FF]"
        >
          {t(PUBLIC_LOGIN_TEXT_CONSTANT.PLAYER_HEADING)}
        </h3>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          Devnet
        </span>
      </div>

      {connected && walletAddress && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#6766FF]/25 bg-[#6766FF]/10 px-3 py-2 text-xs text-[#E6E4F2]">
          <div className="flex min-w-0 items-center gap-2">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-[#A8A7FF]" aria-hidden="true" />
            <span className="truncate font-mono">
              {walletName ? `${walletName} · ` : ""}
              {shortenWalletAddress(walletAddress)}
            </span>
          </div>
          <button
            type="button"
            onClick={onDisconnectWallet}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#CFCBE2]/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-3 w-3" aria-hidden="true" />
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.DISCONNECT_WALLET_BTN)}
          </button>
        </div>
      )}

      {needsNickname ? (
        <form
          id={PUBLIC_LOGIN_SEMANTIC_IDS.NICKNAME_FORM}
          onSubmit={onSubmitNickname}
          className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
        >
          <p className="text-xs leading-5 text-[#CFCBE2]/80">
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.NICKNAME_PROMPT)}
          </p>
          <InputField
            id={PUBLIC_LOGIN_SEMANTIC_IDS.NICKNAME_INPUT}
            label={t(PUBLIC_LOGIN_TEXT_CONSTANT.NICKNAME_LABEL)}
            placeholder={t(PUBLIC_LOGIN_TEXT_CONSTANT.NICKNAME_PLACEHOLDER)}
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            minLength={2}
            maxLength={32}
            required
            autoFocus
          />
          <Button
            id={PUBLIC_LOGIN_SEMANTIC_IDS.NICKNAME_SUBMIT_BTN}
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading || nickname.trim().length < 2}
            isLoading={loading}
            leftIcon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
          >
            {t(PUBLIC_LOGIN_TEXT_CONSTANT.NICKNAME_SUBMIT_BTN)}
          </Button>
        </form>
      ) : (
        <Button
          id={PUBLIC_LOGIN_SEMANTIC_IDS.SOLANA_LOGIN_BTN}
          type="button"
          variant="secondary"
          size="md"
          className="w-full"
          disabled={loading}
          isLoading={loading}
          onClick={onSolanaSignIn}
          leftIcon={<Wallet className="h-4 w-4 text-[#A8A7FF]" aria-hidden="true" />}
        >
          {connected
            ? t(PUBLIC_LOGIN_TEXT_CONSTANT.SOLANA_SIGN_BTN)
            : t(PUBLIC_LOGIN_TEXT_CONSTANT.SOLANA_CONNECT_BTN)}
        </Button>
      )}
    </section>
  );
}
