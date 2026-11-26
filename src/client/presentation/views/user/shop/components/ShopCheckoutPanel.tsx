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
  const priceNusa = selectedPack?.priceIdr ?? 0;
  const hasEnoughNusa = nusaPointBalance >= priceNusa;

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
            /* NUSA Token Burn Checkout */
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
                <div className="mt-2 flex items-baseline justify-between border-t border-border-base pt-2">
                  <span className="text-subtle">Harga Paket</span>
                  <span className="font-display text-lg font-bold text-amber-light">
                    {priceNusa.toLocaleString("id-ID")} NUSA
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-subtle">Saldo Nusa Token Anda</span>
                  <span className="flex items-center gap-1.5 font-semibold text-cream">
                    <span>{nusaPointBalance.toLocaleString("id-ID", { maximumFractionDigits: 2 })} NUSA</span>
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
                </div>
                {!hasEnoughNusa && (
                  <p className="mt-2 rounded-lg border border-amber/30 bg-amber/10 p-2 text-[11px] text-amber-light">
                    Saldo NUSA belum mencukupi. Lakukan Top Up (Swap IDRC/USDC ke NUSA) atau Claim reward Anda.
                  </p>
                )}
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
                type="submit"
                variant="primary"
                size="md"
                disabled={processing || !hasEnoughNusa}
                className="w-full font-bold"
              >
                {processing
                  ? "Memproses Burn NUSA..."
                  : `Bayar & Burn ${priceNusa.toLocaleString("id-ID")} NUSA`}
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
