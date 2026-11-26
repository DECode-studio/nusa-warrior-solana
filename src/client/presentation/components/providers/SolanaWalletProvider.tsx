"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { WalletAdapterNetwork, type WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

function WalletSessionGuard(): null {
  const { connected, connecting, publicKey } = useWallet();
  const sessionWalletRef = useRef<string | null>(null);
  const wasConnectedRef = useRef(false);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: { walletAddress?: string | null } } | null) => {
        if (!active) return;
        sessionWalletRef.current = json?.data?.walletAddress ?? null;
      })
      .catch(() => {
        // Ignore transient network errors during session probe
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (connecting) return;

    const currentAddress = publicKey?.toBase58() ?? null;
    if (connected && currentAddress) {
      wasConnectedRef.current = true;
    }

    const sessionWallet = sessionWalletRef.current;
    if (!sessionWallet) return;

    const disconnectedAfterConnect = wasConnectedRef.current && !connected;
    const switchedWallet =
      Boolean(currentAddress) && currentAddress !== sessionWallet;

    if ((disconnectedAfterConnect || switchedWallet) && !loggingOutRef.current) {
      loggingOutRef.current = true;
      fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      })
        .catch(() => undefined)
        .finally(() => {
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/id/login?reason=wallet_disconnected";
          }
        });
    }
  }, [connected, connecting, publicKey]);

  return null;
}

export interface SolanaWalletProviderProps {
  readonly children: React.ReactNode;
}

export function SolanaWalletProvider({
  children,
}: SolanaWalletProviderProps): React.ReactElement {
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1/solana/rpc`;
    }
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
    if (customRpc) return customRpc;
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, []);

  // Phantom registers automatically via Wallet Standard; keep Solflare as fallback.
  const wallets = useMemo(() => [new SolflareWalletAdapter()], []);

  const handleWalletError = useCallback((error: WalletError) => {
    if (error.message?.toLowerCase().includes("rejected")) {
      return;
    }
    console.warn("[SolanaWallet]", error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={handleWalletError}>
        <WalletSessionGuard />
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
