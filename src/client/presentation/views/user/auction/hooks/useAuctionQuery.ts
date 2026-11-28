"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getService } from "@/core/di/container";
import { AUCTION_USECASE_TOKEN } from "@/core/di/tokens";
import type { AuctionListEntity } from "@/client/domain/auction/entity/auction_entity";
import type { AuctionListQuery } from "@/client/domain/auction/repository/auction_repository";

export interface UseAuctionQueryReturn {
  readonly data: AuctionListEntity | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
}

export function useAuctionQuery(
  query: AuctionListQuery,
  fallbackErrorMessage: string
): UseAuctionQueryReturn {
  const auctionUseCase = useMemo(() => getService(AUCTION_USECASE_TOKEN), []);
  const [data, setData] = useState<AuctionListEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef<number>(0);

  const refetch = useCallback(async (): Promise<void> => {
    const currentSeq = requestSeq.current + 1;
    requestSeq.current = currentSeq;
    setIsLoading(true);
    setError(null);
    try {
      const response = await auctionUseCase.listAuctions(query);
      if (currentSeq === requestSeq.current) {
        setData(response);
      }
    } catch (err) {
      if (currentSeq === requestSeq.current) {
        setError(err instanceof Error ? err.message : fallbackErrorMessage);
      }
    } finally {
      if (currentSeq === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [auctionUseCase, fallbackErrorMessage, query]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
