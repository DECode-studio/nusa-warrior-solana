"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getService } from "@/core/di/container";
import { AUCTION_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { sendBase64SolanaTx } from "@/core/utils/solana-tx-client";
import type { AuctionDetailEntity } from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UseAuctionDetailModalParams {
  readonly auctionId: string;
  readonly walletNusaBalance: number;
  readonly onClose: () => void;
  readonly onMutated: (message: string) => Promise<void>;
}

export function useAuctionDetailModal({
  auctionId,
  walletNusaBalance,
  onClose,
  onMutated,
}: UseAuctionDetailModalParams) {
  const auctionUseCase = useMemo(() => getService(AUCTION_USECASE_TOKEN), []);
  const { locale, t } = useTranslator();
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const [detail, setDetail] = useState<AuctionDetailEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bidAmountStr, setBidAmountStr] = useState<string>("100");
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);
  const requestSeq = useRef<number>(0);

  const loadDetail = useCallback(async () => {
    const currentSeq = requestSeq.current + 1;
    requestSeq.current = currentSeq;
    setIsLoading(true);
    setLocalError(null);
    try {
      const response = await auctionUseCase.getAuctionDetail(auctionId);
      if (currentSeq === requestSeq.current) {
        setDetail(response);
        setBidAmountStr(String(response.minNextBid));
      }
    } catch (err) {
      if (currentSeq === requestSeq.current) {
        setLocalError(
          err instanceof Error
            ? err.message
            : t(AUCTION_TEXT_CONSTANT.ERROR_LOAD_DETAIL)
        );
      }
    } finally {
      if (currentSeq === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [auctionId, auctionUseCase, t]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const bidComputation = useMemo(() => {
    const minNextBid = detail?.minNextBid ?? 100;
    const myHeldAmount = detail?.myHeldAmount ?? 0;
    const parsedBid = Number.parseInt(bidAmountStr, 10);
    const isValidBid = Number.isInteger(parsedBid) && parsedBid >= minNextBid;
    const deltaRequired = isValidBid
      ? Math.max(0, parsedBid - myHeldAmount)
      : Math.max(0, minNextBid - myHeldAmount);
    return {
      isValidBid,
      deltaRequired,
      hasEnoughBalance: walletNusaBalance >= deltaRequired,
    };
  }, [bidAmountStr, detail?.minNextBid, detail?.myHeldAmount, walletNusaBalance]);

  const submitBid = useCallback(async (): Promise<void> => {
    if (!detail || !bidComputation.isValidBid || !bidComputation.hasEnoughBalance) {
      return;
    }
    if (!publicKey) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.WALLET_REQUIRED));
      return;
    }

    const amount = Number.parseInt(bidAmountStr, 10);
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const prepared = await auctionUseCase.preparePlaceBid({
        auctionId: detail.id,
        amount,
      });
      const txSignature = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });
      const updated = await auctionUseCase.confirmPlaceBid({
        auctionId: detail.id,
        amount: prepared.amount,
        deltaAmount: prepared.deltaAmount,
        bidEscrowPda: prepared.bidEscrowPda,
        txSignature,
      });
      setDetail(updated);
      setBidAmountStr(String(updated.minNextBid));
      await onMutated(
        t(AUCTION_TEXT_CONSTANT.SUCCESS_PLACE_BID, {
          amount: prepared.amount,
          delta: prepared.deltaAmount,
        })
      );
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t(AUCTION_TEXT_CONSTANT.ERROR_PLACE_BID)
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    auctionUseCase,
    bidAmountStr,
    bidComputation.hasEnoughBalance,
    bidComputation.isValidBid,
    connection,
    detail,
    onMutated,
    publicKey,
    sendTransaction,
    signTransaction,
    t,
  ]);

  const cancelAuction = useCallback(async (): Promise<void> => {
    if (!detail) return;
    if (!publicKey) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.WALLET_REQUIRED));
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const prepared = await auctionUseCase.prepareCancelAuction(detail.id);
      const txSignature = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });
      await auctionUseCase.confirmCancelAuction({
        auctionId: detail.id,
        txSignature,
      });
      onClose();
      await onMutated(t(AUCTION_TEXT_CONSTANT.SUCCESS_CANCEL_AUCTION));
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t(AUCTION_TEXT_CONSTANT.ERROR_CANCEL_AUCTION)
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    auctionUseCase,
    connection,
    detail,
    onClose,
    onMutated,
    publicKey,
    sendTransaction,
    signTransaction,
    t,
  ]);

  const settleAuction = useCallback(async (): Promise<void> => {
    if (!detail) return;
    if (!publicKey) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.WALLET_REQUIRED));
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const prepared = await auctionUseCase.prepareSettleAuction(detail.id);
      const txSignature = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });
      const updated = await auctionUseCase.confirmSettleAuction({
        auctionId: detail.id,
        txSignature,
      });
      setDetail(updated);
      await onMutated(t(AUCTION_TEXT_CONSTANT.SUCCESS_SETTLE_AUCTION));
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t(AUCTION_TEXT_CONSTANT.ERROR_SETTLE_AUCTION)
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    auctionUseCase,
    connection,
    detail,
    onMutated,
    publicKey,
    sendTransaction,
    signTransaction,
    t,
  ]);

  const claimRefund = useCallback(async (): Promise<void> => {
    if (!detail) return;
    if (!publicKey) {
      setLocalError(t(AUCTION_TEXT_CONSTANT.WALLET_REQUIRED));
      return;
    }
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const prepared = await auctionUseCase.prepareRefundBid(detail.id);
      const txSignature = await sendBase64SolanaTx({
        serializedTransaction: prepared.serializedTransaction,
        connection,
        signTransaction,
        sendTransaction,
      });
      const updated = await auctionUseCase.confirmRefundBid({
        auctionId: detail.id,
        txSignature,
      });
      setDetail(updated);
      await onMutated(
        t(AUCTION_TEXT_CONSTANT.SUCCESS_CLAIM_REFUND, {
          amount: prepared.refundAmount ?? 0,
        })
      );
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t(AUCTION_TEXT_CONSTANT.ERROR_CLAIM_REFUND)
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    auctionUseCase,
    connection,
    detail,
    onMutated,
    publicKey,
    sendTransaction,
    signTransaction,
    t,
  ]);

  return {
    locale,
    t,
    detail,
    isLoading,
    localError,
    isSubmitting,
    bidAmountStr,
    setBidAmountStr,
    confirmCancel,
    setConfirmCancel,
    isValidBid: bidComputation.isValidBid,
    deltaRequired: bidComputation.deltaRequired,
    hasEnoughBalance: bidComputation.hasEnoughBalance,
    submitBid,
    cancelAuction,
    settleAuction,
    claimRefund,
  };
}
