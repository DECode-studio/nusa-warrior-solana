"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserEntity } from "@/client/domain/auth/entity/user_entity";
import type { MatchLogEntity } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import { getService } from "@/core/di/container";
import {
  AUTH_USECASE_TOKEN,
  BATTLE_USECASE_TOKEN,
  CARD_USECASE_TOKEN,
  DECK_USECASE_TOKEN,
} from "@/core/di/tokens";
import { USER_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UseUserDashboardReturn {
  currentUser: UserEntity | null;
  cards: CardEntity[];
  decks: DeckEntity[];
  matchHistory: MatchLogEntity[];
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
}

export function useUserDashboard(): UseUserDashboardReturn {
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(null);
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [decks, setDecks] = useState<DeckEntity[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchLogEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      const deckUseCase = getService(DECK_USECASE_TOKEN);
      const battleUseCase = getService(BATTLE_USECASE_TOKEN);

      const [user, allCards, allDecks, history] = await Promise.all([
        authUseCase.getCurrentUser(),
        cardUseCase.getCards(),
        deckUseCase.getDecks(),
        battleUseCase.getMatchHistory(),
      ]);

      setCurrentUser(user);
      setCards(allCards);
      setDecks(allDecks);
      setMatchHistory(history);
    } catch {
      setError(USER_DASHBOARD_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    currentUser,
    cards,
    decks,
    matchHistory,
    loading,
    error,
    retryLoad: () => void loadDashboard(),
  };
}

