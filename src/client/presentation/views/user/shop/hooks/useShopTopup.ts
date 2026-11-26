"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getService } from "@/core/di/container";
import { SOLANA_TOKEN_USECASE_TOKEN } from "@/core/di/tokens";
import { sendBase64SolanaTx } from "@/core/utils/solana-tx-client";

export function useShopTopup(initialNusaBalance: number) {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction, sendTransaction } = useWallet();
  const solanaTokenUseCase = useMemo(
    () => getService(SOLANA_TOKEN_USECASE_TOKEN),
    []
  );

  const [inputSymbol, setInputSymbol] = useState<"IDRC" | "USDC">("IDRC");
  const [inputAmount, setInputAmount] = useState("50000");
  const [unclaimedNusa, setUnclaimedNusa] = useState(0);
  const [onChainNusa, setOnChainNusa] = useState(initialNusaBalance);
  const [idrcBalance, setIdrcBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [quoteOut, setQuoteOut] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58() ?? null;
  const poolId = inputSymbol === "IDRC" ? "IDRC_NUSA" : "USDC_NUSA";

  const refreshBalances = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const res = await solanaTokenUseCase.getWalletBalances(walletAddress);
      setOnChainNusa(res.nusa);
      setIdrcBalance(res.idrc);
      setUsdcBalance(res.usdc);
      setUnclaimedNusa(res.unclaimedNusa);
    } catch {
      // Ignore
    }
  }, [solanaTokenUseCase, walletAddress]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  useEffect(() => {
    const num = Number(inputAmount);
    if (!Number.isFinite(num) || num <= 0) {
      setQuoteOut(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await solanaTokenUseCase.quoteDexSwap({
          poolId,
          inputSymbol,
          inputUiAmount: num,
          slippageBps: 100,
        });
        if (!cancelled) setQuoteOut(res.outputUiAmount);
      } catch {
        if (!cancelled) setQuoteOut(null);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [solanaTokenUseCase, poolId, inputSymbol, inputAmount]);

  const handleSwapTopup = async () => {
    if (!connected || !walletAddress) {
      setErrorMsg("Hubungkan dompet Solana (Phantom) terlebih dahulu.");
      return;
    }
    const num = Number(inputAmount);
    if (!Number.isFinite(num) || num <= 0) {
      setErrorMsg("Masukkan nominal top-up yang valid.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    setTxSig(null);
    try {
      const prepared = await solanaTokenUseCase.prepareDexSwap({
        traderWallet: walletAddress,
        poolId,
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
      setTxSig(sig);
      setStatusMsg(`Top Up NUSA via DEX ${inputSymbol}/NUSA berhasil!`);
      await refreshBalances();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal melakukan swap Top Up NUSA."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimUnclaimed = async () => {
    if (!connected || !walletAddress) {
      setErrorMsg("Hubungkan dompet Solana (Phantom) terlebih dahulu.");
      return;
    }
    setClaiming(true);
    setErrorMsg(null);
    setStatusMsg(null);
    setTxSig(null);
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
      setTxSig(sig);
      setStatusMsg(
        `Berhasil claim ${prepared.amount.toLocaleString("id-ID")} NUSA ke dompet Anda!`
      );
      await refreshBalances();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengklaim reward NUSA."
      );
    } finally {
      setClaiming(false);
    }
  };

  return {
    connected,
    inputSymbol,
    setInputSymbol,
    inputAmount,
    setInputAmount,
    unclaimedNusa,
    onChainNusa,
    idrcBalance,
    usdcBalance,
    quoteOut,
    submitting,
    claiming,
    statusMsg,
    txSig,
    errorMsg,
    handleSwapTopup,
    handleClaimUnclaimed,
  };
}
