"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CardEntity, OwnedCardEntity } from "@/client/domain/card/entity/card_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import type {
  CardTypeValue,
  KingdomValue,
} from "@/core/constants/cards-catalog";
import { getService } from "@/core/di/container";
import { CARD_USECASE_TOKEN, DECK_USECASE_TOKEN } from "@/core/di/tokens";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { DECK_BUILDER_TEXT_CONSTANT } from "../constants/TextConstant";
import { useTranslator } from "@/core/translator";
import { ApiClientError } from "@/core/http-client/api-client";

export interface DeckBuilderFeedback {
  readonly type: "success" | "error";
  readonly messageKey: string;
  readonly values?: Record<string, string | number>;
}

export interface UseDeckBuilderReturn {
  cards: OwnedCardEntity[];
  totalCards: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalCollectionCount: number;
  savedDecks: DeckEntity[];
  editingDeckId: string | null;
  deckName: string;
  setDeckName: (val: string) => void;
  deckDescription: string;
  setDeckDescription: (val: string) => void;
  selectedCharSlugs: string[];
  selectedInstSlugs: string[];
  filterType: "ALL" | CardTypeValue;
  setFilterType: (val: "ALL" | CardTypeValue) => void;
  filterKingdom: "ALL" | KingdomValue;
  setFilterKingdom: (val: "ALL" | KingdomValue) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  saving: boolean;
  feedbackMessage: DeckBuilderFeedback | null;
  inspectedCard: CardEntity | null;
  setInspectedCard: (card: CardEntity | null) => void;
  toggleCardSelection: (card: OwnedCardEntity) => void;
  loadDeckIntoEditor: (deck: DeckEntity) => void;
  cancelEdit: () => void;
  clearSelection: () => void;
  autoFillBalancedDeck: () => Promise<void>;
  saveCustomDeck: () => Promise<void>;
  deleteCustomDeck: (id: string) => Promise<void>;
}

export function useDeckBuilder(): UseDeckBuilderReturn {
  const { t } = useTranslator();
  const [allOwnedCards, setAllOwnedCards] = useState<OwnedCardEntity[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(12);
  const [totalCollectionCount, setTotalCollectionCount] = useState<number>(0);
  const [savedDecks, setSavedDecks] = useState<DeckEntity[]>([]);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckName, setDeckName] = useState<string>("");
  const [deckDescription, setDeckDescription] = useState<string>("");
  const [selectedCharSlugs, setSelectedCharSlugs] = useState<string[]>([]);
  const [selectedInstSlugs, setSelectedInstSlugs] = useState<string[]>([]);
  const [filterType, setFilterTypeState] = useState<"ALL" | CardTypeValue>("ALL");
  const [filterKingdom, setFilterKingdomState] = useState<"ALL" | KingdomValue>(
    "ALL"
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchInitialized, setIsSearchInitialized] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] =
    useState<DeckBuilderFeedback | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardEntity | null>(null);
  const hasInitializedComposition = useRef(false);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      const deckUseCase = getService(DECK_USECASE_TOKEN);
      const [ownedCards, fetchedDecks] = await Promise.all([
        cardUseCase.getOwnedCards(),
        deckUseCase.getDecks(),
      ]);

      setAllOwnedCards(ownedCards);
      setTotalCollectionCount(ownedCards.reduce((total, card) => total + card.quantity, 0));
      setSavedDecks(fetchedDecks);

      const customDeck = fetchedDecks.find((deck) => !deck.isPreset && !deck.isTemporary);
      const defaultDeck =
        customDeck ??
        fetchedDecks.find((deck) => !deck.isTemporary) ??
        fetchedDecks[0];
      if (!hasInitializedComposition.current) {
        hasInitializedComposition.current = true;
        if (defaultDeck) {
          setSelectedCharSlugs([...defaultDeck.characterSlugs]);
          setSelectedInstSlugs([...defaultDeck.instrumentSlugs]);
          if (customDeck) {
            setEditingDeckId(customDeck.id);
            setDeckName(customDeck.name);
            setDeckDescription(customDeck.description ?? "");
          }
        }
      }
    } catch {
      setError(DECK_BUILDER_TEXT_CONSTANT.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const readSearchFromUrl = (): void => {
      const value = new URLSearchParams(window.location.search).get("search") ?? "";
      setSearchInput(value);
      setDebouncedSearch(value.trim());
      setCurrentPage(1);
    };
    readSearchFromUrl();
    setIsSearchInitialized(true);
    window.addEventListener("popstate", readSearchFromUrl);
    return () => window.removeEventListener("popstate", readSearchFromUrl);
  }, []);

  useEffect(() => {
    if (!isSearchInitialized) return;
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [isSearchInitialized, searchInput]);

  useEffect(() => {
    if (!isSearchInitialized) return;
    setCurrentPage(1);
    const url = new URL(window.location.href);
    if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
    else url.searchParams.delete("search");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [debouncedSearch, isSearchInitialized]);

  const matchingCards = useMemo(() => {
    const normalizedQuery = debouncedSearch
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
    const matchingUniqueCards = allOwnedCards.filter((card) => {
      if (filterType !== "ALL" && card.cardType !== filterType) return false;
      if (filterKingdom !== "ALL" && card.kingdom !== filterKingdom) return false;
      if (!normalizedQuery) return true;
      const searchableText = [
        card.name,
        card.code,
        card.slug,
        card.effectName,
        card.effectDescriptionId,
        card.effectDescriptionEn,
        card.effectDescriptionZh,
      ]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
      return searchableText.includes(normalizedQuery);
    });

    return matchingUniqueCards.flatMap((card) =>
      Array.from({ length: card.quantity }, (_, index) => ({
        ...card,
        copyNumber: index + 1,
      }))
    );
  }, [allOwnedCards, debouncedSearch, filterKingdom, filterType]);

  const totalCards = matchingCards.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / pageSize));
  const cards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return matchingCards.slice(start, start + pageSize);
  }, [currentPage, matchingCards, pageSize]);

  const setFilterType = useCallback((val: "ALL" | CardTypeValue): void => {
    setFilterTypeState(val);
    setCurrentPage(1);
  }, []);

  const setFilterKingdom = useCallback((val: "ALL" | KingdomValue): void => {
    setFilterKingdomState(val);
    setCurrentPage(1);
  }, []);

  const setPageSize = useCallback((size: number): void => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const toggleCardSelection = useCallback((card: OwnedCardEntity): void => {
    setFeedbackMessage(null);
    gamelanAudio.playCardSelect();
    const copyNumber = card.copyNumber ?? 1;

    if (card.cardType === "CHARACTER") {
      setSelectedCharSlugs((prev) => {
        const selectedCopies = prev.filter((slug) => slug === card.slug).length;
        if (selectedCopies >= copyNumber) {
          let removed = false;
          return prev.filter((slug) => {
            if (slug === card.slug && !removed) {
              removed = true;
              return false;
            }
            return true;
          });
        }
        if (prev.length >= 10) {
          setFeedbackMessage({
            type: "error",
            messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_CHARACTER_ERROR,
          });
          return prev;
        }
        if (prev.length + selectedInstSlugs.length >= 20) {
          setFeedbackMessage({
            type: "error",
            messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_TOTAL_ERROR,
            values: { count: prev.length + selectedInstSlugs.length },
          });
          return prev;
        }
        return [...prev, card.slug];
      });
    } else {
      setSelectedInstSlugs((prev) => {
        const selectedCopies = prev.filter((slug) => slug === card.slug).length;
        if (selectedCopies >= copyNumber) {
          let removed = false;
          return prev.filter((slug) => {
            if (slug === card.slug && !removed) {
              removed = true;
              return false;
            }
            return true;
          });
        }
        if (prev.length >= 10) {
          setFeedbackMessage({
            type: "error",
            messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_INSTRUMENT_ERROR,
          });
          return prev;
        }
        if (selectedCharSlugs.length + prev.length >= 20) {
          setFeedbackMessage({
            type: "error",
            messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_TOTAL_ERROR,
            values: { count: selectedCharSlugs.length + prev.length },
          });
          return prev;
        }
        return [...prev, card.slug];
      });
    }
  }, [selectedCharSlugs.length, selectedInstSlugs.length]);

  const loadDeckIntoEditor = useCallback((deck: DeckEntity): void => {
    gamelanAudio.playCardSelect();
    setEditingDeckId(deck.id);
    setDeckName(deck.name);
    setDeckDescription(deck.description ?? "");
    setSelectedCharSlugs([...deck.characterSlugs.slice(0, 10)]);
    setSelectedInstSlugs([...deck.instrumentSlugs.slice(0, 10)]);
    setFeedbackMessage({
      type: "success",
      messageKey: DECK_BUILDER_TEXT_CONSTANT.DECK_LOADED,
      values: { name: deck.name },
    });
  }, []);

  const cancelEdit = useCallback((): void => {
    setEditingDeckId(null);
    setDeckName("");
    setDeckDescription("");
    setSelectedCharSlugs([]);
    setSelectedInstSlugs([]);
    setFeedbackMessage(null);
  }, []);

  const clearSelection = useCallback((): void => {
    setSelectedCharSlugs([]);
    setSelectedInstSlugs([]);
    setFeedbackMessage(null);
  }, []);

  const autoFillBalancedDeck = useCallback(async (): Promise<void> => {
    gamelanAudio.playCardSelect();
    try {
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      const allOwned = await cardUseCase.getOwnedCards();
      const pool =
        filterType !== "ALL" || filterKingdom !== "ALL"
          ? allOwned.filter((c) => {
              if (filterType !== "ALL" && c.cardType !== filterType) return false;
              if (filterKingdom !== "ALL" && c.kingdom !== filterKingdom) return false;
              return true;
            })
          : allOwned;

      const fillOwnedCopies = (
        candidates: OwnedCardEntity[],
        selected: string[],
        maxSlots: number,
      ): string[] => {
        const result = [...selected];
        const selectedCopies = new Map<string, number>();
        for (const slug of selected) {
          selectedCopies.set(slug, (selectedCopies.get(slug) ?? 0) + 1);
        }
        for (const card of candidates) {
          const alreadySelected = selectedCopies.get(card.slug) ?? 0;
          for (let copy = alreadySelected; copy < card.quantity && result.length < maxSlots; copy += 1) {
            result.push(card.slug);
            selectedCopies.set(card.slug, copy + 1);
          }
          if (result.length >= maxSlots) break;
        }
        return result;
      };

      const nextChars = fillOwnedCopies(
        pool.filter((card) => card.cardType === "CHARACTER"),
        selectedCharSlugs,
        10,
      );
      const nextInsts = fillOwnedCopies(
        pool.filter((card) => card.cardType === "INSTRUMENT"),
        selectedInstSlugs,
        8,
      );

      setSelectedCharSlugs(nextChars.slice(0, 10));
      setSelectedInstSlugs(nextInsts.slice(0, 10));
      setFeedbackMessage({
        type: "success",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.AUTOFILL_COMPLETED,
      });
    } catch {
      setFeedbackMessage({
        type: "error",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.LOAD_ERROR,
      });
    }
  }, [filterKingdom, filterType, selectedCharSlugs, selectedInstSlugs]);

  const saveCustomDeck = useCallback(async (): Promise<void> => {
    if (selectedCharSlugs.length === 0 || selectedCharSlugs.length > 10) {
      setFeedbackMessage({
        type: "error",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_CHARACTER_ERROR,
      });
      return;
    }

    if (selectedInstSlugs.length > 10) {
      setFeedbackMessage({
        type: "error",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_INSTRUMENT_ERROR,
      });
      return;
    }

    if (selectedCharSlugs.length + selectedInstSlugs.length > 20) {
      setFeedbackMessage({
        type: "error",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.MAX_TOTAL_ERROR,
        values: { count: selectedCharSlugs.length + selectedInstSlugs.length },
      });
      return;
    }

    setSaving(true);
    setFeedbackMessage(null);
    try {
      const deckUseCase = getService(DECK_USECASE_TOKEN);
      const request = {
        name: deckName.trim() || t(DECK_BUILDER_TEXT_CONSTANT.DEFAULT_DECK_NAME),
        description: deckDescription.trim() || null,
        kingdomFilter: "MIXED",
        characterSlugs: selectedCharSlugs,
        instrumentSlugs: selectedInstSlugs,
      } as const;
      const saved = editingDeckId
        ? await deckUseCase.updateDeck(editingDeckId, request)
        : await deckUseCase.createDeck(request);
      gamelanAudio.playInstrumentBuff(true);
      setSavedDecks((prev) => editingDeckId
        ? prev.map((deck) => deck.id === saved.id ? saved : deck)
        : [saved, ...prev]);
      setEditingDeckId(saved.id);
      setFeedbackMessage({
        type: "success",
        messageKey: editingDeckId
          ? DECK_BUILDER_TEXT_CONSTANT.DECK_UPDATED
          : DECK_BUILDER_TEXT_CONSTANT.DECK_SAVED,
        values: { name: saved.name },
      });
    } catch (error) {
      setFeedbackMessage({
        type: "error",
        messageKey: error instanceof ApiClientError && error.status === 409
          ? DECK_BUILDER_TEXT_CONSTANT.DECK_LOCKED_ERROR
          : editingDeckId
            ? DECK_BUILDER_TEXT_CONSTANT.UPDATE_DECK_ERROR
            : DECK_BUILDER_TEXT_CONSTANT.SAVE_DECK_ERROR,
      });
    } finally {
      setSaving(false);
    }
  }, [deckDescription, deckName, editingDeckId, selectedCharSlugs, selectedInstSlugs, t]);

  const deleteCustomDeck = useCallback(async (id: string): Promise<void> => {
    try {
      const deckUseCase = getService(DECK_USECASE_TOKEN);
      await deckUseCase.deleteDeck(id);
      setSavedDecks((prev) => prev.filter((d) => d.id !== id));
      if (editingDeckId === id) cancelEdit();
      setFeedbackMessage({
        type: "success",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.DECK_DELETED,
      });
    } catch {
      setFeedbackMessage({
        type: "error",
        messageKey: DECK_BUILDER_TEXT_CONSTANT.DELETE_DECK_ERROR,
      });
    }
  }, [cancelEdit, editingDeckId]);

  return {
    cards,
    totalCards,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCollectionCount,
    savedDecks,
    editingDeckId,
    deckName,
    setDeckName,
    deckDescription,
    setDeckDescription,
    selectedCharSlugs,
    selectedInstSlugs,
    filterType,
    setFilterType,
    filterKingdom,
    setFilterKingdom,
    searchInput,
    setSearchInput,
    loading,
    error,
    retryLoad: () => void loadData(),
    saving,
    feedbackMessage,
    inspectedCard,
    setInspectedCard,
    toggleCardSelection,
    loadDeckIntoEditor,
    cancelEdit,
    clearSelection,
    autoFillBalancedDeck,
    saveCustomDeck,
    deleteCustomDeck,
  };
}
