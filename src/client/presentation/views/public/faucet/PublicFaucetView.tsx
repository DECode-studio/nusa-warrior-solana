"use client";

import React from "react";
import {
  ArrowLeftRight,
  Coins,
  Droplets,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useTranslator } from "@/core/translator";
import { PublicPageLayout } from "@/client/presentation/components/layout/PublicPageLayout";
import {
  Badge,
  Button,
  InputField,
  IntellioCard,
  PublicContainer,
  SectionHeading,
} from "@/client/presentation/components/ui";
import { UserFeedback } from "@/client/presentation/components/user";
import { FAUCET_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { POOL_OPTIONS, useFaucet } from "./hooks/useFaucet";

export function PublicFaucetView(): React.ReactElement {
  const { locale } = useTranslator();
  const {
    mounted,
    connected,
    walletAddress,
    openWalletModal,
    disconnectWallet,
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
  } = useFaucet();

  const isEn = locale === "en";

  return (
    <PublicPageLayout locale={locale}>
      <main id={FAUCET_SEMANTIC_IDS.ROOT} className="nc-page nc-public-main">
        <PublicContainer size="wide" className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              as="h1"
              size="page"
              eyebrow={
                <Badge
                  variant="amber"
                  size="md"
                  shape="pill"
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  Solana Devnet POC · Token-2022
                </Badge>
              }
              title="Nusa Token Faucet & AMM DEX"
              description={
                isEn
                  ? "Claim POC tokens (IDRC & USDC) and swap across 3 pools (IDRC / NUSA, USDC / NUSA, IDRC / USDC) using constant-product AMM (x · y = k)."
                  : "Klaim token POC (IDRC & USDC) dan lakukan swap 3 pair (IDRC / NUSA, USDC / NUSA, IDRC / USDC) dengan mekanisme AMM (x · y = k)."
              }
            />
            <div className="shrink-0">
              {mounted && connected && walletAddress ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    leftIcon={<Wallet className="h-4 w-4 text-emerald-light" />}
                    onClick={openWalletModal}
                  >
                    {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={disconnectWallet}
                  >
                    {isEn ? "Disconnect" : "Putuskan"}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  leftIcon={<Wallet className="h-4 w-4" />}
                  onClick={openWalletModal}
                >
                  {isEn ? "Select Wallet" : "Pilih Dompet"}
                </Button>
              )}
            </div>
          </div>

          {/* Wallet Token Balances */}
          <IntellioCard variant="glass" padding="md" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-display text-base font-bold text-cream">
                <Coins className="h-4 w-4 text-amber-light" />
                <span>{isEn ? "On-Chain Wallet Balances" : "Saldo Dompet On-Chain"}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void refreshBalances();
                  void refreshPools();
                }}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <IntellioCard variant="default" padding="sm">
                <div className="nc-type-caption text-subtle">Nusa Token (NUSA)</div>
                <div className="mt-1 font-display text-2xl font-bold text-amber-light">
                  {balances
                    ? balances.nusa.toLocaleString("id-ID", { maximumFractionDigits: 2 })
                    : "—"}
                </div>
              </IntellioCard>

              <IntellioCard variant="default" padding="sm">
                <div className="nc-type-caption text-subtle">IDRC (POC)</div>
                <div className="mt-1 font-display text-2xl font-bold text-emerald-light">
                  {balances
                    ? balances.idrc.toLocaleString("id-ID", { maximumFractionDigits: 2 })
                    : "—"}
                </div>
              </IntellioCard>

              <IntellioCard variant="default" padding="sm">
                <div className="nc-type-caption text-subtle">USDC (POC)</div>
                <div className="mt-1 font-display text-2xl font-bold text-primary-light">
                  {balances
                    ? balances.usdc.toLocaleString("id-ID", { maximumFractionDigits: 4 })
                    : "—"}
                </div>
              </IntellioCard>

              <IntellioCard variant="default" padding="sm" className="border-amber/30 bg-amber/5">
                <div className="nc-type-caption text-subtle">Unclaimed Reward NUSA</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-display text-2xl font-bold text-cream">
                    {balances ? balances.unclaimedNusa.toLocaleString("id-ID") : "—"}
                  </span>
                  {balances && balances.unclaimedNusa > 0 && (
                    <Button
                      id={FAUCET_SEMANTIC_IDS.CLAIM_NUSA_BTN}
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={busyAction !== null}
                      onClick={() => void handleClaimUnclaimedNusa()}
                    >
                      {busyAction === "claim-nusa" ? "Claiming..." : "Claim"}
                    </Button>
                  )}
                </div>
              </IntellioCard>
            </div>
          </IntellioCard>

          {statusMessage && (
            <IntellioCard
              variant="default"
              padding="sm"
              className="space-y-2 border-emerald/30 bg-emerald/10"
            >
              <div className="flex items-center gap-2">
                <Badge variant="emerald" size="sm">
                  {isEn ? "Confirmed" : "Berhasil"}
                </Badge>
                <span className="text-sm font-medium text-emerald-light">
                  {statusMessage}
                </span>
              </div>
              {lastTxSig && (
                <a
                  href={`https://explorer.solana.com/tx/${lastTxSig}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-light underline hover:text-white"
                >
                  {isEn ? "View on Solana Explorer" : "Lihat transaksi di Solana Explorer"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </IntellioCard>
          )}

          {errorMessage && (
            <UserFeedback
              kind="error"
              title={isEn ? "Transaction Failed" : "Gagal Memproses"}
              description={errorMessage}
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Devnet Faucet */}
            <IntellioCard variant="glass" padding="md" className="space-y-5 lg:col-span-5">
              <div className="flex items-center gap-2 font-display text-lg font-bold text-cream">
                <Droplets className="h-5 w-5 text-primary-light" />
                <span>Devnet Faucet (POC Tokens)</span>
              </div>
              <p className="nc-type-body-sm text-muted">
                {isEn
                  ? "Mint POC IDRC or USDC tokens to your connected wallet. Devnet SOL gas fee is paid by your wallet."
                  : "Mint token IDRC atau USDC POC ke dompet Anda untuk menguji swap AMM DEX. Gas fee Devnet SOL ditanggung oleh wallet Anda."}
              </p>

              <IntellioCard variant="default" padding="sm" className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <InputField
                      label="Klaim IDRC (Max 1.000.000 / req)"
                      type="number"
                      min={1}
                      max={1000000}
                      value={faucetIdrcAmount}
                      onChange={(e) => setFaucetIdrcAmount(e.target.value)}
                      sizeVariant="sm"
                    />
                  </div>
                  <Button
                    id={FAUCET_SEMANTIC_IDS.FAUCET_IDRC_BTN}
                    type="button"
                    variant="emerald"
                    size="sm"
                    disabled={!connected || busyAction !== null}
                    onClick={() => void handleFaucet("IDRC")}
                  >
                    {busyAction === "faucet-IDRC" ? "Minting..." : "Mint IDRC"}
                  </Button>
                </div>
              </IntellioCard>

              <IntellioCard variant="default" padding="sm" className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <InputField
                      label="Klaim USDC (Max 100 / req)"
                      type="number"
                      min={0.1}
                      max={100}
                      step="0.1"
                      value={faucetUsdcAmount}
                      onChange={(e) => setFaucetUsdcAmount(e.target.value)}
                      sizeVariant="sm"
                    />
                  </div>
                  <Button
                    id={FAUCET_SEMANTIC_IDS.FAUCET_USDC_BTN}
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!connected || busyAction !== null}
                    onClick={() => void handleFaucet("USDC")}
                  >
                    {busyAction === "faucet-USDC" ? "Minting..." : "Mint USDC"}
                  </Button>
                </div>
              </IntellioCard>
            </IntellioCard>

            {/* 3-Pair AMM DEX */}
            <IntellioCard variant="glass" padding="md" className="space-y-5 lg:col-span-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display text-lg font-bold text-cream">
                  <ArrowLeftRight className="h-5 w-5 text-amber-light" />
                  <span>AMM DEX Swap (x · y = k)</span>
                </div>
                <Badge variant="neutral" size="sm">
                  Fee Pool 0.3%
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {POOL_OPTIONS.map((opt) => (
                  <Button
                    key={opt.poolId}
                    type="button"
                    variant={selectedPoolId === opt.poolId ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleSelectPool(opt.poolId)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              <IntellioCard variant="default" padding="sm" className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="nc-type-caption font-semibold text-cream">
                    {isEn ? `You Pay (${inputSymbol})` : `Anda Bayar (${inputSymbol})`}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleFlipDirection}
                    leftIcon={<ArrowLeftRight className="h-3.5 w-3.5" />}
                  >
                    {isEn ? "Flip" : "Balik Arah"}
                  </Button>
                </div>

                <InputField
                  type="number"
                  min={0}
                  step="any"
                  value={swapInputAmount}
                  onChange={(e) => setSwapInputAmount(e.target.value)}
                  placeholder="0.00"
                  sizeVariant="md"
                />

                <div className="flex items-center justify-between border-t border-border-base pt-3 text-xs">
                  <span className="text-subtle">
                    {isEn
                      ? `Estimated Receive (${outputSymbol})`
                      : `Estimasi Diterima (${outputSymbol})`}
                  </span>
                  <span className="font-display text-lg font-bold text-emerald-light">
                    {quoting
                      ? "..."
                      : quote
                        ? `${quote.outputUiAmount.toLocaleString("id-ID", { maximumFractionDigits: 6 })} ${quote.outputSymbol}`
                        : "—"}
                  </span>
                </div>

                {quote && (
                  <div className="space-y-1.5 rounded-xl bg-surface-elevated/40 p-3 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>{isEn ? "Execution Rate" : "Kurs Eksekusi"}</span>
                      <span className="font-medium text-cream">
                        1 {quote.inputSymbol} ={" "}
                        {quote.executionPrice.toLocaleString("id-ID", {
                          maximumFractionDigits: 6,
                        })}{" "}
                        {quote.outputSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Impact</span>
                      <span className="font-medium text-cream">
                        {quote.priceImpactPct}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {isEn
                          ? "Minimum Received (1% Slippage)"
                          : "Minimum Diterima (Slippage 1%)"}
                      </span>
                      <span className="font-medium text-cream">
                        {quote.minimumOutputUiAmount.toLocaleString("id-ID", {
                          maximumFractionDigits: 6,
                        })}{" "}
                        {quote.outputSymbol}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  id={FAUCET_SEMANTIC_IDS.SWAP_SUBMIT_BTN}
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full font-bold"
                  disabled={!connected || !quote || busyAction !== null}
                  onClick={() => void handleSwap()}
                >
                  {busyAction === "swap"
                    ? "Memproses Swap On-Chain..."
                    : `Swap ${inputSymbol} -> ${outputSymbol}`}
                </Button>
              </IntellioCard>

              <div className="space-y-2">
                <div className="nc-type-caption font-semibold text-subtle">
                  {isEn ? "On-Chain Pool Liquidity" : "Likuiditas Pool On-Chain"}{" "}
                  {loadingPools ? "(...)" : ""}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {pools.map((pool) => (
                    <IntellioCard key={pool.poolId} variant="default" padding="sm">
                      <div className="font-display text-xs font-bold text-cream">
                        {pool.tokenA} / {pool.tokenB}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {pool.reserveA.toLocaleString("id-ID", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {pool.tokenA}
                      </div>
                      <div className="text-xs text-muted">
                        {pool.reserveB.toLocaleString("id-ID", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {pool.tokenB}
                      </div>
                    </IntellioCard>
                  ))}
                </div>
              </div>
            </IntellioCard>
          </div>
        </PublicContainer>
      </main>
    </PublicPageLayout>
  );
}
