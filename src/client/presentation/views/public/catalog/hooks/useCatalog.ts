"use client";

import { useCallback, useEffect, useState } from "react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type {
  CardTypeValue,
  KingdomValue,
  RoleValue,
} from "@/core/constants/cards-catalog";
import { getService } from "@/core/di/container";
import { CARD_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";

export interface UseCatalogReturn {
  cards: CardEntity[];
  totalCards: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  cardTypeFilter: "ALL" | CardTypeValue;
  setCardTypeFilter: (val: "ALL" | CardTypeValue) => void;
  kingdomFilter: "ALL" | KingdomValue;
  setKingdomFilter: (val: "ALL" | KingdomValue) => void;
  roleFilter: "ALL" | RoleValue;
  setRoleFilter: (val: "ALL" | RoleValue) => void;
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  resetFilters: () => void;
  inspectedCard: CardEntity | null;
  setInspectedCard: (card: CardEntity | null) => void;
}

export function useCatalog(): UseCatalogReturn {
  const { t } = useTranslator();
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [totalCards, setTotalCards] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(12);
  const [searchQuery, setSearchQueryState] = useState<string>("");
  const [cardTypeFilter, setCardTypeFilterState] = useState<"ALL" | CardTypeValue>("ALL");
  const [kingdomFilter, setKingdomFilterState] = useState<"ALL" | KingdomValue>("ALL");
  const [roleFilter, setRoleFilterState] = useState<"ALL" | RoleValue>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardEntity | null>(null);

  const loadCatalog = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      const result = await cardUseCase.getCardsPaginated({
        page: currentPage,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        cardType: cardTypeFilter === "ALL" ? undefined : cardTypeFilter,
        kingdom: kingdomFilter === "ALL" ? undefined : kingdomFilter,
        role: roleFilter === "ALL" ? undefined : roleFilter,
      });

      setCards(result.items);
      setTotalCards(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError(t("catalog.loadFallbackError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, cardTypeFilter, kingdomFilter, roleFilter, t]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const setSearchQuery = useCallback((val: string): void => {
    setSearchQueryState(val);
    setCurrentPage(1);
  }, []);

  const setCardTypeFilter = useCallback((val: "ALL" | CardTypeValue): void => {
    setCardTypeFilterState(val);
    setCurrentPage(1);
  }, []);

  const setKingdomFilter = useCallback((val: "ALL" | KingdomValue): void => {
    setKingdomFilterState(val);
    setCurrentPage(1);
  }, []);

  const setRoleFilter = useCallback((val: "ALL" | RoleValue): void => {
    setRoleFilterState(val);
    setCurrentPage(1);
  }, []);

  const setPageSize = useCallback((size: number): void => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback((): void => {
    setSearchQueryState("");
    setCardTypeFilterState("ALL");
    setKingdomFilterState("ALL");
    setRoleFilterState("ALL");
    setCurrentPage(1);
  }, []);

  return {
    cards,
    totalCards,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    cardTypeFilter,
    setCardTypeFilter,
    kingdomFilter,
    setKingdomFilter,
    roleFilter,
    setRoleFilter,
    loading,
    error,
    retryLoad: () => void loadCatalog(),
    resetFilters,
    inspectedCard,
    setInspectedCard,
  };
}
