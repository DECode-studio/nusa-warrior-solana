"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TransactionHistoryPageEntity,
  TransactionHistoryQuery,
} from "@/client/domain/shop/entity/shop_entity";
import { getService } from "@/core/di/container";
import { SHOP_USECASE_TOKEN } from "@/core/di/tokens";

export interface UseTransactionHistoryReturn {
  result: TransactionHistoryPageEntity | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useTransactionHistory(
  query: TransactionHistoryQuery
): UseTransactionHistoryReturn {
  const [result, setResult] = useState<TransactionHistoryPageEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const requestSequence = useRef<number>(0);

  const load = useCallback(async (): Promise<void> => {
    const currentRequest = requestSequence.current + 1;
    requestSequence.current = currentRequest;
    setLoading(true);
    setError(false);
    try {
      const shopUseCase = getService(SHOP_USECASE_TOKEN);
      const history = await shopUseCase.getTransactionHistory(query);
      if (currentRequest === requestSequence.current) setResult(history);
    } catch {
      if (currentRequest === requestSequence.current) setError(true);
    } finally {
      if (currentRequest === requestSequence.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return { result, loading, error, reload: () => void load() };
}
