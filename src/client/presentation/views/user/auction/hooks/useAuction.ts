"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslator } from "@/core/translator";
import type {
  AuctionListingEntity,
  AuctionSort,
  AuctionTab,
} from "@/client/domain/auction/entity/auction_entity";
import type { AuctionListQuery } from "@/client/domain/auction/repository/auction_repository";
import { AUCTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { AUCTION_TEXT_CONSTANT } from "../constants/TextConstant";
import { useAuctionQuery } from "./useAuctionQuery";
import { useDebouncedValue } from "./useDebouncedValue";

export interface AuctionCountdownState {
  readonly label: string;
  readonly isEnded: boolean;
  readonly isUrgent: boolean;
  readonly isCritical: boolean;
}

const AUCTION_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

export function useAuction() {
  const { locale, t } = useTranslator();
  const { publicKey } = useWallet();

  const [tab, setTabState] = useState<AuctionTab>("explore");
  const [kingdom, setKingdomState] = useState<string>("");
  const [search, setSearchState] = useState<string>("");
  const [sort, setSortState] = useState<AuctionSort>("ending_soon");
  const [page, setPage] = useState<number>(1);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingAuction, setEditingAuction] =
    useState<AuctionListingEntity | null>(null);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const setTab = useCallback((next: AuctionTab) => {
    setTabState(next);
    setPage(1);
  }, []);

  const setKingdom = useCallback((next: string) => {
    setKingdomState(next);
    setPage(1);
  }, []);

  const setSearch = useCallback((next: string) => {
    setSearchState(next);
    setPage(1);
  }, []);

  const setSort = useCallback((next: AuctionSort) => {
    setSortState(next);
    setPage(1);
  }, []);

  const query = useMemo<AuctionListQuery>(
    () => ({
      tab,
      kingdom: kingdom || undefined,
      search: debouncedSearch.trim() || undefined,
      sort,
      page,
      pageSize: AUCTION_PAGE_SIZE,
    }),
    [tab, kingdom, debouncedSearch, sort, page]
  );

  const {
    data: listData,
    isLoading,
    error: queryError,
    refetch: loadAuctions,
  } = useAuctionQuery(query, t(AUCTION_TEXT_CONSTANT.ERROR_LOAD_AUCTIONS));

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = useCallback(
    (endsAtIso: string): AuctionCountdownState => {
      const diffSec = Math.floor((Date.parse(endsAtIso) - nowMs) / 1000);
      if (diffSec <= 0) {
        return {
          label: "00:00:00",
          isEnded: true,
          isUrgent: false,
          isCritical: false,
        };
      }
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      const pad = (v: number) => String(v).padStart(2, "0");
      return {
        label: `${pad(hours)}:${pad(mins)}:${pad(secs)}`,
        isEnded: false,
        isUrgent: diffSec <= 3600,
        isCritical: diffSec <= 300,
      };
    },
    [nowMs]
  );

  const tabs = useMemo(
    () =>
      [
        {
          key: "explore" as const,
          label: t(AUCTION_TEXT_CONSTANT.TAB_EXPLORE),
          id: AUCTION_SEMANTIC_IDS.tabExplore,
        },
        {
          key: "selling" as const,
          label: t(AUCTION_TEXT_CONSTANT.TAB_SELLING),
          id: AUCTION_SEMANTIC_IDS.tabSelling,
        },
        {
          key: "bidding" as const,
          label: t(AUCTION_TEXT_CONSTANT.TAB_BIDDING),
          id: AUCTION_SEMANTIC_IDS.tabBidding,
        },
        {
          key: "history" as const,
          label: t(AUCTION_TEXT_CONSTANT.TAB_HISTORY),
          id: AUCTION_SEMANTIC_IDS.tabHistory,
        },
      ] as const,
    [t]
  );

  const auctions = useMemo(
    () => listData?.auctions ?? [],
    [listData?.auctions]
  );

  const sellableCards = useMemo(
    () => listData?.sellableCards ?? [],
    [listData?.sellableCards]
  );

  const frozenAuctions = useMemo(
    () => listData?.frozenAuctions ?? [],
    [listData?.frozenAuctions]
  );

  const emptyState = useMemo(() => {
    if (tab === "explore") {
      return {
        title: t(AUCTION_TEXT_CONSTANT.EMPTY_EXPLORE_TITLE),
        desc: t(AUCTION_TEXT_CONSTANT.EMPTY_EXPLORE_DESC),
      };
    }
    if (tab === "selling") {
      return {
        title: t(AUCTION_TEXT_CONSTANT.EMPTY_SELLING_TITLE),
        desc: t(AUCTION_TEXT_CONSTANT.EMPTY_SELLING_DESC),
      };
    }
    if (tab === "bidding") {
      return {
        title: t(AUCTION_TEXT_CONSTANT.EMPTY_BIDDING_TITLE),
        desc: t(AUCTION_TEXT_CONSTANT.EMPTY_BIDDING_DESC),
      };
    }
    return {
      title: t(AUCTION_TEXT_CONSTANT.EMPTY_HISTORY_TITLE),
      desc: t(AUCTION_TEXT_CONSTANT.EMPTY_HISTORY_DESC),
    };
  }, [t, tab]);

  const openCreateModal = useCallback(() => {
    setEditingAuction(null);
    setIsCreateModalOpen(true);
  }, []);

  const openEditModal = useCallback((auction: AuctionListingEntity) => {
    setActiveDetailId(null);
    setIsCreateModalOpen(false);
    setEditingAuction(auction);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingAuction(null);
  }, []);

  const openDetail = useCallback((auctionId: string) => {
    setActiveDetailId(auctionId);
  }, []);

  const closeDetail = useCallback(() => {
    setActiveDetailId(null);
  }, []);

  const handleMutationSuccess = useCallback(
    async (message: string) => {
      setStatusMessage(message);
      setBannerError(null);
      await loadAuctions();
    },
    [loadAuctions]
  );

  const errorMessage = bannerError ?? queryError;

  return {
    locale,
    t,
    tab,
    setTab,
    tabs,
    kingdom,
    setKingdom,
    search,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
    getCountdown,
    auctions,
    sellableCards,
    frozenAuctions,
    pagination: listData?.pagination ?? null,
    availableNusa: listData?.walletNusaBalance ?? 0,
    frozenNusa: listData?.frozenNusaTotal ?? 0,
    activeSelling: listData?.activeSellingCount ?? 0,
    maxSelling: listData?.maxActiveListings ?? 5,
    emptyState,
    isLoading,
    errorMessage,
    clearError: useCallback(() => setBannerError(null), []),
    statusMessage,
    clearStatus: useCallback(() => setStatusMessage(null), []),
    activeDetailId,
    isCreateModalOpen,
    editingAuction,
    walletConnected: Boolean(publicKey),
    loadAuctions,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDetail,
    closeDetail,
    handleMutationSuccess,
  };
}
