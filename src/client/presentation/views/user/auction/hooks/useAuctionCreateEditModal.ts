"use client";

import { useCallback, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getService } from "@/core/di/container";
import { AUCTION_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { localizeServerMessage } from "@/core/translator/server-messages";
import { sendBase64SolanaTx } from "@/core/utils/solana-tx-client";
import type {
  AuctionListingEntity,
  SellableCardOptionEntity,
} from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UseAuctionCreateEditModalParams {
  readonly mode: "create" | "edit";
  readonly sellableCards: readonly SellableCardOptionEntity[];
  readonly editingAuction: AuctionListingEntity | null;
  readonly onClose: () => void;
  readonly onSuccess: (message: string) => Promise<void>;
}

const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 1440;

export function useAuctionCreateEditModal({
  mode,
  sellableCards,
  editingAuction,
  onClose,
  onSuccess,
}: UseAuctionCreateEditModalParams) {
  const auctionUseCase = useMemo(() => getService(AUCTION_USECASE_TOKEN), []);
  const { locale, t } = useTranslator();
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const initialCardId = useMemo(
    () =>
      mode === "edit"
        ? (editingAuction?.card.id ?? "")
        : (sellableCards.find((item) => !item.blockedReason)?.card.id ?? ""),
    [editingAuction?.card.id, mode, sellableCards]
  );

  const initialTotalMinutes =
    mode === "edit" ? (editingAuction?.durationMinutes ?? 60) : 60;

  const [selectedCardId, setSelectedCardId] = useState<string>(initialCardId);
  const [startingPriceStr, setStartingPriceStr] = useState<string>(
    mode === "edit" ? String(editingAuction?.startingPrice ?? 100) : "100"
  );
  const [durationHoursPart, setDurationHoursPartState] = useState<number>(
    Math.floor(initialTotalMinutes / 60)
  );
  const [durationMinutesPart, setDurationMinutesPartState] = useState<number>(
    initialTotalMinutes % 60
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const setDurationHoursPart = useCallback((hours: number) => {
    const safeHours = Number.isFinite(hours)
      ? Math.max(0, Math.min(24, Math.trunc(hours)))
      : 0;
    setDurationHoursPartState(safeHours);
    if (safeHours === 24) {
      setDurationMinutesPartState(0);
    }
  }, []);

  const setDurationMinutesPart = useCallback(
    (minutes: number) => {
      const safeMinutes = Number.isFinite(minutes)
        ? Math.max(0, Math.min(59, Math.trunc(minutes)))
        : 0;
      if (durationHoursPart === 24) {
        setDurationMinutesPartState(0);
        return;
      }
      setDurationMinutesPartState(safeMinutes);
    },
    [durationHoursPart]
  );

  const applyDurationPreset = useCallback((totalMinutes: number) => {
    const clamped = Math.max(
      MIN_DURATION_MINUTES,
      Math.min(MAX_DURATION_MINUTES, totalMinutes)
    );
    setDurationHoursPartState(Math.floor(clamped / 60));
    setDurationMinutesPartState(clamped % 60);
  }, []);

  const totalDurationMinutes = useMemo(
    () => durationHoursPart * 60 + durationMinutesPart,
    [durationHoursPart, durationMinutesPart]
  );

  const pricingPreview = useMemo(() => {
    const parsedPrice = Number.parseInt(startingPriceStr, 10);
    const isValidPrice = Number.isInteger(parsedPrice) && parsedPrice >= 50;
    const minFirstBid = isValidPrice ? parsedPrice + 50 : 100;
    const estFee = Math.floor((minFirstBid * 1000) / 10_000);
    const estPayout = Math.max(0, minFirstBid - estFee);
    return { minFirstBid, estFee, estPayout };
  }, [startingPriceStr]);

  const resolveBlockedReason = useCallback(
    (reasonKey: string | null): string | null => {
      if (!reasonKey) return null;
      return localizeServerMessage(reasonKey, locale).message;
    },
    [locale]
  );

  const submitForm = useCallback(async (): Promise<void> => {
    setLocalError(null);
    if (!publicKey) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.WALLET_REQUIRED));
      return;
    }

    const parsedPrice = Number.parseInt(startingPriceStr, 10);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 50) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.VALIDATION_INVALID_PRICE));
      return;
    }
    if (
      totalDurationMinutes < MIN_DURATION_MINUTES ||
      totalDurationMinutes > MAX_DURATION_MINUTES
    ) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.VALIDATION_INVALID_DURATION));
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "edit" && editingAuction) {
        const prepared = await auctionUseCase.prepareEditAuction({
          auctionId: editingAuction.id,
          startingPrice: parsedPrice,
          durationMinutes: totalDurationMinutes,
        });
        const txSignature = await sendBase64SolanaTx({
          serializedTransaction: prepared.serializedTransaction,
          connection,
          signTransaction,
          sendTransaction,
        });
        await auctionUseCase.confirmEditAuction({
          auctionId: editingAuction.id,
          startingPrice: parsedPrice,
          durationMinutes: totalDurationMinutes,
          txSignature,
        });
        onClose();
        await onSuccess(t(AUCTION_TEXT_CONSTANT.SUCCESS_EDIT_AUCTION));
        return;
      }

      if (!selectedCardId) {
        setLocalError(t(AUCTION_TEXT_CONSTANT.VALIDATION_SELECT_CARD));
        return;
      }

      const prepared = await auctionUseCase.prepareCreateAuction({
        cardId: selectedCardId,
        startingPrice: parsedPrice,
        durationMinutes: totalDurationMinutes,
      });
      const txSignature = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });
      await auctionUseCase.confirmCreateAuction({
        auctionId: prepared.auctionId,
        cardId: prepared.cardId,
        cardMintOrAsset: prepared.cardMintOrAsset,
        tokenStandard: prepared.tokenStandard,
        collectionAddress: prepared.collectionAddress,
        startingPrice: prepared.startingPrice,
        durationMinutes: prepared.durationMinutes,
        txSignature,
      });
      onClose();
      await onSuccess(t(AUCTION_TEXT_CONSTANT.SUCCESS_CREATE_AUCTION));
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t(
              mode === "edit"
                ? AUCTION_TEXT_CONSTANT.ERROR_EDIT_AUCTION
                : AUCTION_TEXT_CONSTANT.ERROR_CREATE_AUCTION
            )
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    auctionUseCase,
    connection,
    editingAuction,
    mode,
    onClose,
    onSuccess,
    publicKey,
    selectedCardId,
    sendTransaction,
    signTransaction,
    startingPriceStr,
    t,
    totalDurationMinutes,
  ]);

  return {
    locale,
    t,
    selectedCardId,
    setSelectedCardId,
    startingPriceStr,
    setStartingPriceStr,
    durationHoursPart,
    setDurationHoursPart,
    durationMinutesPart,
    setDurationMinutesPart,
    totalDurationMinutes,
    applyDurationPreset,
    localError,
    isSubmitting,
    minFirstBid: pricingPreview.minFirstBid,
    estFee: pricingPreview.estFee,
    estPayout: pricingPreview.estPayout,
    resolveBlockedReason,
    submitForm,
  };
}
