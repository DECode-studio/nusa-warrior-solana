"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminUserRecordEntity,
  UserRoleValue,
} from "@/client/domain/auth/entity/user_entity";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_USERS_TEXT_CONSTANT } from "../constants/TextConstant";
import type { AdminUsersFeedback } from "../types";

export interface UseAdminUsersReturn {
  users: AdminUserRecordEntity[];
  filteredUsers: AdminUserRecordEntity[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  feedbackMsg: AdminUsersFeedback | null;
  handleUpdateRole: (userId: string, role: UserRoleValue) => Promise<void>;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUserRecordEntity[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<AdminUsersFeedback | null>(null);

  const loadUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const result = await authUseCase.getAdminUsersPaginated({
        page: currentPage,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
      });
      setUsers(result.items);
      setTotalUsers(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError(ADMIN_USERS_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSetSearchQuery = useCallback((q: string): void => {
    setSearchQuery(q);
    setCurrentPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number): void => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const handleUpdateRole = useCallback(
    async (userId: string, role: UserRoleValue): Promise<void> => {
      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        const updated = await authUseCase.updateAdminUserRole({
          userId,
          role,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? updated : u))
        );
        setFeedbackMsg({
          messageKey: ADMIN_USERS_TEXT_CONSTANT.ROLE_UPDATED,
          variant: "success",
        });
      } catch {
        setFeedbackMsg({
          messageKey: ADMIN_USERS_TEXT_CONSTANT.ROLE_UPDATE_ERROR,
          variant: "error",
        });
      }
    },
    []
  );

  return {
    users,
    filteredUsers: users,
    totalUsers,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handleSetPageSize,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    loading,
    error,
    retryLoad: () => void loadUsers(),
    feedbackMsg,
    handleUpdateRole,
  };
}
