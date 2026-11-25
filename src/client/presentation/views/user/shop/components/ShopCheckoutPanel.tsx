"use client";

import React from "react";
import { CreditCard, Gift, QrCode, ShoppingBag, Sparkles } from "lucide-react";
import type { ShopPaymentChannel, ShopPaymentMethod, StarterPackEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency } from "@/core/utils/formatters";
import { Button, InputField, IntellioCard } from "@/client/presentation/components/ui";
import { UserFeedback } from "@/client/presentation/components/user";
import { SHOP_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";

export interface ShopCheckoutPanelProps {
  readonly selectedPack: StarterPackEntity | null;
  readonly nusaPointBalance: number;
  readonly pointsToUse: number;
  readonly onPointsToUseChange: (value: number) => void;
  readonly buyerName: string;
  readonly onBuyerNameChange: (val: string) => void;
  readonly buyerEmail: string;
  readonly onBuyerEmailChange: (val: string) => void;
  readonly paymentMethod: ShopPaymentMethod;
  readonly onPaymentMethodChange: (val: ShopPaymentMethod) => void;
  readonly paymentChannels: ShopPaymentChannel[];
  readonly paymentChannel: string;
  readonly onPaymentChannelChange: (val: string) => void;
  readonly processing: boolean;
  readonly errorMsg: string | null;
  readonly onClaimFreeStarter?: () => Promise<void>;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  readonly onNavigateToTopup?: () => void;
}

export function ShopCheckoutPanel({
  selectedPack,
  nusaPointBalance,
  pointsToUse,
  onPointsToUseChange,
  buyerName,
  onBuyerNameChange,
  buyerEmail,
  onBuyerEmailChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentChannels,
  paymentChannel,
  onPaymentChannelChange,
  processing,
  errorMsg,
  onClaimFreeStarter,
  onSubmit,
  onNavigateToTopup,
}: ShopCheckoutPanelProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const packTitle = selectedPack
    ? locale === "en"
      ? selectedPack.nameEn
      : locale === "zh"
        ? selectedPack.nameZh
        : selectedPack.nameId
    : "";

  const isFree = Boolean(selectedPack?.isFree);
  const isBooster = selectedPack?.packType === "BOOSTER" || selectedPack?.code.includes("BOOSTER");
  const isStarter = selectedPack?.isStarter || selectedPack?.code.includes("STARTER");
  const maxPoints = selectedPack
    ? isBooster ? Math.floor(selectedPack.priceIdr * 0.6) : isStarter ? selectedPack.priceIdr : 0
    : 0;
  const appliedPoints = Math.min(pointsToUse, nusaPointBalance, maxPoints);
  const amountDue = Math.max(0, (selectedPack?.priceIdr ?? 0) - appliedPoints);

  return (
    <aside className="space-y-5 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
      <IntellioCard
        id={SHOP_SEMANTIC_IDS.CHECKOUT_PANEL}
        variant="glass"
        padding="md"
        className="space-y-4"
      >
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-cream">
          <ShoppingBag className="h-4 w-4 text-amber-light" aria-hidden="true" />
          <span>{isFree ? "Klaim Paket Awal" : t(SHOP_TEXT_CONSTANT.CHECKOUT_TITLE)}</span>
        </h3>
        <p className="nc-type-caption text-subtle">
          {isFree
            ? "Klaim gratis 1x per akun saat login pertama sebagai modal bermain awal."
            : t(SHOP_TEXT_CONSTANT.CHECKOUT_DESC)}
        </p>

        {selectedPack ? (
          isFree ? (
            /* Mode Klaim Gratis 1-Klik */
            <div className="space-y-4 border-t border-border-base pt-4">
              <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-light">
                  <Gift className="h-4 w-4" />
                  <span>Klaim Gratis Pemain Baru</span>
                </div>
                <div className="mt-2 font-display text-base font-bold text-cream">
                  {packTitle}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Dapatkan 20 kartu low-end (8 Karakter + 12 Instrumen) secara instan untuk melengkapi deck tempur Anda.
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-emerald-light">
                    GRATIS (Rp 0)
                  </span>
                  <span className="text-xs text-subtle line-through">
                    {formatIdrCurrency(20000)}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <UserFeedback
                  kind="error"
                  title="Gagal Memproses"
                  description={errorMsg}
                />
              )}

              <Button
                id={SHOP_SEMANTIC_IDS.CHECKOUT_SUBMIT_BTN}
                type="button"
                onClick={() => void onClaimFreeStarter?.()}
                variant="emerald"
                size="md"
                disabled={processing}
                className="w-full font-bold"
                leftIcon={<Gift className="h-4 w-4" />}
              >
                {processing ? "Memproses Klaim..." : "Klaim Starter Pack Sekarang (Gratis)"}
              </Button>
            </div>
          ) : (
            /* Payment checkout */
            <form
              id={SHOP_SEMANTIC_IDS.CHECKOUT_FORM}
              onSubmit={(e) => void onSubmit(e)}
              className="space-y-4 border-t border-border-base pt-4"
            >
              <div className="rounded-xl border border-border-base bg-surface-elevated/40 p-3 text-xs">
                <div className="text-subtle">Paket Terpilih:</div>
                <div className="font-display font-bold text-cream">
                  {packTitle}
                </div>
                {isBooster && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-light">
                    <Sparkles className="h-3 w-3" />
                    <span>5 Kartu Acak · Garansi 1 High-End</span>
                  </div>
                )}
                <div className="mt-1 font-display text-base font-bold text-amber-light">
                  {formatIdrCurrency(selectedPack.priceIdr)}
                </div>
                <div className="mt-3 rounded-lg border border-border-base bg-surface-base/50 p-3">
                  <label htmlFor="shop-nusa-points" className="flex items-center justify-between gap-3 text-xs font-semibold text-cream">
                    <span>Gunakan Nusa Point</span>
                    <span className="flex items-center gap-1.5 text-amber-light">
                      <span>Saldo: {nusaPointBalance.toLocaleString("id-ID")} poin</span>
                      {onNavigateToTopup && (
                        <button
                          type="button"
                          onClick={onNavigateToTopup}
                          className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-400/30 transition-colors cursor-pointer"
                        >
                          + Top Up
                        </button>
                      )}
                    </span>
                  </label>
                  <input
                    id="shop-nusa-points"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={Math.min(maxPoints, nusaPointBalance)}
                    step={1}
                    value={pointsToUse}
                    onChange={(event) => onPointsToUseChange(Math.max(0, Math.min(Math.floor(Number(event.target.value) || 0), maxPoints, nusaPointBalance)))}
                    disabled={processing || nusaPointBalance === 0}
                    className="mt-2 min-h-10 w-full rounded-lg border border-border-base bg-surface-base px-3 text-sm text-cream outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                    aria-describedby="shop-point-limit"
                  />
                  <p id="shop-point-limit" className="mt-1 text-[11px] text-subtle">
                    {isBooster
                      ? `Maksimal ${maxPoints.toLocaleString("id-ID")} poin (diskon 60%).`
                      : `Starter Pack dapat dibayar penuh dengan ${maxPoints.toLocaleString("id-ID")} poin.`}
                    {" Promo lain tidak dapat digabung dengan poin."}
                  </p>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-subtle">Dibayar dengan poin</span>
                    <span className="font-semibold text-emerald-light">{appliedPoints.toLocaleString("id-ID")} poin</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-subtle">Sisa pembayaran</span>
                    <span className="font-bold text-cream">{formatIdrCurrency(amountDue)}</span>
                  </div>
                </div>
              </div>

              {amountDue > 0 && <InputField
                id={SHOP_SEMANTIC_IDS.BUYER_NAME_INPUT}
                label={t(SHOP_TEXT_CONSTANT.BUYER_NAME_LABEL)}
                required
                value={buyerName}
                onChange={(e) => onBuyerNameChange(e.target.value)}
                placeholder={t(SHOP_TEXT_CONSTANT.BUYER_NAME_PLACEHOLDER)}
                sizeVariant="sm"
              />}

              {amountDue > 0 && <InputField
                id={SHOP_SEMANTIC_IDS.BUYER_EMAIL_INPUT}
                label={t(SHOP_TEXT_CONSTANT.BUYER_EMAIL_LABEL)}
                type="email"
                required
                value={buyerEmail}
                onChange={(e) => onBuyerEmailChange(e.target.value)}
                placeholder={t(SHOP_TEXT_CONSTANT.BUYER_EMAIL_PLACEHOLDER)}
                sizeVariant="sm"
              />}

              {amountDue > 0 && <div className="space-y-2">
                <span className="text-xs font-semibold text-cream">
                  {t(SHOP_TEXT_CONSTANT.PAYMENT_METHOD_LABEL)}
                </span>
                <div
                  id={SHOP_SEMANTIC_IDS.PAYMENT_METHOD_GROUP}
                  className="grid grid-cols-2 gap-2"
                >
                  <Button
                    id={SHOP_SEMANTIC_IDS.PAYMENT_QRIS_BTN}
                    type="button"
                    onClick={() => onPaymentMethodChange("QRIS")}
                    variant={
                      paymentMethod === "QRIS" ? "primary" : "secondary"
                    }
                    size="sm"
                    leftIcon={<QrCode className="h-4 w-4" />}
                  >
                    {t(SHOP_TEXT_CONSTANT.PAYMENT_QRIS_LABEL)}
                  </Button>
                  <Button
                    id={SHOP_SEMANTIC_IDS.PAYMENT_VA_BTN}
                    type="button"
                    onClick={() => onPaymentMethodChange("VIRTUAL_ACCOUNT")}
                    variant={
                      paymentMethod === "VIRTUAL_ACCOUNT" ? "primary" : "secondary"
                    }
                    size="sm"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  >
                    {t(SHOP_TEXT_CONSTANT.PAYMENT_VA_LABEL)}
                  </Button>
                </div>
              </div>}

              {amountDue > 0 && paymentMethod === "VIRTUAL_ACCOUNT" && (
                <div className="space-y-2">
                  <label htmlFor="shop-va-channel" className="text-xs font-semibold text-cream">
                    Bank virtual account
                  </label>
                  <select
                    id="shop-va-channel"
                    value={paymentChannel}
                    onChange={(event) => onPaymentChannelChange(event.target.value)}
                    disabled={processing || paymentChannels.filter((channel) => channel.paymentMethod === "VIRTUAL_ACCOUNT").length === 0}
                    className="min-h-11 w-full rounded-xl border border-border-base bg-surface-base px-3 text-sm text-cream outline-none transition-colors hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentChannels.filter((channel) => channel.paymentMethod === "VIRTUAL_ACCOUNT").map((channel) => (
                      <option key={channel.code} value={channel.code}>{channel.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {amountDue > 0 && paymentChannels.length === 0 && (
                <p role="status" className="rounded-xl border border-amber/20 bg-amber/10 p-3 text-xs text-amber-light">
                  Kanal pembayaran belum tersedia. Coba muat ulang halaman atau hubungi admin.
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
                id={SHOP_SEMANTIC_IDS.CHECKOUT_SUBMIT_BTN}
                type="submit"
                variant="primary"
                size="md"
                disabled={processing || (amountDue > 0 && (paymentChannels.length === 0 || !paymentChannel))}
                className="w-full"
              >
                {processing
                  ? t(SHOP_TEXT_CONSTANT.PROCESSING_CHECKOUT)
                  : amountDue === 0
                    ? `Tukar dengan ${appliedPoints.toLocaleString("id-ID")} poin`
                    : `${t(SHOP_TEXT_CONSTANT.SUBMIT_CHECKOUT)} (${formatIdrCurrency(amountDue)})`}
              </Button>
            </form>
          )
        ) : (
          <div className="text-xs text-subtle">
            Pilih paket di sebelah kiri untuk melihat rincian isi dan opsi klaim/pembelian.
          </div>
        )}
      </IntellioCard>
    </aside>
  );
}
