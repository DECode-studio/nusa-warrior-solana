"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeftRight, Coins, ExternalLink, Sparkles } from "lucide-react";
import type {
  PaymentOrderEntity,
  ShopPaymentChannel,
  ShopPaymentMethod,
} from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { ROUTES } from "@/core/constants/routes";
import { Button, InputField, IntellioCard } from "@/client/presentation/components/ui";
import { UserFeedback } from "@/client/presentation/components/user";
import { useShopTopup } from "../hooks/useShopTopup";

export interface ShopTopupSectionProps {
  readonly nusaPointBalance: number;
  readonly isGuest?: boolean;
  readonly buyerName: string;
  readonly onBuyerNameChange: (val: string) => void;
  readonly buyerEmail: string;
  readonly onBuyerEmailChange: (val: string) => void;
  readonly paymentMethod: ShopPaymentMethod;
  readonly onPaymentMethodChange: (val: ShopPaymentMethod) => void;
  readonly paymentChannels: ShopPaymentChannel[];
  readonly paymentChannel: string;
  readonly onPaymentChannelChange: (val: string) => void;
  readonly onOrderCreated: (order: PaymentOrderEntity) => void;
}

export function ShopTopupSection({
  nusaPointBalance,
}: ShopTopupSectionProps): React.ReactElement {
  const { locale } = useTranslator();
  const {
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
  } = useShopTopup(nusaPointBalance);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <IntellioCard variant="glass" padding="md" className="space-y-4 lg:col-span-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-cream">
            <ArrowLeftRight className="h-5 w-5 text-amber-light" />
            <span>Top Up Nusa Token (NUSA) via AMM DEX</span>
          </div>
          <Link
            href={ROUTES.FAUCET(locale)}
            className="text-xs font-semibold text-amber-light underline hover:text-white"
          >
            Buka Faucet POC (IDRC/USDC)
          </Link>
        </div>

        <p className="text-xs text-muted">
          Tukar IDRC atau USDC langsung menjadi NUSA secara on-chain menggunakan pool AMM x * y = k.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {(["IDRC", "USDC"] as const).map((sym) => (
            <Button
              key={sym}
              type="button"
              variant={inputSymbol === sym ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setInputSymbol(sym);
                setInputAmount(sym === "IDRC" ? "50000" : "5");
              }}
            >
              {sym} (Saldo:{" "}
              {(sym === "IDRC" ? idrcBalance : usdcBalance).toLocaleString("id-ID", {
                maximumFractionDigits: 4,
              })}
              )
            </Button>
          ))}
        </div>

        <IntellioCard variant="default" padding="sm" className="space-y-3">
          <InputField
            label={`Jumlah ${inputSymbol}`}
            type="number"
            min={0}
            step="any"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            sizeVariant="md"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-subtle">Estimasi NUSA diterima</span>
            <span className="font-display text-base font-bold text-emerald-light">
              {quoteOut !== null
                ? `${quoteOut.toLocaleString("id-ID", { maximumFractionDigits: 4 })} NUSA`
                : "—"}
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full font-bold"
            disabled={!connected || submitting || quoteOut === null}
            onClick={() => void handleSwapTopup()}
          >
            {submitting
              ? "Memproses Swap On-Chain..."
              : `Swap ${inputSymbol} -> NUSA`}
          </Button>
        </IntellioCard>

        {statusMsg && (
          <div className="rounded-xl border border-emerald/30 bg-emerald/10 p-3 text-xs text-emerald-light">
            <div>{statusMsg}</div>
            {txSig && (
              <a
                href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 underline"
              >
                Lihat di Solana Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {errorMsg && (
          <UserFeedback kind="error" title="Gagal" description={errorMsg} />
        )}
      </IntellioCard>

      <IntellioCard variant="glass" padding="md" className="space-y-4 lg:col-span-5">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-cream">
          <Coins className="h-5 w-5 text-amber-light" />
          <span>Saldo & Claim Reward NUSA</span>
        </div>

        <div className="rounded-xl border border-border-base bg-surface-base/60 p-4">
          <div className="text-xs text-subtle">Saldo On-Chain Anda</div>
          <div className="mt-1 font-display text-2xl font-bold text-amber-light">
            {onChainNusa.toLocaleString("id-ID", { maximumFractionDigits: 2 })} NUSA
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-amber/20 bg-amber/5 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-light">
            <Sparkles className="h-4 w-4" />
            <span>Unclaimed Reward (Battle / League / Story)</span>
          </div>
          <div className="font-display text-2xl font-bold text-cream">
            {unclaimedNusa.toLocaleString("id-ID")} NUSA
          </div>
          <p className="text-[11px] text-muted">
            Gas fee minting ditanggung oleh wallet player saat melakukan Claim.
          </p>
          <Button
            type="button"
            variant="emerald"
            size="md"
            className="w-full font-bold"
            disabled={!connected || unclaimedNusa <= 0 || claiming}
            onClick={() => void handleClaimUnclaimed()}
          >
            {claiming ? "Mengklaim..." : "Claim NUSA ke Dompet"}
          </Button>
        </div>
      </IntellioCard>
    </div>
  );
}
