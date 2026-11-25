"use client";

import React, { useEffect, useState } from "react";
import { Coins, CreditCard, Lock, QrCode, Sparkles } from "lucide-react";
import type {
  PaymentOrderEntity,
  ShopPaymentChannel,
  ShopPaymentMethod,
  TopupTierEntity,
} from "@/client/domain/shop/entity/shop_entity";
import { getService } from "@/core/di/container";
import { SHOP_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency } from "@/core/utils/formatters";
import { API_ROUTES } from "@/core/constants/api-routes";
import {
  Button,
  InputField,
  IntellioCard,
} from "@/client/presentation/components/ui";
import { UserFeedback } from "@/client/presentation/components/user";
import { SHOP_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";

const FALLBACK_TIERS: readonly TopupTierEntity[] = [
  { amountIdr: 5_000, feeIdr: 500, pointsAwarded: 4_500 },
  { amountIdr: 10_000, feeIdr: 500, pointsAwarded: 9_500 },
  { amountIdr: 15_000, feeIdr: 500, pointsAwarded: 14_500 },
  { amountIdr: 20_000, feeIdr: 500, pointsAwarded: 19_500 },
  { amountIdr: 30_000, feeIdr: 500, pointsAwarded: 29_500 },
  { amountIdr: 50_000, feeIdr: 500, pointsAwarded: 49_500 },
  { amountIdr: 100_000, feeIdr: 500, pointsAwarded: 99_500 },
  { amountIdr: 150_000, feeIdr: 500, pointsAwarded: 149_500 },
  { amountIdr: 200_000, feeIdr: 500, pointsAwarded: 199_500 },
];

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
  isGuest = false,
  buyerName,
  onBuyerNameChange,
  buyerEmail,
  onBuyerEmailChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentChannels,
  paymentChannel,
  onPaymentChannelChange,
  onOrderCreated,
}: ShopTopupSectionProps): React.ReactElement {
  const { t, locale } = useTranslator();
  const [tiers, setTiers] = useState<readonly TopupTierEntity[]>(FALLBACK_TIERS);
  const [selectedTier, setSelectedTier] = useState<TopupTierEntity>(FALLBACK_TIERS[0]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTiers = async () => {
      try {
        const shopUseCase = getService(SHOP_USECASE_TOKEN);
        const res = await shopUseCase.getTopupTiers();
        if (active && res.tiers && res.tiers.length > 0) {
          setTiers(res.tiers);
          setSelectedTier(res.tiers[0]);
        }
      } catch {
        // Fallback to static tiers
      }
    };
    void fetchTiers();
    return () => {
      active = false;
    };
  }, []);

  const handleCheckoutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGuest) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const shopUseCase = getService(SHOP_USECASE_TOKEN);
      const order = await shopUseCase.checkoutTopup({
        buyerName,
        buyerEmail,
        amountIdr: selectedTier.amountIdr,
        paymentMethod,
        paymentChannel,
      });
      onOrderCreated(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t(SHOP_TEXT_CONSTANT.CHECKOUT_ERROR);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id={SHOP_SEMANTIC_IDS.TOPUP_SECTION} className="space-y-6">
      {/* Top Banner: Point Balance & Notice */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <IntellioCard
          variant="elevated"
          padding="sm"
          className="flex flex-col justify-between gap-3 sm:col-span-7 bg-surface-elevated/70"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber/40 bg-amber/20 text-amber">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Saldo Nusa Point Anda
              </span>
              <span className="font-display text-2xl font-extrabold text-cream">
                {nusaPointBalance.toLocaleString("id-ID")}{" "}
                <span className="text-sm font-semibold text-amber-light">NP</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-subtle">
            {t(SHOP_TEXT_CONSTANT.TOPUP_FEE_NOTICE)} · Fee Rp 500 langsung dipotong dari total pembayaran.
          </p>
        </IntellioCard>

        <IntellioCard
          variant="flat"
          padding="sm"
          className="flex flex-col justify-center gap-1 sm:col-span-5 bg-surface-elevated/40 border-primary/20"
        >
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary-light">
            <Sparkles className="h-3.5 w-3.5" />
            Keuntungan Nusa Point
          </span>
          <p className="text-xs text-muted">
            Gunakan untuk diskon Booster Pack hingga 60%, minting custom card, dan berbagai fitur spesial game.
          </p>
        </IntellioCard>
      </div>

      {/* Guest Lock Callout */}
      {isGuest && (
        <IntellioCard
          variant="elevated"
          padding="md"
          className="border-amber/40 bg-amber/10 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber/40 bg-amber/20 text-amber">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-cream">
            Akun Terdaftar Diperlukan
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted">
            {t(SHOP_TEXT_CONSTANT.TOPUP_GUEST_WARNING)}
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              href={`${API_ROUTES.AUTH.GOOGLE}?lang=${encodeURIComponent(locale)}`}
              variant="amber"
              size="sm"
            >
              {t(SHOP_TEXT_CONSTANT.TOPUP_LOGIN_CTA)}
            </Button>
          </div>
        </IntellioCard>
      )}

      {/* Registered User Top Up Form */}
      {!isGuest && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Tiers Selection Grid */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-cream">
                {t(SHOP_TEXT_CONSTANT.TOPUP_SELECT_TIER)}
              </h3>
              <span className="text-xs text-subtle">
                9 Nominal Tersedia
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tiers.map((tier) => {
                const isSelected = selectedTier.amountIdr === tier.amountIdr;
                return (
                  <button
                    key={tier.amountIdr}
                    id={`${SHOP_SEMANTIC_IDS.TOPUP_TIER_CARD_PREFIX}${tier.amountIdr}`}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`group relative flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber bg-gradient-to-b from-amber-500/20 via-surface-elevated to-surface-elevated shadow-[0_0_24px_rgba(255,159,49,0.3)] ring-1 ring-amber/50"
                        : "border-border-base bg-surface-elevated/40 hover:border-border-strong hover:bg-surface-elevated/70"
                    }`}
                  >
                    <div className="w-full">
                      <span className="block font-display text-base font-bold text-cream">
                        {formatIdrCurrency(tier.amountIdr)}
                      </span>
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber/10 px-2 py-1">
                        <Coins className="h-3.5 w-3.5 text-amber" />
                        <span className="font-display text-xs font-extrabold text-amber-light">
                          +{tier.pointsAwarded.toLocaleString("id-ID")} NP
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex w-full items-center justify-between border-t border-white/5 pt-2 text-[11px] text-subtle">
                      <span>Fee Rp {tier.feeIdr}</span>
                      {isSelected && (
                        <span className="font-semibold text-amber">Dipilih</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout Details Form */}
          <div className="lg:col-span-5">
            <IntellioCard
              variant="elevated"
              padding="md"
              className="space-y-4 border-border-base bg-surface-elevated"
            >
              <h3 className="text-base font-bold text-cream">
                Rincian Pembayaran
              </h3>

              {/* Summary Table */}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Nominal Bayar</span>
                  <span className="font-semibold text-cream">
                    {formatIdrCurrency(selectedTier.amountIdr)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Biaya Layanan</span>
                  <span className="font-semibold text-subtle">
                    -Rp {selectedTier.feeIdr}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="font-bold text-cream">Nusa Point Diterima</span>
                  <span className="font-display font-bold text-amber-light text-sm">
                    {selectedTier.pointsAwarded.toLocaleString("id-ID")} NP
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 font-display text-sm font-bold text-cream">
                  <span>Total Tagihan</span>
                  <span className="text-base text-cream">
                    {formatIdrCurrency(selectedTier.amountIdr)}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-3">
                <InputField
                  id="topup-buyer-name"
                  label={t(SHOP_TEXT_CONSTANT.BUYER_NAME_LABEL)}
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => onBuyerNameChange(e.target.value)}
                  placeholder={t(SHOP_TEXT_CONSTANT.BUYER_NAME_PLACEHOLDER)}
                  sizeVariant="sm"
                />

                <InputField
                  id="topup-buyer-email"
                  label={t(SHOP_TEXT_CONSTANT.BUYER_EMAIL_LABEL)}
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => onBuyerEmailChange(e.target.value)}
                  placeholder={t(SHOP_TEXT_CONSTANT.BUYER_EMAIL_PLACEHOLDER)}
                  sizeVariant="sm"
                />

                {/* Method Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-cream">
                    {t(SHOP_TEXT_CONSTANT.PAYMENT_METHOD_LABEL)}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      id="topup-payment-qris-btn"
                      type="button"
                      onClick={() => onPaymentMethodChange("QRIS")}
                      variant={paymentMethod === "QRIS" ? "primary" : "secondary"}
                      size="sm"
                      leftIcon={<QrCode className="h-4 w-4" />}
                    >
                      {t(SHOP_TEXT_CONSTANT.PAYMENT_QRIS_LABEL)}
                    </Button>
                    <Button
                      id="topup-payment-va-btn"
                      type="button"
                      onClick={() => onPaymentMethodChange("VIRTUAL_ACCOUNT")}
                      variant={paymentMethod === "VIRTUAL_ACCOUNT" ? "primary" : "secondary"}
                      size="sm"
                      leftIcon={<CreditCard className="h-4 w-4" />}
                    >
                      {t(SHOP_TEXT_CONSTANT.PAYMENT_VA_LABEL)}
                    </Button>
                  </div>
                </div>

                {/* Virtual Account Bank Dropdown */}
                {paymentMethod === "VIRTUAL_ACCOUNT" && (
                  <div className="space-y-2">
                    <label htmlFor="topup-va-channel" className="text-xs font-semibold text-cream">
                      Bank Virtual Account
                    </label>
                    <select
                      id="topup-va-channel"
                      value={paymentChannel}
                      onChange={(event) => onPaymentChannelChange(event.target.value)}
                      disabled={submitting || paymentChannels.filter((c) => c.paymentMethod === "VIRTUAL_ACCOUNT").length === 0}
                      className="min-h-11 w-full rounded-xl border border-border-base bg-surface-base px-3 text-sm text-cream outline-none transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {paymentChannels
                        .filter((c) => c.paymentMethod === "VIRTUAL_ACCOUNT")
                        .map((channel) => (
                          <option key={channel.code} value={channel.code}>
                            {channel.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {paymentChannels.length === 0 && (
                  <p role="status" className="rounded-xl border border-amber/20 bg-amber/10 p-3 text-xs text-amber-light">
                    Kanal pembayaran belum tersedia. Coba muat ulang halaman.
                  </p>
                )}

                {errorMsg && (
                  <UserFeedback
                    kind="error"
                    title="Gagal Memproses"
                    description={errorMsg}
                  />
                )}

                <Button
                  id={SHOP_SEMANTIC_IDS.TOPUP_SUBMIT_BTN}
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting || paymentChannels.length === 0 || !paymentChannel}
                  className="w-full mt-2"
                >
                  {submitting
                    ? t(SHOP_TEXT_CONSTANT.PROCESSING_CHECKOUT)
                    : `${t(SHOP_TEXT_CONSTANT.TOPUP_PAY_NOW)} (${formatIdrCurrency(selectedTier.amountIdr)})`}
                </Button>
              </form>
            </IntellioCard>
          </div>
        </div>
      )}
    </div>
  );
}
