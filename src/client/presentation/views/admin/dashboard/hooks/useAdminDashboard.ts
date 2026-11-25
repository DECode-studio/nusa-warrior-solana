"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUserRecordEntity } from "@/client/domain/auth/entity/user_entity";
import type {
  CardEntity,
  CorrectionReportEntity,
} from "@/client/domain/card/entity/card_entity";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UseAdminDashboardReturn {
  cards: CardEntity[];
  users: AdminUserRecordEntity[];
  reports: CorrectionReportEntity[];
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  activeCardsCount: number;
  withdrawnCardsCount: number;
  verifiedCardsCount: number;
  openReportsCount: number;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [users, setUsers] = useState<AdminUserRecordEntity[]>([]);
  const [reports, setReports] = useState<CorrectionReportEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const [allCards, allUsers, allReports] = await Promise.all([
        authUseCase.getAdminCards(),
        authUseCase.getAdminUsers(),
        authUseCase.getAdminReports(),
      ]);
      setCards(allCards);
      setUsers(allUsers);
      setReports(allReports);
    } catch {
      setError(ADMIN_DASHBOARD_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeCardsCount = cards.filter(
    (card) => card.publicationStatus === "ACTIVE"
  ).length;
  const withdrawnCardsCount = cards.filter(
    (card) => card.publicationStatus === "WITHDRAWN"
  ).length;
  const verifiedCardsCount = cards.filter(
    (card) => card.verificationStatus === "VERIFIED"
  ).length;
  const openReportsCount = reports.filter(
    (report) => report.status === "OPEN"
  ).length;

  return {
    cards,
    users,
    reports,
    loading,
    error,
    retryLoad: () => void loadDashboard(),
    activeCardsCount,
    withdrawnCardsCount,
    verifiedCardsCount,
    openReportsCount,
  };
}

