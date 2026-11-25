"use client";

import { useCallback, useEffect, useState } from "react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_CARDS_TEXT_CONSTANT } from "../constants/TextConstant";

export function useAdminCardRecord(slug: string): {
  card: CardEntity | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [card, setCard] = useState<CardEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getService(AUTH_USECASE_TOKEN)
      .getAdminCards()
      .then((cards) => {
        if (active) setCard(cards.find((item) => item.slug === slug) ?? null);
      })
      .catch(() => {
        if (active) setError(ADMIN_CARDS_TEXT_CONSTANT.RECORD_LOAD_ERROR);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { card, loading, error, reload };
}
