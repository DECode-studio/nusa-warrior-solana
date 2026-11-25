"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PaymentOrderEntity,
  ShopPaymentMethod,
  ShopPaymentChannel,
  StarterPackEntity,
} from "@/client/domain/shop/entity/shop_entity";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN, SHOP_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { useUserOnboardingStore } from "@/client/presentation/stores/onboardingStore";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UseShopReturn {
  packs: StarterPackEntity[];
  recentOrders: PaymentOrderEntity[];
  nusaPointBalance: number;
  pointsToUse: number;
  setPointsToUse: (value: number) => void;
  selectedPack: StarterPackEntity | null;
  setSelectedPack: (pack: StarterPackEntity | null) => void;
  buyerName: string;
  setBuyerName: (val: string) => void;
  buyerEmail: string;
  setBuyerEmail: (val: string) => void;
  paymentMethod: ShopPaymentMethod;
  setPaymentMethod: (val: ShopPaymentMethod) => void;
  paymentChannels: ShopPaymentChannel[];
  paymentChannel: string;
  setPaymentChannel: (val: string) => void;
  loading: boolean;
  loadError: string | null;
  retryLoad: () => void;
  processing: boolean;
  latestOrderReceipt: PaymentOrderEntity | null;
  setLatestOrderReceipt: (order: PaymentOrderEntity | null) => void;
  openingReceipt: PaymentOrderEntity | null;
  closeOpeningModal: () => void;
  errorMsg: string | null;
  claimFreeStarter: () => Promise<void>;
  submitCheckout: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useShop(): UseShopReturn {
  const { t } = useTranslator();
  const [packs, setPacks] = useState<StarterPackEntity[]>([]);
  const [recentOrders, setRecentOrders] = useState<PaymentOrderEntity[]>([]);
  const [nusaPointBalance, setNusaPointBalance] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [selectedPack, setSelectedPack] = useState<StarterPackEntity | null>(
    null
  );
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [paymentMethod, setPaymentMethodState] = useState<ShopPaymentMethod>("QRIS");
  const [paymentChannels, setPaymentChannels] = useState<ShopPaymentChannel[]>([]);
  const [paymentChannel, setPaymentChannel] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [latestOrderReceipt, setLatestOrderReceipt] =
    useState<PaymentOrderEntity | null>(null);
  const [openingReceipt, setOpeningReceipt] =
    useState<PaymentOrderEntity | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadShop = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const shopUseCase = getService(SHOP_USECASE_TOKEN);

      const [user, catalog] = await Promise.all([
        authUseCase.getCurrentUser().catch(() => null),
        shopUseCase.getShopCatalog(),
      ]);

      if (user) {
        setBuyerName((prev) => prev || user.name || "");
      }
      const sortedPacks = [...catalog.packs].sort((a, b) => {
        const aStarter = a.isStarter || a.code.includes("STARTER");
        const bStarter = b.isStarter || b.code.includes("STARTER");
        if (aStarter && !bStarter) return -1;
        if (!aStarter && bStarter) return 1;
        return a.priceIdr - b.priceIdr;
      });
      setPacks(sortedPacks);
      setRecentOrders(catalog.recentOrders);
      setNusaPointBalance(catalog.nusaPointBalance ?? 0);
      setLatestOrderReceipt((current) =>
        current ?? catalog.recentOrders.find((order) => order.paymentStatus === "PENDING") ?? null
      );
      if (catalog.hasClaimedStarterPack !== undefined) {
        useUserOnboardingStore.getState().setClaimedFreePack(Boolean(catalog.hasClaimedStarterPack));
      }
      setSelectedPack((prev) => {
        if (!prev) return sortedPacks[0] ?? null;
        return sortedPacks.find((p) => p.code === prev.code) ?? sortedPacks[0] ?? null;
      });
      setPointsToUse(0);
      try {
        const methods = await shopUseCase.getPaymentMethods();
        setPaymentChannels(methods.channels);
        setPaymentMethodState((current) =>
          methods.channels.some((channel) => channel.paymentMethod === current)
            ? current
            : methods.channels[0]?.paymentMethod ?? "QRIS"
        );
        setPaymentChannel((current) =>
          methods.channels.some((channel) => channel.code === current)
            ? current
            : methods.channels[0]?.code ?? ""
        );
      } catch {
        setPaymentChannels([]);
        setPaymentChannel("");
      }
    } catch {
      setLoadError(SHOP_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShop();
  }, [loadShop]);

  const claimFreeStarter = async (): Promise<void> => {
    setProcessing(true);
    setErrorMsg(null);
    try {
      const shopUseCase = getService(SHOP_USECASE_TOKEN);
      const order = await shopUseCase.claimFreeStarterPack();
      gamelanAudio.playVictory();
      useUserOnboardingStore.getState().setClaimedFreePack(true);
      setLatestOrderReceipt(order);
      setOpeningReceipt(order);
      setRecentOrders((prev) => [order, ...prev]);
      await loadShop();
    } catch {
      setErrorMsg(SHOP_TEXT_CONSTANT.CLAIM_ERROR);
    } finally {
      setProcessing(false);
    }
  };

  const setCheckoutPaymentMethod = (method: ShopPaymentMethod): void => {
    setPaymentMethodState(method);
    const matching = paymentChannels.find((channel) => channel.paymentMethod === method);
    if (matching) setPaymentChannel(matching.code);
  };

  const submitCheckout = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!selectedPack) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      const shopUseCase = getService(SHOP_USECASE_TOKEN);
      const order = await shopUseCase.checkout({
        buyerName: buyerName.trim() || t(SHOP_TEXT_CONSTANT.DEFAULT_BUYER_NAME),
        buyerEmail: buyerEmail.trim() || "pemain@nusantaracard.id",
        starterPackCode: selectedPack.code,
        ...(paymentMethod && paymentChannel ? { paymentMethod, paymentChannel } : {}),
        pointsToUse,
      });
      setLatestOrderReceipt(order);
      setRecentOrders((prev) => [order, ...prev]);
      if (order.paymentStatus === "PAID") {
        gamelanAudio.playVictory();
        setOpeningReceipt(order);
      }
      await loadShop();
    } catch {
      setErrorMsg(SHOP_TEXT_CONSTANT.CHECKOUT_ERROR);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!latestOrderReceipt || latestOrderReceipt.paymentStatus !== "PENDING") return;
    const orderId = latestOrderReceipt.id;
    let cancelled = false;
    const poll = async (): Promise<void> => {
      try {
        const shopUseCase = getService(SHOP_USECASE_TOKEN);
        const order = await shopUseCase.getOrder(orderId);
        if (cancelled) return;
        setLatestOrderReceipt(order);
        setRecentOrders((previous) => [order, ...previous.filter((item) => item.id !== order.id)]);
        if (order.paymentStatus === "PAID") {
          gamelanAudio.playVictory();
          setOpeningReceipt(order);
          await loadShop();
        }
      } catch {
        // Keep the pending receipt visible; the next poll can recover transient network errors.
      }
    };
    const timer = window.setInterval(() => void poll(), 5_000);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [latestOrderReceipt?.id, latestOrderReceipt?.paymentStatus, loadShop]);

  const closeOpeningModal = (): void => {
    setOpeningReceipt(null);
  };

  return {
    packs,
    recentOrders,
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
    setPaymentMethod: setCheckoutPaymentMethod,
    paymentChannels,
    paymentChannel,
    setPaymentChannel,
    loading,
    loadError,
    retryLoad: () => void loadShop(),
    processing,
    latestOrderReceipt,
    setLatestOrderReceipt,
    openingReceipt,
    closeOpeningModal,
    errorMsg,
    claimFreeStarter,
    submitCheckout,
  };
}
