"use client";

import React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

export interface SolanaVaultTxBadgeProps {
  vaultPda?: string | null;
  lockTxSignature?: string | null;
  settleTxSignature?: string | null;
  cluster?: "devnet" | "mainnet-beta";
}

function shortenHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

function explorerTxLink(signature: string, cluster: "devnet" | "mainnet-beta"): string {
  const base = `https://explorer.solana.com/tx/${signature}`;
  return cluster === "mainnet-beta" ? base : `${base}?cluster=${cluster}`;
}

export function SolanaVaultTxBadge({
  vaultPda,
  lockTxSignature,
  settleTxSignature,
  cluster = "devnet",
}: SolanaVaultTxBadgeProps): React.ReactElement | null {
  if (!vaultPda && !lockTxSignature && !settleTxSignature) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
      <div className="flex items-center gap-1.5 font-semibold text-amber-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>On-Chain Battle Vault</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {vaultPda ? (
          <span className="text-amber-200/80">
            Vault PDA:{" "}
            <code className="font-mono text-amber-100">
              {shortenHash(vaultPda)}
            </code>
          </span>
        ) : null}
        {lockTxSignature ? (
          <a
            href={explorerTxLink(lockTxSignature, cluster)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-300 underline decoration-emerald-400/50 hover:text-emerald-200"
          >
            <span>Lock Tx: {shortenHash(lockTxSignature)}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        {settleTxSignature ? (
          <a
            href={explorerTxLink(settleTxSignature, cluster)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-300 underline decoration-sky-400/50 hover:text-sky-200"
          >
            <span>Settle Tx: {shortenHash(settleTxSignature)}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
