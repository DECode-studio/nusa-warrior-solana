"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getService } from "@/core/di/container";
import { AUCTION_USECASE_TOKEN } from "@/core/di/tokens";
import { sendBase64SolanaTx } from "@/core/utils/solana-tx-client";
import type {
  AuctionDetailEntity,
  AuctionListEntity,
  AuctionListingEntity,
  AuctionSort,
  AuctionTab,
} from "@/client/domain/auction/entity/auction_entity";

export function useAuction() {
  const auctionUseCase = useMemo(() => getService(AUCTION_USECASE_TOKEN), []);
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const [tab, setTab] = useState<AuctionTab>("explore");
  const [kingdom, setKingdom] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<AuctionSort>("ending_soon");

  const [listData, setListData] = useState<AuctionListEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [selectedDetail, setSelectedDetail] =
    useState<AuctionDetailEntity | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingAuction, setEditingAuction] =
    useState<AuctionListingEntity | null>(null);

  const loadAuctions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await auctionUseCase.listAuctions({
        tab,
        kingdom: kingdom || undefined,
        search: search.trim() || undefined,
        sort,
      });
      setListData(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memuat data lelang."
      );
    } finally {
      setIsLoading(false);
    }
  }, [auctionUseCase, tab, kingdom, search, sort]);

  useEffect(() => {
    void loadAuctions();
  }, [loadAuctions]);

  const openDetail = useCallback(
    async (auctionId: string) => {
      setIsLoadingDetail(true);
      setErrorMessage(null);
      try {
        const detail = await auctionUseCase.getAuctionDetail(auctionId);
        setSelectedDetail(detail);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal memuat detail lelang."
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [auctionUseCase]
  );

  const closeDetail = useCallback(() => {
    setSelectedDetail(null);
  }, []);

  const createAuction = useCallback(
    async (input: {
      cardId: string;
      startingPrice: number;
      durationHours: number;
    }): Promise<boolean> => {
      if (!publicKey) {
        setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
        return false;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const prepared = await auctionUseCase.prepareCreateAuction(input);
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
          durationHours: prepared.durationHours,
          txSignature,
        });
        setStatusMessage("Lelang kartu berhasil diposting ke blockchain Solana.");
        setIsCreateModalOpen(false);
        await loadAuctions();
        return true;
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal membuat lelang kartu."
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      auctionUseCase,
      connection,
      loadAuctions,
      publicKey,
      sendTransaction,
      signTransaction,
    ]
  );

  const editAuction = useCallback(
    async (input: {
      auctionId: string;
      startingPrice: number;
      durationHours: number;
    }): Promise<boolean> => {
      if (!publicKey) {
        setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
        return false;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const prepared = await auctionUseCase.prepareEditAuction(input);
        const txSignature = await sendBase64SolanaTx({
          serializedTransaction: prepared.serializedTransaction,
          connection,
          signTransaction,
          sendTransaction,
        });
        await auctionUseCase.confirmEditAuction({
          auctionId: input.auctionId,
          startingPrice: input.startingPrice,
          durationHours: input.durationHours,
          txSignature,
        });
        setStatusMessage("Perubahan lelang berhasil disimpan on-chain.");
        setEditingAuction(null);
        await loadAuctions();
        if (selectedDetail?.id === input.auctionId) {
          await openDetail(input.auctionId);
        }
        return true;
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal mengedit lelang."
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      auctionUseCase,
      connection,
      loadAuctions,
      openDetail,
      publicKey,
      selectedDetail?.id,
      sendTransaction,
      signTransaction,
    ]
  );

  const cancelAuction = useCallback(
    async (auctionId: string): Promise<boolean> => {
      if (!publicKey) {
        setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
        return false;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const prepared = await auctionUseCase.prepareCancelAuction(auctionId);
        const txSignature = await sendBase64SolanaTx({
          serializedTransaction: prepared.serializedTransaction,
          connection,
          signTransaction,
          sendTransaction,
        });
        await auctionUseCase.confirmCancelAuction({ auctionId, txSignature });
        setStatusMessage("Lelang dibatalkan dan kartu dikembalikan ke dompet.");
        setSelectedDetail(null);
        await loadAuctions();
        return true;
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal membatalkan lelang."
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      auctionUseCase,
      connection,
      loadAuctions,
      publicKey,
      sendTransaction,
      signTransaction,
    ]
  );

  const placeBid = useCallback(
    async (auctionId: string, amount: number): Promise<boolean> => {
      if (!publicKey) {
        setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
        return false;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const prepared = await auctionUseCase.preparePlaceBid({
          auctionId,
          amount,
        });
        const txSignature = await sendBase64SolanaTx({
          serializedTransaction: prepared.serializedTransaction,
          connection,
          signTransaction,
          sendTransaction,
        });
        const updated = await auctionUseCase.confirmPlaceBid({
          auctionId,
          amount: prepared.amount,
          deltaAmount: prepared.deltaAmount,
          bidEscrowPda: prepared.bidEscrowPda,
          txSignature,
        });
        setSelectedDetail(updated);
        setStatusMessage(
          `Bid ${prepared.amount} NUSA berhasil! ${prepared.deltaAmount} NUSA telah dibekukan di escrow.`
        );
        await loadAuctions();
        return true;
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal memasang bid."
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      auctionUseCase,
      connection,
      loadAuctions,
      publicKey,
      sendTransaction,
      signTransaction,
    ]
  );

  const settleAuction = useCallback(
    async (auctionId: string): Promise<boolean> => {
      if (!publicKey) {
        setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
        return false;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const prepared = await auctionUseCase.prepareSettleAuction(auctionId);
        const txSignature = await sendBase64SolanaTx({
          serializedTransaction: prepared.serializedTransaction,
          connection,
          signTransaction,
          sendTransaction,
        });
        const updated = await auctionUseCase.confirmSettleAuction({
          auctionId,
          txSignature,
        });
        setSelectedDetail(updated);
        setStatusMessage("Lelang berhasil diselesaikan on-chain.");
        await loadAuctions();
        return true;
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal menyelesaikan lelang."
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      auctionUseCase,
      connection,
      loadAuctions,
      publicKey,
      sendTransaction,
      signTransaction,
    ]
  );

  const claimRefund = useCallback(
    async (auctionId: string): Promise<boolean> => {
      if (!publicKey) {
        setErrorMessage("Hubungkan dompet Solana terlebih dahulu.");
        return false;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);
      try {
        const prepared = await auctionUseCase.prepareRefundBid(auctionId);
        const txSignature = await sendBase64SolanaTx({
          serializedTransaction: prepared.serializedTransaction,
          connection,
          signTransaction,
          sendTransaction,
        });
        const updated = await auctionUseCase.confirmRefundBid({
          auctionId,
          txSignature,
        });
        setSelectedDetail(updated);
        setStatusMessage(
          `Refund ${prepared.refundAmount ?? 0} NUSA berhasil dikembalikan ke dompet Anda.`
        );
        await loadAuctions();
        return true;
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal mengklaim refund NUSA."
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      auctionUseCase,
      connection,
      loadAuctions,
      publicKey,
      sendTransaction,
      signTransaction,
    ]
  );

  return {
    tab,
    setTab,
    kingdom,
    setKingdom,
    search,
    setSearch,
    sort,
    setSort,
    listData,
    isLoading,
    errorMessage,
    setErrorMessage,
    statusMessage,
    setStatusMessage,
    isSubmitting,
    selectedDetail,
    isLoadingDetail,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingAuction,
    setEditingAuction,
    walletConnected: Boolean(publicKey),
    loadAuctions,
    openDetail,
    closeDetail,
    createAuction,
    editAuction,
    cancelAuction,
    placeBid,
    settleAuction,
    claimRefund,
  };
}
