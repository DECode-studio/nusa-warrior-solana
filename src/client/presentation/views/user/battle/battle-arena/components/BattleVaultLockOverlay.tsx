"use client";

import React from "react";
import { CheckCircle2, Clock, Loader2, Lock, ShieldCheck, Wallet, XCircle } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslator } from "@/core/translator";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { SolanaVaultTxBadge } from "@/client/presentation/components/solana/SolanaVaultTxBadge";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface BattleVaultLockOverlayProps {
  readonly isOpen: boolean;
  readonly isLeagueMatch: boolean;
  readonly vaultPda: string | null;
  readonly viewerLockTxSignature: string | null;
  readonly viewerVaultLocked: boolean;
  readonly opponentVaultLocked: boolean;
  readonly isLocking: boolean;
  readonly isCancelling?: boolean;
  readonly errorMessage: string | null;
  readonly onLockCards: () => void;
  readonly onCancelMatch: () => void;
}

export function BattleVaultLockOverlay({
  isOpen,
  isLeagueMatch,
  vaultPda,
  viewerLockTxSignature,
  viewerVaultLocked,
  opponentVaultLocked,
  isLocking,
  isCancelling = false,
  errorMessage,
  onLockCards,
  onCancelMatch,
}: BattleVaultLockOverlayProps): React.ReactElement | null {
  const { t } = useTranslator();
  const { connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancelMatch}
      size="sm"
      className="border border-amber-400/40 text-center"
      closeOnBackdropClick={false}
      showCloseButton={false}
      dragToDismiss={false}
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-300">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="font-display text-xl font-bold text-cream sm:text-2xl">
          {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_TITLE)}
        </h2>

        <p className="text-xs leading-relaxed text-muted sm:text-sm">
          {isLeagueMatch
            ? t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_DESC_LEAGUE)
            : t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_DESC_PVP)}
        </p>

        <div className="grid grid-cols-2 gap-2.5 text-left">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-medium text-subtle">
              {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_YOUR_STATUS)}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              {viewerVaultLocked ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-light" />
                  <span className="text-emerald-light">
                    {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_STATUS_LOCKED)}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-light" />
                  <span className="text-amber-light">
                    {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_STATUS_PENDING)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-medium text-subtle">
              {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_OPPONENT_STATUS)}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              {opponentVaultLocked ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-light" />
                  <span className="text-emerald-light">
                    {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_STATUS_LOCKED)}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-light" />
                  <span className="text-amber-light">
                    {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_STATUS_PENDING)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {(vaultPda || viewerLockTxSignature) && (
          <SolanaVaultTxBadge
            vaultPda={vaultPda}
            lockTxSignature={viewerLockTxSignature}
          />
        )}

        {errorMessage && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-2.5 text-xs font-medium text-danger-light">
            {errorMessage}
          </div>
        )}

        {viewerVaultLocked && !opponentVaultLocked ? (
          <div className="rounded-xl border border-emerald/30 bg-emerald/10 p-3 text-xs font-medium text-emerald-light">
            {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_WAITING_OPPONENT)}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2.5">
          {!viewerVaultLocked &&
            (connected ? (
              <Button
                onClick={onLockCards}
                variant="primary"
                size="md"
                disabled={isLocking || isCancelling}
                leftIcon={
                  isLocking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )
                }
              >
                {isLocking
                  ? t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_LOCKING_BTN)
                  : t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_ACTION_BTN)}
              </Button>
            ) : (
              <Button
                onClick={() => setWalletModalVisible(true)}
                variant="primary"
                size="md"
                disabled={isCancelling}
                leftIcon={<Wallet className="h-4 w-4" />}
              >
                {t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_CONNECT_WALLET)}
              </Button>
            ))}

          <Button
            onClick={onCancelMatch}
            variant="secondary"
            size="md"
            disabled={isLocking || isCancelling}
            leftIcon={
              isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )
            }
          >
            {isCancelling
              ? t(BATTLE_TEXT_CONSTANT.VAULT_CANCELING_BTN)
              : t(BATTLE_TEXT_CONSTANT.VAULT_LOCK_CANCEL_BTN)}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
