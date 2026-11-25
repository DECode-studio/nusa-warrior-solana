"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminUserDetailEntity,
  UserRoleValue,
} from "@/client/domain/auth/entity/user_entity";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_USERS_TEXT_CONSTANT } from "../constants/TextConstant";
import { useTranslator } from "@/core/translator";

export type AdminUserCardFilter =
  | "ALL"
  | "CHARACTER"
  | "INSTRUMENT"
  | "MAJAPAHIT"
  | "PAJAJARAN";

export function useAdminUserDetail(userId: string) {
  const { locale } = useTranslator();
  const [detail, setDetail] = useState<AdminUserDetailEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [cardFilter, setCardFilter] = useState<AdminUserCardFilter>("ALL");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<{
    messageKey: string;
    variant: "success" | "error";
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const fetchDetail = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await getService(AUTH_USECASE_TOKEN).getAdminUserDetail(userId);
      setDetail(result);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : ADMIN_USERS_TEXT_CONSTANT.DETAIL_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const handleRoleChange = useCallback(async (nextRole: UserRoleValue): Promise<void> => {
    if (!detail || detail.user.role === nextRole || isUpdatingRole) return;
    setIsUpdatingRole(true);
    setRoleFeedback(null);
    try {
      const updatedUser = await getService(AUTH_USECASE_TOKEN).updateAdminUserRole({
        userId: detail.user.id,
        role: nextRole,
      });
      setDetail((current) => current
        ? { ...current, user: { ...current.user, role: updatedUser.role } }
        : null);
      setRoleFeedback({ messageKey: ADMIN_USERS_TEXT_CONSTANT.DETAIL_ROLE_UPDATED, variant: "success" });
    } catch {
      setRoleFeedback({ messageKey: ADMIN_USERS_TEXT_CONSTANT.DETAIL_ROLE_UPDATE_ERROR, variant: "error" });
    } finally {
      setIsUpdatingRole(false);
    }
  }, [detail, isUpdatingRole]);

  const handleCopyEmail = useCallback(async (email: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(false);
    }
  }, []);

  const cardsBySlug = useMemo(() => new Map(
    (detail?.ownedCards ?? []).map((card) => [card.slug, card])
  ), [detail]);
  const filteredCards = useMemo(() => {
    const query = cardSearch.trim().toLocaleLowerCase(locale);
    return (detail?.ownedCards ?? []).filter((card) => {
      const matchesSearch = !query || card.name.toLocaleLowerCase(locale).includes(query)
        || card.code.toLocaleLowerCase(locale).includes(query);
      if (!matchesSearch) return false;
      if (cardFilter === "CHARACTER") return card.cardType === "CHARACTER";
      if (cardFilter === "INSTRUMENT") return card.cardType === "INSTRUMENT";
      if (cardFilter === "MAJAPAHIT") return card.kingdom === "MAJAPAHIT";
      if (cardFilter === "PAJAJARAN") return card.kingdom === "PAJAJARAN";
      return true;
    });
  }, [detail, cardFilter, cardSearch, locale]);
  const totalCopies = useMemo(() =>
    (detail?.ownedCards ?? []).reduce((total, card) => total + card.quantity, 0),
  [detail]);
  const registeredDateLabel = useMemo(() => {
    if (!detail) return "";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(detail.user.createdAt));
  }, [detail, locale]);
  const deckUpdatedAtLabels = useMemo(() => new Map(
    (detail?.decks ?? []).map((deck) => [
      deck.id,
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(deck.updatedAt)),
    ])
  ), [detail, locale]);
  const deckCardCounts = useMemo(() => new Map(
    (detail?.decks ?? []).map((deck) => [
      deck.id,
      deck.characterSlugs.length + deck.instrumentSlugs.length,
    ])
  ), [detail]);

  return {
    detail, loading, error,
    retryLoad: () => void fetchDetail(),
    cardSearch, setCardSearch,
    cardFilter, setCardFilter, isUpdatingRole, roleFeedback,
    handleRoleChange, copiedEmail, handleCopyEmail, cardsBySlug,
    filteredCards, totalCopies, registeredDateLabel, deckUpdatedAtLabels,
    deckCardCounts,
  };
}
