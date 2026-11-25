"use client";

import { useCallback, useEffect, useState } from "react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { getService } from "@/core/di/container";
import { CARD_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { ApiClientError } from "@/core/http-client/api-client";

export interface UseHomeReturn {
  featuredCards: CardEntity[];
  totalCardsCount: number;
  loading: boolean;
  error: string | null;
  inspectedCard: CardEntity | null;
  setInspectedCard: (card: CardEntity | null) => void;
  retryLoad: () => void;
}

export function useHome(): UseHomeReturn {
  const { t } = useTranslator();
  const [featuredCards, setFeaturedCards] = useState<CardEntity[]>([]);
  const [totalCardsCount, setTotalCardsCount] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardEntity | null>(null);

  const loadFeatured = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      const allCards = await cardUseCase.getCards();
      setTotalCardsCount(allCards.length);
      const highlightSlugs = [
        "hayam-wuruk",
        "gajah-mada",
        "tribhuwana-wijayatunggadewi",
        "sri-baduga-maharaja",
        "dyah-pitaloka",
        "bujangga-manik",
        "gong-ageng",
        "angklung-buhun",
      ];
      const picks = highlightSlugs
        .map((slug) => allCards.find((c) => c.slug === slug))
        .filter((c): c is CardEntity => c !== undefined);
      setFeaturedCards(picks);
    } catch (err: unknown) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : t("home.loadFallbackError")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadFeatured();
  }, [loadFeatured]);

  return {
    featuredCards,
    totalCardsCount,
    loading,
    error,
    inspectedCard,
    setInspectedCard,
    retryLoad: () => {
      void loadFeatured();
    },
  };
}

