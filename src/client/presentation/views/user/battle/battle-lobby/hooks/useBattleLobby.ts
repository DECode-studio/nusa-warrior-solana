"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BattleSessionEntity, BotDifficulty, MatchLogEntity, QuickMatchQueueEntity } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import { getService } from "@/core/di/container";
import { BATTLE_USECASE_TOKEN, CARD_USECASE_TOKEN, DECK_USECASE_TOKEN } from "@/core/di/tokens";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { ApiClientError } from "@/core/http-client/api-client";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

const ACTIVE_SESSION_KEY = "nusa-active-battle-session";
const SELECTED_DECK_KEY = "nusa-battle-selected-deck";
const DIFFICULTY_KEY = "nusa-battle-bot-difficulty";

function saveSessionId(sessionId: string): void {
  window.localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  window.sessionStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export function useBattleLobby() {
  const router = useRouter();
  const { locale, t } = useTranslator();
  const [allCards, setAllCards] = useState<CardEntity[]>([]);
  const [decks, setDecks] = useState<DeckEntity[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchLogEntity[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("EASY");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedBattleSession, setHasSavedBattleSession] = useState(false);
  const [quickMatchQueue, setQuickMatchQueue] = useState<QuickMatchQueueEntity | null>(null);
  const [quickMatchError, setQuickMatchError] = useState<string | null>(null);
  const [quickMatchAgreementOpen, setQuickMatchAgreementOpen] = useState(false);
  const [activeBattleSession, setActiveBattleSession] = useState<BattleSessionEntity | null>(null);
  const [endingActiveBattle, setEndingActiveBattle] = useState(false);

  const loadLobbyData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [cards, fetchedDecks, history] = await Promise.all([
        getService(CARD_USECASE_TOKEN).getCards(),
        getService(DECK_USECASE_TOKEN).getDecks(),
        getService(BATTLE_USECASE_TOKEN).getMatchHistory(),
      ]);
      setAllCards(cards);
      setDecks(fetchedDecks);
      setMatchHistory(history);
      const defaultDeck = fetchedDecks.find((deck) => !deck.isPreset && !deck.isTemporary)
        ?? fetchedDecks.find((deck) => deck.isTemporary)
        ?? fetchedDecks[0];
      const storedDeckId = window.localStorage.getItem(SELECTED_DECK_KEY);
      setSelectedDeckId(fetchedDecks.some((deck) => deck.id === storedDeckId)
        ? storedDeckId ?? ""
        : defaultDeck?.id ?? "");
      const storedDifficulty = window.localStorage.getItem(DIFFICULTY_KEY);
      if (storedDifficulty === "EASY" || storedDifficulty === "MEDIUM" || storedDifficulty === "HARD") {
        setBotDifficulty(storedDifficulty);
      }
      const activeId = window.localStorage.getItem(ACTIVE_SESSION_KEY)
        ?? window.sessionStorage.getItem(ACTIVE_SESSION_KEY);
      setHasSavedBattleSession(Boolean(activeId));
    } catch {
      setError(BATTLE_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLobbyData(); }, [loadLobbyData]);

  useEffect(() => {
    let cancelled = false;
    void getService(BATTLE_USECASE_TOKEN).getQuickMatchStatus().then((queue) => {
      if (!cancelled && queue?.status === "WAITING") setQuickMatchQueue(queue);
      if (!cancelled && queue?.status === "MATCHED" && queue.session) {
        saveSessionId(queue.session.id);
        router.replace(ROUTES.USER_BATTLE_ARENA(locale));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [locale, router]);

  useEffect(() => {
    if (quickMatchQueue?.status !== "WAITING") return;
    const interval = window.setInterval(() => {
      void getService(BATTLE_USECASE_TOKEN).searchQuickMatch().then((queue) => {
        if (!queue) { setQuickMatchQueue(null); return; }
        setQuickMatchQueue(queue);
        if (queue.status === "MATCHED" && queue.session) {
          saveSessionId(queue.session.id);
          router.push(ROUTES.USER_BATTLE_ARENA(locale));
        }
      }).catch(() => setQuickMatchError(BATTLE_TEXT_CONSTANT.START_MATCH_SERVER_ERROR));
    }, 2_000);
    return () => window.clearInterval(interval);
  }, [locale, quickMatchQueue, router]);

  const activeLobbyDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null,
    [decks, selectedDeckId],
  );
  const previewDeckCards = useMemo(() => {
    if (!activeLobbyDeck) return [];
    const bySlug = new Map(allCards.map((card) => [card.slug, card]));
    return activeLobbyDeck.characterSlugs.slice(0, 5)
      .map((slug) => bySlug.get(slug))
      .filter((card): card is CardEntity => Boolean(card));
  }, [activeLobbyDeck, allCards]);

  const selectDeck = (deckId: string): void => {
    setSelectedDeckId(deckId);
    window.localStorage.setItem(SELECTED_DECK_KEY, deckId);
  };
  const selectDifficulty = (difficulty: BotDifficulty): void => {
    setBotDifficulty(difficulty);
    window.localStorage.setItem(DIFFICULTY_KEY, difficulty);
  };
  const enterArena = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const battle = getService(BATTLE_USECASE_TOKEN);
      const currentId = window.localStorage.getItem(ACTIVE_SESSION_KEY)
        ?? window.sessionStorage.getItem(ACTIVE_SESSION_KEY);
      const session = currentId
        ? await battle.reconnectSession(currentId)
        : await battle.getActiveSession();
      const activeSession = session ?? await battle.createSession({
        deckId: selectedDeckId,
        idempotencyKey: crypto.randomUUID(),
        botDifficulty,
      });
      saveSessionId(activeSession.id);
      router.push(ROUTES.USER_BATTLE_ARENA(locale));
    } catch {
      setError(BATTLE_TEXT_CONSTANT.START_MATCH_SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  };
  const startQuickMatch = async (): Promise<void> => {
    if (!selectedDeckId) throw new Error(BATTLE_TEXT_CONSTANT.DECK_REQUIRED);
    setQuickMatchError(null);
    setActiveBattleSession(null);
    try {
      const queue = await getService(BATTLE_USECASE_TOKEN).joinQuickMatch({
        deckId: selectedDeckId,
        idempotencyKey: crypto.randomUUID(),
        acceptCardStake: true,
      });
      setQuickMatchQueue(queue);
      if (queue.status === "MATCHED" && queue.session) {
        saveSessionId(queue.session.id);
        router.push(ROUTES.USER_BATTLE_ARENA(locale));
      }
    } catch (cause) {
      setQuickMatchError(cause instanceof ApiClientError ? cause.message : t(BATTLE_TEXT_CONSTANT.START_MATCH_SERVER_ERROR));
      if (cause instanceof ApiClientError && cause.status === 409) {
        const activeSession = await getService(BATTLE_USECASE_TOKEN).getActiveSession().catch(() => null);
        if (activeSession?.status === "ACTIVE") setActiveBattleSession(activeSession);
      }
      throw cause;
    }
  };

  const continueActiveBattle = (): void => {
    if (!activeBattleSession) return;
    saveSessionId(activeBattleSession.id);
    router.push(ROUTES.USER_BATTLE_ARENA(locale));
  };

  const surrenderActiveBattle = async (): Promise<void> => {
    if (!activeBattleSession || endingActiveBattle) return;
    setEndingActiveBattle(true);
    try {
      const updated = await getService(BATTLE_USECASE_TOKEN).submitAction(activeBattleSession.id, {
        expectedSequence: activeBattleSession.sequence,
        idempotencyKey: crypto.randomUUID(),
        action: { type: "SURRENDER" },
      });
      if (updated.status === "ACTIVE") throw new Error(BATTLE_TEXT_CONSTANT.SURRENDER_ERROR);
      if (window.localStorage.getItem(ACTIVE_SESSION_KEY) === activeBattleSession.id) {
        window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
      if (window.sessionStorage.getItem(ACTIVE_SESSION_KEY) === activeBattleSession.id) {
        window.sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      }
      setHasSavedBattleSession(false);
      setActiveBattleSession(null);
      setQuickMatchError(t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_ACTIVE_ENDED));
    } catch (cause: unknown) {
      setQuickMatchError(cause instanceof ApiClientError ? cause.message : t(BATTLE_TEXT_CONSTANT.SURRENDER_ERROR));
    } finally {
      setEndingActiveBattle(false);
    }
  };
  const cancelQuickMatch = async (): Promise<boolean> => {
    const battle = getService(BATTLE_USECASE_TOKEN);
    const cancelled = await battle.cancelQuickMatch();
    if (!cancelled) {
      const queue = await battle.getQuickMatchStatus();
      if (queue?.status === "MATCHED" && queue.session) {
        saveSessionId(queue.session.id);
        router.push(ROUTES.USER_BATTLE_ARENA(locale));
        return false;
      }
    }
    setQuickMatchQueue(null);
    setQuickMatchError(null);
    return cancelled;
  };

  const browsePublicLeagues = async (): Promise<void> => {
    const cancelled = await cancelQuickMatch();
    if (cancelled) {
      router.push(ROUTES.USER_LEAGUES(locale));
      return;
    }
    const latestQueue = await getService(BATTLE_USECASE_TOKEN).getQuickMatchStatus();
    if (latestQueue?.status === "MATCHED" && latestQueue.session) {
      saveSessionId(latestQueue.session.id);
      router.push(ROUTES.USER_BATTLE_ARENA(locale));
      return;
    }
    router.push(ROUTES.USER_LEAGUES(locale));
  };

  return {
    decks, selectedDeckId, selectDeck, botDifficulty, selectDifficulty,
    previewDeckCards, activeLobbyDeck, matchHistory, loading, error,
    hasSavedBattleSession, enterArena, retry: loadLobbyData,
    quickMatchQueue, quickMatchError, quickMatchAgreementOpen,
    activeBattleSession, endingActiveBattle, continueActiveBattle, surrenderActiveBattle,
    setQuickMatchAgreementOpen, startQuickMatch, cancelQuickMatch,
    browsePublicLeagues,
  };
}
