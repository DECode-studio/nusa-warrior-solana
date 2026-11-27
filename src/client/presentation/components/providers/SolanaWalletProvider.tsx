"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { WalletAdapterNetwork, type WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { type ConnectionConfig, clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { DEFAULT_LOCALE, isValidLocale } from "@/core/constants/routes";
import {
  clearAuthRefreshCache,
  runWithAuthMutationLock,
} from "@/core/http-client/auth-refresh";

interface AuthMeSessionData {
  role?: string;
  walletAddress?: string | null;
}

function WalletSessionGuard(): null {
  const pathname = usePathname();
  const { connected, connecting, publicKey } = useWallet();
  const sessionWalletRef = useRef<string | null>(null);
  const wasConnectedRef = useRef(false);
  const loggingOutRef = useRef(false);

  const isAuthRoute = Boolean(
    pathname?.includes("/login") || pathname?.includes("/sign-in")
  );
  const isUserConsole = Boolean(pathname?.includes("/user"));

  useEffect(() => {
    if (isAuthRoute || !isUserConsole) {
      sessionWalletRef.current = null;
      wasConnectedRef.current = false;
      loggingOutRef.current = false;
      return;
    }

    let active = true;
    fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: AuthMeSessionData } | null) => {
        if (!active) return;
        sessionWalletRef.current =
          json?.data?.role === "PLAYER" ? (json.data.walletAddress ?? null) : null;
      })
      .catch(() => {
        // Ignore transient network errors during session probe
      });
    return () => {
      active = false;
    };
  }, [isAuthRoute, isUserConsole]);

  useEffect(() => {
    if (connecting || isAuthRoute || !isUserConsole) return;

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
      void runWithAuthMutationLock(async () => {
        try {
          const meRes = await fetch("/api/v1/auth/me", {
            credentials: "include",
            cache: "no-store",
          });
          const meJson = meRes.ok
            ? ((await meRes.json()) as { data?: AuthMeSessionData | null })
            : null;
          const activeUser = meJson?.data ?? null;
          const isStillMatchingPlayer =
            activeUser?.role === "PLAYER" &&
            activeUser.walletAddress === sessionWallet;

          if (isStillMatchingPlayer) {
            await fetch("/api/v1/auth/logout", {
              method: "POST",
              credentials: "include",
              cache: "no-store",
            });
            clearAuthRefreshCache();
          } else if (activeUser && activeUser.role !== "PLAYER") {
            return false;
          }
          return true;
        } catch {
          return true;
        }
      }).then((shouldRedirect) => {
        if (!shouldRedirect) {
          loggingOutRef.current = false;
          return;
        }
        if (!window.location.pathname.includes("/login")) {
          const pathLocale = window.location.pathname.split("/")[1] ?? "";
          const locale = isValidLocale(pathLocale) ? pathLocale : DEFAULT_LOCALE;
          window.location.assign(`/${locale}/login?reason=wallet_disconnected`);
        }
      });
    }
  }, [connected, connecting, isAuthRoute, isUserConsole, publicKey]);

  return null;
}

export interface SolanaWalletProviderProps {
  readonly children: React.ReactNode;
}

export function SolanaWalletProvider({
  children,
}: SolanaWalletProviderProps): React.ReactElement {
  const endpoint = useMemo(() => {
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.trim().toLowerCase() || "devnet";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/v1/solana/rpc?cluster=${encodeURIComponent(network)}`;
    }
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
    if (customRpc) return customRpc;
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, []);

  // Disable @solana/web3.js internal 429 retry console.error spam; rate-limit backoff is handled cleanly.
  const connectionConfig = useMemo<ConnectionConfig>(
    () => ({
      commitment: "confirmed",
      disableRetryOnRateLimit: true,
    }),
    []
  );

  // Phantom, Solflare, Backpack, etc. auto-register via Wallet Standard without duplicate adapter warnings.
  const wallets = useMemo(() => [], []);

  const handleWalletError = useCallback((error: WalletError) => {
    if (error.message?.toLowerCase().includes("rejected")) {
      return;
    }
    console.warn("[SolanaWallet]", error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect onError={handleWalletError}>
        <WalletSessionGuard />
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
