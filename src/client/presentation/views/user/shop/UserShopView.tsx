"use client";

import React, { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Coins, ShoppingBag } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Button } from "@/client/presentation/components/ui";
import { UserFeedback, UserPageHeading } from "@/client/presentation/components/user";
import {
  ShopCheckoutPanel,
  ShopOrderReceiptCard,
  ShopPackOpeningModal,
  ShopPacksList,
  ShopTopupSection,
} from "./components";
import { SHOP_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "./constants/TextConstant";
import { useShop } from "./hooks/useShop";

export function UserShopView(): React.ReactElement {
  const { t } = useTranslator();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = useMemo(() => {
    return searchParams.get("tab") === "topup" ? "topup" : "packs";
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: "packs" | "topup") => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (tab === "packs") {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", "topup");
      }
      const qs = nextParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const {
    packs,
    nusaPointBalance,
    pointsToUse,
    setPointsToUse,
    selectedPack,
    setSelectedPack,
    buyerName,
    setBuyerName,
    buyerEmail,
    setBuyerEmail,
    paymentMethod,
    setPaymentMethod,
    paymentChannels,
    paymentChannel,
    setPaymentChannel,
    loading,
    loadError,
    retryLoad,
    processing,
    latestOrderReceipt,
    setLatestOrderReceipt,
    openingReceipt,
    closeOpeningModal,
    errorMsg,
    isGuest,
    claimFreeStarter,
    submitCheckout,
  } = useShop();

  return (
    <div id={SHOP_SEMANTIC_IDS.ROOT} className="space-y-6">
      <div id={SHOP_SEMANTIC_IDS.HEADING}>
        <UserPageHeading
          title={
            currentTab === "topup"
              ? t(SHOP_TEXT_CONSTANT.TOPUP_TITLE)
              : t(SHOP_TEXT_CONSTANT.TITLE_KEY)
          }
          description={
            currentTab === "topup"
              ? t(SHOP_TEXT_CONSTANT.TOPUP_SUBTITLE)
              : t(SHOP_TEXT_CONSTANT.SUBTITLE_KEY)
          }
        />
      </div>

      {/* Tab Switcher: Paket Kartu vs Top Up Nusa Point */}
      <div className="flex items-center gap-2 border-b border-border-base pb-3">
        <button
          id={SHOP_SEMANTIC_IDS.TAB_PACKS_BTN}
          type="button"
          onClick={() => handleTabChange("packs")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-bold transition-all cursor-pointer ${
            currentTab === "packs"
              ? "bg-primary text-white shadow-[0_0_16px_rgba(103,102,255,0.35)]"
              : "bg-surface-elevated/40 text-muted hover:bg-surface-elevated hover:text-cream"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{t(SHOP_TEXT_CONSTANT.TAB_PACKS)}</span>
        </button>

        <button
          id={SHOP_SEMANTIC_IDS.TAB_TOPUP_BTN}
          type="button"
          onClick={() => handleTabChange("topup")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-bold transition-all cursor-pointer ${
            currentTab === "topup"
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_16px_rgba(255,159,49,0.35)]"
              : "bg-surface-elevated/40 text-muted hover:bg-surface-elevated hover:text-cream"
          }`}
        >
          <Coins className="h-4 w-4 text-amber-light" />
          <span>{t(SHOP_TEXT_CONSTANT.TAB_TOPUP)}</span>
        </button>
      </div>

      {/* Pack Opening Animation / Reveal Modal */}
      <ShopPackOpeningModal
        receipt={openingReceipt}
        onClose={closeOpeningModal}
      />

      {/* Latest Order Receipt / Instructions (Supports both Packs & Top Up) */}
      {latestOrderReceipt && (
        <ShopOrderReceiptCard receipt={latestOrderReceipt} />
      )}

      {loading && (
        <UserFeedback kind="loading" title={t("common.loading")} />
      )}

      {!loading && loadError && (
        <UserFeedback
          kind="error"
          title={t(SHOP_TEXT_CONSTANT.LOAD_ERROR_TITLE)}
          description={t(loadError)}
          action={
            <Button onClick={retryLoad} size="sm">
              {t(SHOP_TEXT_CONSTANT.RETRY)}
            </Button>
          }
        />
      )}

      {/* Tab 1: Packs Catalog & Checkout */}
      {!loading && !loadError && currentTab === "packs" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Transparent Packs Catalog */}
          <ShopPacksList
            packs={packs}
            selectedPack={selectedPack}
            onSelectPack={setSelectedPack}
          />

          {/* Right Column: Payment Form / Free Claim */}
          <ShopCheckoutPanel
            selectedPack={selectedPack}
            nusaPointBalance={nusaPointBalance}
            pointsToUse={pointsToUse}
            onPointsToUseChange={setPointsToUse}
            buyerName={buyerName}
            onBuyerNameChange={setBuyerName}
            buyerEmail={buyerEmail}
            onBuyerEmailChange={setBuyerEmail}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            paymentChannels={paymentChannels}
            paymentChannel={paymentChannel}
            onPaymentChannelChange={setPaymentChannel}
            processing={processing}
            errorMsg={errorMsg ? t(errorMsg) : null}
            onClaimFreeStarter={claimFreeStarter}
            onSubmit={submitCheckout}
            onNavigateToTopup={() => handleTabChange("topup")}
          />
        </div>
      )}

      {/* Tab 2: Top Up Nusa Point */}
      {!loading && !loadError && currentTab === "topup" && (
        <ShopTopupSection
          nusaPointBalance={nusaPointBalance}
          isGuest={isGuest}
          buyerName={buyerName}
          onBuyerNameChange={setBuyerName}
          buyerEmail={buyerEmail}
          onBuyerEmailChange={setBuyerEmail}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          paymentChannels={paymentChannels}
          paymentChannel={paymentChannel}
          onPaymentChannelChange={setPaymentChannel}
          onOrderCreated={(order) => {
            setLatestOrderReceipt(order);
          }}
        />
      )}
    </div>
  );
}
