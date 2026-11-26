"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getService } from "@/core/di/container";
import { SOLANA_TOKEN_USECASE_TOKEN } from "@/core/di/tokens";
import { sendBase64SolanaTx } from "@/core/utils/solana-tx-client";
import type {
  AmmPoolStateEntity,
  AmmQuoteEntity,
  PoolId,
  TokenSymbol,
  WalletTokenBalancesEntity,
} from "@/client/domain/solana-token/entity/solana_token_entity";

export type { TokenSymbol, PoolId };
export type WalletBalances = WalletTokenBalancesEntity;
export type AmmPoolState = AmmPoolStateEntity;
export type AmmQuote = AmmQuoteEntity;

export const POOL_OPTIONS: ReadonlyArray<{
  poolId: PoolId;
  label: string;
  defaultA: TokenSymbol;
  defaultB: TokenSymbol;
}> = [
  { poolId: "IDRC_NUSA", label: "IDRC / NUSA", defaultA: "IDRC", defaultB: "NUSA" },
  { poolId: "USDC_NUSA", label: "USDC / NUSA", defaultA: "USDC", defaultB: "NUSA" },
  { poolId: "IDRC_USDC", label: "IDRC / USDC", defaultA: "IDRC", defaultB: "USDC" },
];

export function useFaucet() {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction, sendTransaction, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const solanaTokenUseCase = useMemo(
    () => getService(SOLANA_TOKEN_USECASE_TOKEN),
    []
  );

  const [balances, setBalances] = useState<WalletTokenBalancesEntity | null>(null);
  const [pools, setPools] = useState<AmmPoolStateEntity[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);

  const [faucetIdrcAmount, setFaucetIdrcAmount] = useState("100000");
  const [faucetUsdcAmount, setFaucetUsdcAmount] = useState("10");

  const [selectedPoolId, setSelectedPoolId] = useState<PoolId>("IDRC_NUSA");
  const [inputSymbol, setInputSymbol] = useState<TokenSymbol>("IDRC");
  const [swapInputAmount, setSwapInputAmount] = useState("50000");
  const [quote, setQuote] = useState<AmmQuoteEntity | null>(null);
  const [quoting, setQuoting] = useState(false);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastTxSig, setLastTxSig] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58() ?? null;

  const refreshPools = useCallback(async () => {
    setLoadingPools(true);
    try {
      const list = await solanaTokenUseCase.getDexPools();
      setPools(list);
    } catch {
      // Ignore transient load error
    } finally {
      setLoadingPools(false);
    }
  }, [solanaTokenUseCase]);

  const refreshBalances = useCallback(async () => {
    if (!walletAddress) {
      setBalances(null);
      return;
    }
    try {
      const res = await solanaTokenUseCase.getWalletBalances(walletAddress);
      setBalances(res);
    } catch {
      // Ignore transient balance error
    }
  }, [solanaTokenUseCase, walletAddress]);

  useEffect(() => {
    void refreshPools();
  }, [refreshPools]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  const activePoolDef =
    POOL_OPTIONS.find((p) => p.poolId === selectedPoolId) ?? POOL_OPTIONS[0];
  const outputSymbol: TokenSymbol =
    inputSymbol === activePoolDef.defaultA
      ? activePoolDef.defaultB
      : activePoolDef.defaultA;

  const handleSelectPool = (poolId: PoolId) => {
    setSelectedPoolId(poolId);
    const found = POOL_OPTIONS.find((p) => p.poolId === poolId);
    if (found) {
      setInputSymbol(found.defaultA);
      setSwapInputAmount(found.defaultA === "USDC" ? "5" : "50000");
    }
  };

  const handleFlipDirection = () => {
    setInputSymbol(outputSymbol);
  };

  useEffect(() => {
    const num = Number(swapInputAmount);
    if (!Number.isFinite(num) || num <= 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setQuoting(true);
      try {
        const res = await solanaTokenUseCase.quoteDexSwap({
          poolId: selectedPoolId,
          inputSymbol,
          inputUiAmount: num,
          slippageBps: 100,
        });
        if (!cancelled) setQuote(res);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [solanaTokenUseCase, selectedPoolId, inputSymbol, swapInputAmount]);

  const handleFaucet = async (symbol: "IDRC" | "USDC") => {
    if (!connected || !walletAddress) {
      setErrorMessage("Hubungkan dompet Solana (Phantom/Solflare) terlebih dahulu.");
      return;
    }
    const rawAmt = Number(symbol === "IDRC" ? faucetIdrcAmount : faucetUsdcAmount);
    if (!Number.isFinite(rawAmt) || rawAmt <= 0) {
      setErrorMessage("Nominal faucet tidak valid.");
      return;
    }

    setBusyAction(`faucet-${symbol}`);
    setErrorMessage(null);
    setStatusMessage(null);
    setLastTxSig(null);

    try {
      const prepared = await solanaTokenUseCase.prepareTokenFaucet({
        walletAddress,
        symbol,
        amount: rawAmt,
      });

      const sig = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });

      setLastTxSig(sig);
      setStatusMessage(
        `Berhasil mint ${prepared.amount.toLocaleString("id-ID")} ${symbol} ke dompet Anda.`
      );
      await refreshBalances();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : `Gagal klaim faucet ${symbol}.`
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleClaimUnclaimedNusa = async () => {
    if (!connected || !walletAddress) {
      setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
      return;
    }
    setBusyAction("claim-nusa");
    setErrorMessage(null);
    setStatusMessage(null);
    setLastTxSig(null);

    try {
      const prepared = await solanaTokenUseCase.prepareClaimNusa();

      const sig = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });

      await solanaTokenUseCase.confirmClaimNusa({
        claimId: prepared.claimId,
        amount: prepared.amount,
        txSignature: sig,
      });

      setLastTxSig(sig);
      setStatusMessage(
        `Berhasil claim ${prepared.amount.toLocaleString("id-ID")} NUSA ke dompet Anda.`
      );
      await refreshBalances();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal melakukan claim NUSA."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleSwap = async () => {
    if (!connected || !walletAddress) {
      setErrorMessage("Hubungkan dompet Solana terlebih dahulu untuk melakukan swap.");
      return;
    }
    const num = Number(swapInputAmount);
    if (!Number.isFinite(num) || num <= 0) {
      setErrorMessage("Masukkan nominal swap yang valid.");
      return;
    }

    setBusyAction("swap");
    setErrorMessage(null);
    setStatusMessage(null);
    setLastTxSig(null);

    try {
      const prepared = await solanaTokenUseCase.prepareDexSwap({
        traderWallet: walletAddress,
        poolId: selectedPoolId,
        inputSymbol,
        inputUiAmount: num,
        slippageBps: 100,
      });

      const sig = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });

      setLastTxSig(sig);
      setStatusMessage(
        `Swap berhasil: ${prepared.quote.inputUiAmount.toLocaleString("id-ID")} ${prepared.quote.inputSymbol} -> ${prepared.quote.outputUiAmount.toLocaleString("id-ID", { maximumFractionDigits: 6 })} ${prepared.quote.outputSymbol}`
      );
      await Promise.all([refreshBalances(), refreshPools()]);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal mengeksekusi swap AMM."
      );
    } finally {
      setBusyAction(null);
    }
  };

  return {
    mounted,
    connected,
    walletAddress,
    openWalletModal: () => setWalletModalVisible(true),
    disconnectWallet: () => void disconnect(),
    balances,
    pools,
    loadingPools,
    faucetIdrcAmount,
    setFaucetIdrcAmount,
    faucetUsdcAmount,
    setFaucetUsdcAmount,
    selectedPoolId,
    inputSymbol,
    outputSymbol,
    swapInputAmount,
    setSwapInputAmount,
    quote,
    quoting,
    busyAction,
    statusMessage,
    lastTxSig,
    errorMessage,
    refreshPools,
    refreshBalances,
    handleSelectPool,
    handleFlipDirection,
    handleFaucet,
    handleClaimUnclaimedNusa,
    handleSwap,
  };
}
