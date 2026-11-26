"use client";

import React, { useState } from "react";
import { Coins, ExternalLink, Loader2 } from "lucide-react";

interface FaucetResponse {
  airdroppedSol: number;
  walletAddress: string;
  txSignature?: string;
  explorerUrl?: string;
  rateLimited?: boolean;
  faucetUrl?: string;
  message?: string;
}

export function DevnetFaucetButton(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaucetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestAirdrop = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/solana/faucet", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as {
        data?: FaucetResponse;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal meminta Devnet SOL.");
      }
      if (json.data) {
        setResult(json.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal meminta Devnet SOL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleRequestAirdrop}
        disabled={loading}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Coins className="h-3.5 w-3.5" />
        )}
        <span>{loading ? "Meminta Devnet SOL..." : "Request 1 Devnet SOL"}</span>
      </button>

      {result?.explorerUrl ? (
        <a
          href={result.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-300 underline"
        >
          <span>+1 SOL terkirim! Lihat Tx</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}

      {result?.rateLimited && result.faucetUrl ? (
        <a
          href={result.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-amber-300 underline"
        >
          <span>RPC limit tercapai — buka Solana Web Faucet</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}

      {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
