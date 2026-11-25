"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PaymentGatewayMode,
  PaymentGatewaySettingsEntity,
  PaymentGatewayUserEntity,
} from "@/client/domain/payment/entity/payment_gateway_entity";
import { getService } from "@/core/di/container";
import { PAYMENT_GATEWAY_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminPaymentGatewayFeedback {
  readonly messageKey: string;
  readonly variant: "success" | "error";
}

export interface UseAdminPaymentGatewayReturn {
  readonly settings: PaymentGatewaySettingsEntity | null;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly currentPage: number;
  readonly setCurrentPage: (page: number) => void;
  readonly pageSize: number;
  readonly setPageSize: (size: number) => void;
  readonly totalUsers: number;
  readonly totalPages: number;
  readonly loading: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly feedbackMsg: AdminPaymentGatewayFeedback | null;
  readonly visibleUsers: readonly PaymentGatewayUserEntity[];
  readonly retryLoad: () => void;
  readonly handleUpdateGlobalMode: (mode: PaymentGatewayMode) => Promise<void>;
  readonly handleUpdateUserOverride: (
    userId: string,
    mode: PaymentGatewayMode | null
  ) => Promise<void>;
}

export function useAdminPaymentGateway(): UseAdminPaymentGatewayReturn {
  const [settings, setSettings] =
    useState<PaymentGatewaySettingsEntity | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] =
    useState<AdminPaymentGatewayFeedback | null>(null);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const useCase = getService(PAYMENT_GATEWAY_USECASE_TOKEN);
      const data = await useCase.getSettings({
        page: currentPage,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
      });
      setSettings(data);
      setTotalUsers(data.totalUsers);
      setTotalPages(data.totalPages);
    } catch {
      setError(ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSetSearchQuery = useCallback((q: string): void => {
    setSearchQuery(q);
    setCurrentPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number): void => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const handleUpdateGlobalMode = useCallback(
    async (mode: PaymentGatewayMode): Promise<void> => {
      setBusy(true);
      setFeedbackMsg(null);
      try {
        const useCase = getService(PAYMENT_GATEWAY_USECASE_TOKEN);
        const updated = await useCase.updateGlobalMode(mode);
        setSettings(updated);
        setFeedbackMsg({
          messageKey: ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SAVED,
          variant: "success",
        });
      } catch {
        setFeedbackMsg({
          messageKey: ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SAVE_ERROR,
          variant: "error",
        });
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const handleUpdateUserOverride = useCallback(
    async (userId: string, mode: PaymentGatewayMode | null): Promise<void> => {
      setBusy(true);
      setFeedbackMsg(null);
      try {
        const useCase = getService(PAYMENT_GATEWAY_USECASE_TOKEN);
        const updatedUser = await useCase.updateUserOverride(userId, mode);
        setSettings((current) =>
          current
            ? {
                ...current,
                users: current.users.map((user) =>
                  user.userId === userId ? updatedUser : user
                ),
              }
            : current
        );
        setFeedbackMsg({
          messageKey: ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SAVED,
          variant: "success",
        });
      } catch {
        setFeedbackMsg({
          messageKey: ADMIN_PAYMENT_GATEWAY_TEXT_CONSTANT.SAVE_ERROR,
          variant: "error",
        });
      } finally {
        setBusy(false);
      }
    },
    []
  );

  return {
    settings,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handleSetPageSize,
    totalUsers,
    totalPages,
    loading,
    busy,
    error,
    feedbackMsg,
    visibleUsers: settings?.users ?? [],
    retryLoad: () => void loadSettings(),
    handleUpdateGlobalMode,
    handleUpdateUserOverride,
  };
}
