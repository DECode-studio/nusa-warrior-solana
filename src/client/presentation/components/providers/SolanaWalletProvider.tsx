"use client";

import React, { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

export interface SolanaWalletProviderProps {
  readonly children: React.ReactNode;
}

export function SolanaWalletProvider({
  children,
}: SolanaWalletProviderProps): React.ReactElement {
  const endpoint = useMemo(() => {
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
    if (customRpc) return customRpc;
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
