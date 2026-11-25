"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CardEntity,
  CorrectionReportEntity,
  CorrectionReportStatus,
} from "@/client/domain/card/entity/card_entity";
import type {
  PublicationStatusValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";
import { useTranslator } from "@/core/translator";
import type { AdminCardsFeedback } from "../types";

export interface UseAdminCardsReturn {
  cards: CardEntity[];
  totalCards: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  reports: CorrectionReportEntity[];
  activeTab: "CARDS" | "REPORTS";
  setActiveTab: (tab: "CARDS" | "REPORTS") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  actionFeedback: AdminCardsFeedback | null;
  handleUpdateCardVerification: (
    slug: string,
    verificationStatus: VerificationStatusValue
  ) => Promise<void>;
  handleToggleCardPublication: (
    slug: string,
    nextStatus: PublicationStatusValue
  ) => Promise<void>;
  handleUpdateReportStatus: (
    reportId: string,
    status: CorrectionReportStatus
  ) => Promise<void>;
}

export function useAdminCards(): UseAdminCardsReturn {
  const { t } = useTranslator();
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [totalCards, setTotalCards] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(10);
  const [reports, setReports] = useState<CorrectionReportEntity[]>([]);
  const [activeTab, setActiveTab] = useState<"CARDS" | "REPORTS">("CARDS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] =
    useState<AdminCardsFeedback | null>(null);

  const loadAdminCards = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const [cardsResult, allReports] = await Promise.all([
        authUseCase.getAdminCardsPaginated({
          page: currentPage,
          limit: pageSize,
          search: searchQuery.trim() || undefined,
        }),
        authUseCase.getAdminReports(),
      ]);
      setCards(cardsResult.items);
      setTotalCards(cardsResult.total);
      setTotalPages(cardsResult.totalPages);
      setReports(allReports);
    } catch {
      setError(ADMIN_CARDS_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    void loadAdminCards();
  }, [loadAdminCards]);

  const handleSetSearchQuery = useCallback((q: string): void => {
    setSearchQuery(q);
    setCurrentPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number): void => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const handleUpdateCardVerification = useCallback(
    async (
      slug: string,
      verificationStatus: VerificationStatusValue
    ): Promise<void> => {
      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        const updated = await authUseCase.updateCardCuration({
          cardSlug: slug,
          verificationStatus,
        });
        setCards((prev) =>
          prev.map((c) => (c.slug === slug ? updated : c))
        );
        setActionFeedback({
          messageKey: ADMIN_CARDS_TEXT_CONSTANT.VERIFICATION_UPDATED,
          variant: "success",
        });
      } catch {
        setActionFeedback({
          messageKey: ADMIN_CARDS_TEXT_CONSTANT.VERIFICATION_UPDATE_ERROR,
          variant: "error",
        });
      }
    },
    []
  );

  const handleToggleCardPublication = useCallback(
    async (
      slug: string,
      nextStatus: PublicationStatusValue
    ): Promise<void> => {
      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        const updated = await authUseCase.updateCardCuration({
          cardSlug: slug,
          publicationStatus: nextStatus,
        });
        setCards((prev) =>
          prev.map((c) => (c.slug === slug ? updated : c))
        );
        setActionFeedback({
          messageKey: ADMIN_CARDS_TEXT_CONSTANT.PUBLICATION_UPDATED,
          variant: "success",
        });
      } catch {
        setActionFeedback({
          messageKey: ADMIN_CARDS_TEXT_CONSTANT.PUBLICATION_UPDATE_ERROR,
          variant: "error",
        });
      }
    },
    []
  );

  const handleUpdateReportStatus = useCallback(
    async (
      reportId: string,
      status: CorrectionReportStatus
    ): Promise<void> => {
      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        const updated = await authUseCase.updateReportStatus({
          reportId,
          status,
          resolutionNote: t(ADMIN_CARDS_TEXT_CONSTANT.REPORT_RESOLUTION_NOTE, {
            status,
          }),
        });
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? updated : r))
        );
        setActionFeedback({
          messageKey: ADMIN_CARDS_TEXT_CONSTANT.REPORT_STATUS_UPDATED,
          variant: "success",
        });
      } catch {
        setActionFeedback({
          messageKey: ADMIN_CARDS_TEXT_CONSTANT.REPORT_STATUS_UPDATE_ERROR,
          variant: "error",
        });
      }
    },
    [t]
  );

  return {
    cards,
    totalCards,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handleSetPageSize,
    reports,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    loading,
    error,
    retryLoad: () => void loadAdminCards(),
    actionFeedback,
    handleUpdateCardVerification,
    handleToggleCardPublication,
    handleUpdateReportStatus,
  };
}

