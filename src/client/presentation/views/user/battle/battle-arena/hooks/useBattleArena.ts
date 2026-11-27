"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type {
  BattleDuelOutcome,
  BattleAction,
  BattleSessionEntity,
  BattleStateEntity,
  BotDifficulty,
} from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import { getService } from "@/core/di/container";
import {
  BATTLE_USECASE_TOKEN,
  CARD_USECASE_TOKEN,
  DECK_USECASE_TOKEN,
  STORY_MODE_USECASE_TOKEN,
} from "@/core/di/tokens";
import { gamelanAudio } from "@/core/utils/audio-synth";
import { sendBatchBase64SolanaTxs } from "@/core/utils/solana-tx-client";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

const ACTIVE_BATTLE_SESSION_KEY = "nusa-active-battle-session";
const LAST_COMPLETED_BATTLE_SESSION_KEY = "nusa-last-completed-battle-session";
const ACTIVE_LEAGUE_ROOM_KEY = "nusa-active-league-room";

function readActiveBattleSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(ACTIVE_BATTLE_SESSION_KEY) ??
    window.sessionStorage.getItem(ACTIVE_BATTLE_SESSION_KEY)
  );
}

function saveActiveBattleSessionId(sessionId: string): void {
  window.localStorage.setItem(ACTIVE_BATTLE_SESSION_KEY, sessionId);
  window.sessionStorage.setItem(ACTIVE_BATTLE_SESSION_KEY, sessionId);
}

function removeActiveBattleSessionId(): void {
  window.localStorage.removeItem(ACTIVE_BATTLE_SESSION_KEY);
  window.sessionStorage.removeItem(ACTIVE_BATTLE_SESSION_KEY);
}

function wasCompletedBattleAlreadyShown(sessionId: string): boolean {
  return window.localStorage.getItem(LAST_COMPLETED_BATTLE_SESSION_KEY) === sessionId;
}

export interface ActiveInstrumentFlyerState {
  instrument: CardEntity;
  targetName: string;
  actor: "PLAYER" | "BOT";
  synergyTriggered: boolean;
}

export interface BattleAttackIndicatorState {
  key: string;
  attackerSide: "PLAYER" | "BOT";
  attackerFrontIndex: number;
  defenderFrontIndex: number;
  startedAt: number;
}

export interface UseBattleArenaReturn {
  isBattleStarted: boolean;
  exitBattleArena: () => void;
  allCards: CardEntity[];
  battleState: BattleStateEntity | null;
  pendingDiceSession: BattleSessionEntity | null;
  isOpeningDealAnimating: boolean;
  isOpeningDealRevealing: boolean;
  turnDeadlineAt: string | null;
  sessionReady: boolean;
  error: string | null;
  selectedHandInstanceId: string | null;
  setSelectedHandInstanceId: (id: string | null) => void;
  selectedAttackerFrontIndex: number | null;
  setSelectedAttackerFrontIndex: (index: number | null) => void;
  inspectedCard: CardEntity | null;
  setInspectedCard: (card: CardEntity | null) => void;
  activeDuelModal: BattleDuelOutcome | null;
  autoContinueDuelOutcomeId: string | null;
  dismissDuelModal: () => void;
  attackIndicator: BattleAttackIndicatorState | null;
  completeAttackIndicator: (key: string) => void;
  instrumentFlyer: ActiveInstrumentFlyerState | null;
  showOpeningDeal: boolean;
  dealAnimationToken: number;
  confirmingSurrender: boolean;
  setConfirmingSurrender: (val: boolean) => void;
  isSurrendering: boolean;
  startNewMatch: (customDeckId?: string, customDiff?: BotDifficulty) => void;
  handleDiceRollComplete: (_rolls?: { playerRoll: number; botRoll: number }) => Promise<void>;
  handleDiceRollAnimationComplete: () => void;
  handleOpeningDealRevealStart: () => void;
  handleOpeningDealAnimationComplete: () => void;
  handlePlayerCharacterSlotClick: (
    row: "FRONT" | "SECOND",
    index: number
  ) => void;
  handleBotFrontSlotClick: (defenderFrontIndex: number) => void;
  handleOpponentCharacterSlotClick: (row: "FRONT" | "SECOND", index: number) => void;
  handleConfirmDefenderResponse: () => void;
  handleContinueClash: () => void;
  handleDiscardSelectedInstrument: () => void;
  handleSurrender: () => void;
  handleEndTurn: () => void;
  isQuickMatch: boolean;
  isLeagueMatch: boolean;
  rewardCardSlug: string | null;
  rewardCardQuantity: number | null;
  vaultPda: string | null;
  viewerLockTxSignature: string | null;
  settleTxSignature: string | null;
  vaultLockRequired: boolean;
  viewerVaultLocked: boolean;
  opponentVaultLocked: boolean;
  isLockingVault: boolean;
  vaultLockError: string | null;
  handleLockCardsToVault: () => Promise<void>;
  handleCancelPreLockMatch: () => Promise<boolean>;
  isStoryMode: boolean;
  storyNusaPoints: number | null;
  storyKingdom: "MAJAPAHIT" | "PAJAJARAN" | null;
  storyOpponentTitle: string | null;
}

export function useBattleArena(): UseBattleArenaReturn {
  const { connection } = useConnection();
  const {
    connected,
    publicKey,
    signAllTransactions,
    signTransaction,
    sendTransaction,
  } = useWallet();
  const [isBattleStarted, setIsBattleStarted] = useState<boolean>(false);
  const [allCards, setAllCards] = useState<CardEntity[]>([]);
  const [decks, setDecks] = useState<DeckEntity[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("EASY");
  const [battleState, setBattleState] = useState<BattleStateEntity | null>(
    null
  );
  const [pendingDiceSession, setPendingDiceSession] = useState<BattleSessionEntity | null>(null);
  const [isOpeningDealAnimating, setIsOpeningDealAnimating] = useState(false);
  const [isOpeningDealRevealing, setIsOpeningDealRevealing] = useState(false);
  const [turnDeadlineAt, setTurnDeadlineAt] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedHandInstanceId, setSelectedHandInstanceId] = useState<
    string | null
  >(null);
  const [selectedAttackerFrontIndex, setSelectedAttackerFrontIndex] = useState<
    number | null
  >(null);
  const [inspectedCard, setInspectedCard] = useState<CardEntity | null>(null);
  const [activeDuelModal, setActiveDuelModal] =
    useState<BattleDuelOutcome | null>(null);
  const [autoContinueDuelOutcomeId, setAutoContinueDuelOutcomeId] = useState<string | null>(null);
  const [attackIndicator, setAttackIndicator] = useState<BattleAttackIndicatorState | null>(null);
  const deferredDuelStateRef = useRef<BattleStateEntity | null>(null);
  const pendingDiceSessionRef = useRef<BattleSessionEntity | null>(null);
  const isOpeningDealAnimatingRef = useRef(false);
  const battleStateRef = useRef<BattleStateEntity | null>(null);
  const [instrumentFlyer, setInstrumentFlyer] =
    useState<ActiveInstrumentFlyerState | null>(null);
  const [showOpeningDeal, setShowOpeningDeal] = useState<boolean>(false);
  const [dealAnimationToken, setDealAnimationToken] = useState<number>(0);
  const [confirmingSurrender, setConfirmingSurrender] =
    useState<boolean>(false);
  const [isSurrendering, setIsSurrendering] = useState<boolean>(false);
  const [isQuickMatch, setIsQuickMatch] = useState(false);
  const [isLeagueMatch, setIsLeagueMatch] = useState(false);
  const [rewardCardSlug, setRewardCardSlug] = useState<string | null>(null);
  const [rewardCardQuantity, setRewardCardQuantity] = useState<number | null>(null);
  const [vaultPda, setVaultPda] = useState<string | null>(null);
  const [viewerLockTxSignature, setViewerLockTxSignature] = useState<string | null>(null);
  const [settleTxSignature, setSettleTxSignature] = useState<string | null>(null);
  const [vaultLockRequired, setVaultLockRequired] = useState(false);
  const [viewerVaultLocked, setViewerVaultLocked] = useState(false);
  const [opponentVaultLocked, setOpponentVaultLocked] = useState(false);
  const [isLockingVault, setIsLockingVault] = useState(false);
  const [vaultLockError, setVaultLockError] = useState<string | null>(null);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyNusaPoints, setStoryNusaPoints] = useState<number | null>(null);
  const [storyKingdom, setStoryKingdom] = useState<"MAJAPAHIT" | "PAJAJARAN" | null>(null);
  const [storyOpponentTitle, setStoryOpponentTitle] = useState<string | null>(null);

  const recordedMatchIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionSequenceRef = useRef<number>(0);
  const lastDuelOutcomeRef = useRef<string | null>(null);
  const attackIndicatorRef = useRef<BattleAttackIndicatorState | null>(null);
  const storyClaimedBattleIdRef = useRef<string | null>(null);

  const startAttackIndicator = useCallback((
    attackerSide: "PLAYER" | "BOT",
    attackerFrontIndex: number,
    defenderFrontIndex: number,
    key = crypto.randomUUID(),
  ): BattleAttackIndicatorState => {
    const current = attackIndicatorRef.current;
    if (
      current && current.attackerSide === attackerSide &&
      current.attackerFrontIndex === attackerFrontIndex &&
      current.defenderFrontIndex === defenderFrontIndex &&
      Date.now() - current.startedAt < 1500
    ) return current;
    const next = { key, attackerSide, attackerFrontIndex, defenderFrontIndex, startedAt: Date.now() };
    attackIndicatorRef.current = next;
    setAttackIndicator(next);
    return next;
  }, []);

  const completeAttackIndicator = useCallback((key: string): void => {
    if (attackIndicatorRef.current?.key !== key) return;
    attackIndicatorRef.current = null;
    setAttackIndicator(null);
  }, []);

  const applySessionView = useCallback((view: BattleSessionEntity, force = false): void => {
    sessionIdRef.current = view.id;
    sessionSequenceRef.current = view.sequence;
    if (
      !force &&
      (battleStateRef.current?.phase === "DICE_ROLL" || isOpeningDealAnimatingRef.current) &&
      view.state.diceRollResult
    ) {
      pendingDiceSessionRef.current = view;
      if (!isOpeningDealAnimatingRef.current) setPendingDiceSession(view);
      return;
    }
    setTurnDeadlineAt(view.turnDeadlineAt);
    setIsQuickMatch(Boolean(view.isQuickMatch));
    setIsLeagueMatch(view.rulesVersion === "league-v1");
    setIsStoryMode(Boolean(view.storyMissionId));
    setStoryKingdom(view.storyKingdom ?? null);
    setStoryOpponentTitle(view.opponentName ?? null);
    setVaultPda(view.vaultPda ?? null);
    setViewerLockTxSignature(view.viewerLockTxSignature ?? null);
    setSettleTxSignature(view.settleTxSignature ?? null);
    setVaultLockRequired(Boolean(view.vaultLockRequired));
    setViewerVaultLocked(Boolean(view.viewerVaultLocked));
    setOpponentVaultLocked(Boolean(view.opponentVaultLocked));
    if (view.id !== storyClaimedBattleIdRef.current) setStoryNusaPoints(null);
    if (view.rulesVersion !== "league-v1" && typeof window !== "undefined") {
      window.sessionStorage.removeItem(ACTIVE_LEAGUE_ROOM_KEY);
    }
    setRewardCardSlug(view.rewardCardSlug ?? null);
    if (view.status === "ABANDONED") {
      if (typeof window !== "undefined") {
        if (readActiveBattleSessionId() === view.id) removeActiveBattleSessionId();
      }
      setIsBattleStarted(false);
      return;
    }
    if (typeof window !== "undefined") {
      const isTerminal = view.status !== "ACTIVE" || view.state.phase === "MATCH_OVER";
      if (isTerminal) {
        window.localStorage.setItem(LAST_COMPLETED_BATTLE_SESSION_KEY, view.id);
        if (readActiveBattleSessionId() === view.id) removeActiveBattleSessionId();
      } else {
        saveActiveBattleSessionId(view.id);
      }
    }
    const isNewDuelOutcome = Boolean(
      view.state.lastDuelOutcome &&
      lastDuelOutcomeRef.current !== view.state.lastDuelOutcome.id
    );
    if (isNewDuelOutcome && battleStateRef.current) {
      deferredDuelStateRef.current = view.state;
    } else {
      battleStateRef.current = view.state;
      setBattleState(view.state);
    }
    if (view.state.phase === "DEFENDER_INSTRUMENT_RESPONSE" && view.state.pendingAttack) {
      const pending = view.state.pendingAttack;
      startAttackIndicator(pending.attackerSide, pending.attackerFrontIndex, pending.defenderFrontIndex);
    }
    if (view.state.lastDuelOutcome && isNewDuelOutcome) {
      const outcome = view.state.lastDuelOutcome;
      lastDuelOutcomeRef.current = outcome.id;
      setAutoContinueDuelOutcomeId(
        battleStateRef.current && view.state.turnNumber > battleStateRef.current.turnNumber
          ? outcome.id
          : null
      );
      attackIndicatorRef.current = null;
      setAttackIndicator(null);
      setActiveDuelModal(outcome);
      if (view.state.lastDuelOutcome.counterAttackTriggered) {
        gamelanAudio.playCounterAttack();
      } else {
        gamelanAudio.playClash();
      }
    }
  }, [startAttackIndicator]);

  const submitBattleAction = useCallback(async (action: BattleAction): Promise<BattleStateEntity> => {
    const matchId = sessionIdRef.current;
    if (!matchId) throw new Error(BATTLE_TEXT_CONSTANT.MATCH_NOT_CREATED);
    try {
      const battleUseCase = getService(BATTLE_USECASE_TOKEN);
      const view = await battleUseCase.submitAction(matchId, {
        expectedSequence: sessionSequenceRef.current,
        idempotencyKey: crypto.randomUUID(),
        action,
      });
      setError(null);
      applySessionView(view);
      return view.state;
    } catch (error) {
      const battleUseCase = getService(BATTLE_USECASE_TOKEN);
      const latest = await battleUseCase.getSession(matchId).catch(() => null);
      if (latest) applySessionView(latest);
      throw error;
    }
  }, [applySessionView]);

  const triggerInstrumentFlyer = useCallback(
    (
      instrument: CardEntity,
      targetName: string,
      actor: "PLAYER" | "BOT",
      synergyTriggered: boolean
    ): void => {
      setInstrumentFlyer({
        instrument,
        targetName,
        actor,
        synergyTriggered,
      });
      setTimeout(() => {
        setInstrumentFlyer(null);
      }, 1700);
    },
    []
  );

  const buildMatchFromDeck = useCallback(async (deckId: string, difficulty: BotDifficulty): Promise<void> => {
    if (!deckId) throw new Error(BATTLE_TEXT_CONSTANT.DECK_REQUIRED);
    const battleUseCase = getService(BATTLE_USECASE_TOKEN);
    const view = await battleUseCase.createSession({
      deckId,
      idempotencyKey: crypto.randomUUID(),
      botDifficulty: difficulty,
    });
    setSelectedHandInstanceId(null);
    setSelectedAttackerFrontIndex(null);
    pendingDiceSessionRef.current = null;
    isOpeningDealAnimatingRef.current = false;
    setIsOpeningDealAnimating(false);
    setIsOpeningDealRevealing(false);
    setPendingDiceSession(null);
    setActiveDuelModal(null);
    setAutoContinueDuelOutcomeId(null);
    setAttackIndicator(null);
    attackIndicatorRef.current = null;
    deferredDuelStateRef.current = null;
    battleStateRef.current = null;
    lastDuelOutcomeRef.current = null;
    recordedMatchIdRef.current = null;
    applySessionView(view);
  }, [applySessionView]);

  const loadArenaData = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const cardUseCase = getService(CARD_USECASE_TOKEN);
      const deckUseCase = getService(DECK_USECASE_TOKEN);
      const [fetchedCards, fetchedDecks] = await Promise.all([
        cardUseCase.getCards(),
        deckUseCase.getDecks(),
      ]);

      setAllCards(fetchedCards);
      setDecks(fetchedDecks);
      const defaultDeck =
        fetchedDecks.find((deck) => !deck.isPreset && !deck.isTemporary) ??
        fetchedDecks.find((deck) => deck.isTemporary) ??
        fetchedDecks[0];
      const defaultDeckId = defaultDeck?.id ?? "";
      const savedDeckId = window.localStorage.getItem("nusa-battle-selected-deck");
      const savedDifficulty = window.localStorage.getItem("nusa-battle-bot-difficulty");
      setSelectedDeckId(defaultDeckId);
      if (fetchedDecks.some((deck) => deck.id === savedDeckId)) {
        setSelectedDeckId(savedDeckId ?? defaultDeckId);
      }
      if (savedDifficulty === "EASY" || savedDifficulty === "MEDIUM" || savedDifficulty === "HARD") {
        setBotDifficulty(savedDifficulty);
      }
    } catch {
      setError(BATTLE_TEXT_CONSTANT.LOAD_ERROR);
    }
  }, []);

  useEffect(() => {
    void loadArenaData();
  }, [loadArenaData]);

  useEffect(() => {
    const savedSessionId = readActiveBattleSessionId();
    let cancelled = false;
    const reconnectRequest = savedSessionId
      ? getService(BATTLE_USECASE_TOKEN).reconnectSession(savedSessionId)
      : getService(BATTLE_USECASE_TOKEN).getActiveSession();
    void reconnectRequest
      .then((view) => {
        if (!cancelled) setSessionReady(true);
        if (cancelled) return;
        if (!view) {
          removeActiveBattleSessionId();
          if (savedSessionId) {
            setError(BATTLE_TEXT_CONSTANT.RECONNECT_EXPIRED);
          }
          return;
        }
        const isTerminal = view.status !== "ACTIVE" || view.state.phase === "MATCH_OVER";
        if (isTerminal && wasCompletedBattleAlreadyShown(view.id)) {
          removeActiveBattleSessionId();
          return;
        }
        applySessionView(view);
        setIsBattleStarted(true);
      })
      .catch(() => {
        if (!cancelled) setSessionReady(true);
        if (cancelled) return;
        setError(BATTLE_TEXT_CONSTANT.RECONNECT_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [applySessionView]);

  useEffect(() => {
    const isMatchOver = battleState?.phase === "MATCH_OVER";
    const waitingForSettlement = Boolean(
      isMatchOver && vaultLockRequired && !settleTxSignature
    );
    if (!isBattleStarted || !sessionIdRef.current || (isMatchOver && !waitingForSettlement)) {
      return;
    }
    // Gunakan recursive setTimeout (in-flight guard) alih-alih setInterval agar request
    // /reconnect tidak menumpuk paralel dan menghabiskan pool koneksi DB saat latency tinggi.
    let cancelled = false;
    let timerId: number | null = null;
    let postMatchRetries = 0;
    const intervalMs = isQuickMatch ? 2_000 : 15_000;

    const scheduleNext = () => {
      if (cancelled) return;
      if (waitingForSettlement && postMatchRetries >= 25) return;
      timerId = window.setTimeout(() => {
        const matchId = sessionIdRef.current;
        if (cancelled || !matchId) return;
        if (waitingForSettlement) postMatchRetries += 1;
        void getService(BATTLE_USECASE_TOKEN)
          .reconnectSession(matchId)
          .then((view) => {
            if (!cancelled && view) applySessionView(view);
          })
          .catch(() => {})
          .finally(() => {
            scheduleNext();
          });
      }, intervalMs);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [
    applySessionView,
    battleState?.phase,
    isBattleStarted,
    isQuickMatch,
    settleTxSignature,
    vaultLockRequired,
  ]);

  useEffect(() => {
    if (battleState?.phase !== "MATCH_OVER" || !settleTxSignature) return;
    void Promise.all([
      getService(DECK_USECASE_TOKEN).getDecks(),
      getService(CARD_USECASE_TOKEN).getOwnedCards(),
    ])
      .then(([updatedDecks, ownedCards]) => {
        if (rewardCardSlug) {
          setRewardCardQuantity(
            ownedCards.find((card) => card.slug === rewardCardSlug)?.quantity ?? 0
          );
        }
        setDecks(updatedDecks);
      })
      .catch(() => {});
  }, [battleState?.phase, rewardCardSlug, settleTxSignature]);

  const startNewMatch = useCallback(
    (customDeckId?: string, customDiff?: BotDifficulty): void => {
      const targetDeckId = customDeckId ?? selectedDeckId;
      const targetDiff = customDiff ?? botDifficulty;
      void buildMatchFromDeck(targetDeckId, targetDiff).catch(() => {
        setError(BATTLE_TEXT_CONSTANT.START_MATCH_ERROR);
        setIsBattleStarted(false);
      });
    },
    [botDifficulty, buildMatchFromDeck, selectedDeckId]
  );

  const exitBattleArena = useCallback((): void => {
    gamelanAudio.playCardSelect();
    setConfirmingSurrender(false);
    setIsBattleStarted(false);
  }, []);

  const handleDiceRollComplete = useCallback(
    async (_rolls?: { playerRoll: number; botRoll: number }): Promise<void> => {
      gamelanAudio.playDiceRoll();
      try {
        await submitBattleAction({ type: "ROLL_DICE" });
      } catch {
        setError(BATTLE_TEXT_CONSTANT.ROLL_DICE_ERROR);
        throw new Error("Dice roll request failed");
      }
    },
    [submitBattleAction]
  );

  const handleDiceRollAnimationComplete = useCallback((): void => {
    const pendingSession = pendingDiceSessionRef.current;
    const currentState = battleStateRef.current;
    const diceRollResult = pendingSession?.state.diceRollResult ?? currentState?.diceRollResult;
    if (pendingSession && currentState && diceRollResult) {
      const dealState: BattleStateEntity = {
        ...currentState,
        activePlayer: diceRollResult.firstPlayer,
        phase: "DRAW_INSTRUMENT",
        diceRollResult,
      };
      battleStateRef.current = dealState;
      setBattleState(dealState);
      setPendingDiceSession(null);
      isOpeningDealAnimatingRef.current = true;
      setIsOpeningDealAnimating(true);
      setIsOpeningDealRevealing(false);
      setDealAnimationToken((token) => token + 1);
      setShowOpeningDeal(true);
      return;
    }
    if (pendingSession) applySessionView(pendingSession, true);
  }, [applySessionView]);

  const handleOpeningDealRevealStart = useCallback((): void => {
    setIsOpeningDealRevealing(true);
  }, []);

  const handleOpeningDealAnimationComplete = useCallback((): void => {
    const pendingSession = pendingDiceSessionRef.current;
    pendingDiceSessionRef.current = null;
    isOpeningDealAnimatingRef.current = false;
    setPendingDiceSession(null);
    setIsOpeningDealAnimating(false);
    setIsOpeningDealRevealing(false);
    setShowOpeningDeal(false);
    if (pendingSession) applySessionView(pendingSession, true);
  }, [applySessionView]);

  useEffect(() => {
    if (!isBattleStarted || !battleState || activeDuelModal) return;

    if (
      battleState.phase === "MATCH_OVER" &&
      battleState.winner &&
      recordedMatchIdRef.current !== battleState.matchId
    ) {
      recordedMatchIdRef.current = battleState.matchId;
      if (battleState.winner === "PLAYER") {
        gamelanAudio.playVictory();
        const battleId = sessionIdRef.current;
        if (isStoryMode && battleId && storyClaimedBattleIdRef.current !== battleId) {
          storyClaimedBattleIdRef.current = battleId;
          const claimStoryReward = async (attempt: number): Promise<void> => {
            try {
              const result = await getService(STORY_MODE_USECASE_TOKEN).completeMission({ battleSessionId: battleId });
              setStoryNusaPoints(result.nusaPoints);
              if (result.rewardCard) setRewardCardSlug(result.rewardCard.slug);
              void getService(CARD_USECASE_TOKEN).getOwnedCards().then((ownedCards) => {
                if (result.rewardCard) setRewardCardQuantity(ownedCards.find((card) => card.slug === result.rewardCard?.slug)?.quantity ?? 0);
              }).catch(() => {});
            } catch {
              if (attempt < 2) window.setTimeout(() => void claimStoryReward(attempt + 1), 500 * (2 ** attempt));
              else storyClaimedBattleIdRef.current = null;
            }
          };
          void claimStoryReward(0);
        }
      } else {
        gamelanAudio.playDefeat();
      }

      const cardUseCase = getService(CARD_USECASE_TOKEN);
      void Promise.all([
        getService(DECK_USECASE_TOKEN).getDecks(),
        cardUseCase.getOwnedCards(),
      ]).then(([updatedDecks, ownedCards]) => {
        if (rewardCardSlug) {
          setRewardCardQuantity(
            ownedCards.find((card) => card.slug === rewardCardSlug)?.quantity ?? 0,
          );
        }
        setDecks(updatedDecks);
        setSelectedDeckId((current) =>
          updatedDecks.some((deck) => deck.id === current)
            ? current
            : updatedDecks[0]?.id ?? "",
        );
      }).catch(() => {});
      return;
    }

  }, [
    activeDuelModal,
    battleState,
    isBattleStarted,
    isStoryMode,
    rewardCardSlug,
    storyKingdom,
  ]);

  const handlePlayerCharacterSlotClick = useCallback(
    (row: "FRONT" | "SECOND", index: number): void => {
      if (!battleState) return;

      if (
        battleState.phase === "PROMOTE_CHARACTER" &&
        battleState.pendingPromotion?.side === "PLAYER"
      ) {
        if (row === "SECOND" && battleState.playerSecondRow[index]) {
          gamelanAudio.playCardSelect();
          void submitBattleAction({ type: "PROMOTE_CHARACTER", secondRowIndex: index }).catch(() =>
            setError(BATTLE_TEXT_CONSTANT.PROMOTION_ERROR)
          );
        }
        return;
      }

      if (selectedHandInstanceId) {
        const selectedInstrument = battleState.playerInstrumentHand.find(
          (item) => item.instanceId === selectedHandInstanceId
        )?.card;
        if (selectedInstrument?.effectType === "DEBUFF_ENEMY_ATK") return;
        const canPlayPreAttack =
          battleState.activePlayer === "PLAYER" &&
          battleState.phase === "PRE_ATTACK_INSTRUMENT";
        const canPlayDefenderResponse =
          battleState.phase === "DEFENDER_INSTRUMENT_RESPONSE" &&
          battleState.pendingAttack?.attackerSide === "BOT" &&
          row === "FRONT" &&
          battleState.pendingAttack.defenderFrontIndex === index;

        if (canPlayPreAttack || canPlayDefenderResponse) {
          const targetSlot =
            row === "FRONT"
              ? battleState.playerFrontRow[index]
              : battleState.playerSecondRow[index];
          const instItem = battleState.playerInstrumentHand.find(
            (h) => h.instanceId === selectedHandInstanceId
          );

          if (targetSlot && instItem) {
            setSelectedHandInstanceId(null);
            void submitBattleAction({
              type: "PLAY_INSTRUMENT",
              handInstanceId: selectedHandInstanceId,
              targetRow: row,
              targetIndex: index,
            }).then((updated) => {
              const updatedSlot = row === "FRONT" ? updated.playerFrontRow[index] : updated.playerSecondRow[index];
              const applied = updatedSlot?.appliedInstruments.at(-1);
              gamelanAudio.playInstrumentBuff(Boolean(applied?.synergyTriggered));
              triggerInstrumentFlyer(instItem.card, targetSlot.card.name, "PLAYER", Boolean(applied?.synergyTriggered));
            }).catch(() => setError(BATTLE_TEXT_CONSTANT.INSTRUMENT_ERROR));
          }
          return;
        }
      }

      if (
        row === "FRONT" &&
        battleState.activePlayer === "PLAYER" &&
        battleState.phase === "PRE_ATTACK_INSTRUMENT"
      ) {
        const slot = battleState.playerFrontRow[index];
        if (slot && !slot.hasAttackedThisTurn) {
          gamelanAudio.playCardSelect();
          setSelectedAttackerFrontIndex((prev) =>
            prev === index ? null : index
          );
        }
      }
    },
    [battleState, selectedHandInstanceId, submitBattleAction, triggerInstrumentFlyer]
  );

  const handleBotFrontSlotClick = useCallback(
    (defenderFrontIndex: number): void => {
      if (!battleState) return;
      if (
        battleState.activePlayer !== "PLAYER" ||
        battleState.phase !== "PRE_ATTACK_INSTRUMENT" ||
        selectedAttackerFrontIndex === null
      ) {
        return;
      }

      const defenderSlot = battleState.botFrontRow[defenderFrontIndex];
      if (!defenderSlot) return;

      gamelanAudio.playCardSelect();
      setSelectedAttackerFrontIndex(null);
      startAttackIndicator("PLAYER", selectedAttackerFrontIndex, defenderFrontIndex);
      void submitBattleAction({
        type: "DECLARE_ATTACK",
        attackerFrontIndex: selectedAttackerFrontIndex,
        defenderFrontIndex,
      }).catch(() => setError(BATTLE_TEXT_CONSTANT.ATTACK_ERROR));
    },
    [battleState, selectedAttackerFrontIndex, startAttackIndicator, submitBattleAction]
  );

  const handleOpponentCharacterSlotClick = useCallback(
    (row: "FRONT" | "SECOND", index: number): void => {
      if (!battleState || !selectedHandInstanceId) return;
      const canPlayPreAttack =
        battleState.activePlayer === "PLAYER" &&
        battleState.phase === "PRE_ATTACK_INSTRUMENT";
      const canPlayDefenderResponse =
        battleState.phase === "DEFENDER_INSTRUMENT_RESPONSE" &&
        battleState.pendingAttack?.attackerSide === "BOT" &&
        row === "FRONT" &&
        battleState.pendingAttack.attackerFrontIndex === index;
      const targetSlot =
        row === "FRONT"
          ? battleState.botFrontRow[index]
          : battleState.botSecondRow[index];
      const instrument = battleState.playerInstrumentHand.find(
        (item) => item.instanceId === selectedHandInstanceId
      )?.card;
      if (
        (!canPlayPreAttack && !canPlayDefenderResponse) ||
        !targetSlot ||
        instrument?.effectType !== "DEBUFF_ENEMY_ATK"
      ) return;

      void submitBattleAction({
        type: "PLAY_INSTRUMENT",
        handInstanceId: selectedHandInstanceId,
        targetRow: row,
        targetIndex: index,
        targetSide: "OPPONENT",
      }).then((updated) => {
        setSelectedHandInstanceId(null);
        const updatedSlot = row === "FRONT"
          ? updated.botFrontRow[index]
          : updated.botSecondRow[index];
        const applied = updatedSlot?.appliedInstruments.at(-1);
        gamelanAudio.playInstrumentBuff(Boolean(applied?.synergyTriggered));
        triggerInstrumentFlyer(
          instrument,
          targetSlot.card.code === "HIDDEN" ? "Karakter lawan" : targetSlot.card.name,
          "PLAYER",
          Boolean(applied?.synergyTriggered)
        );
      }).catch(() => setError(BATTLE_TEXT_CONSTANT.INSTRUMENT_ERROR));
    },
    [battleState, selectedHandInstanceId, submitBattleAction, triggerInstrumentFlyer]
  );

  const handleConfirmDefenderResponse = useCallback((): void => {
    if (
      !battleState ||
      battleState.phase !== "DEFENDER_INSTRUMENT_RESPONSE"
    ) {
      return;
    }
    void submitBattleAction({ type: "CONFIRM_DEFENDER_RESPONSE" }).catch(() =>
      setError(BATTLE_TEXT_CONSTANT.DEFENSE_ERROR)
    );
  }, [battleState, submitBattleAction]);

  const handleContinueClash = useCallback((): void => {
    if (
      !battleState ||
      battleState.phase !== "DEFENDER_INSTRUMENT_RESPONSE" ||
      battleState.pendingAttack?.attackerSide !== "PLAYER"
    ) return;
    void submitBattleAction({ type: "CONTINUE_CLASH" }).catch(() =>
      setError(BATTLE_TEXT_CONSTANT.CLASH_ERROR)
    );
  }, [battleState, submitBattleAction]);

  const handleEndTurn = useCallback((): void => {
    if (!battleState || battleState.activePlayer !== "PLAYER") return;
    setSelectedHandInstanceId(null);
    setSelectedAttackerFrontIndex(null);
    gamelanAudio.playCardSelect();
    void submitBattleAction({ type: "END_TURN" }).catch(() =>
      setError(BATTLE_TEXT_CONSTANT.END_TURN_ERROR)
    );
  }, [battleState, submitBattleAction]);

  const handleDiscardSelectedInstrument = useCallback((): void => {
    if (!battleState || !selectedHandInstanceId) return;
    gamelanAudio.playCardSelect();
    void submitBattleAction({ type: "DISCARD_INSTRUMENT", handInstanceId: selectedHandInstanceId }).catch(() =>
      setError(BATTLE_TEXT_CONSTANT.DISCARD_ERROR)
    );
    setSelectedHandInstanceId(null);
  }, [battleState, selectedHandInstanceId, submitBattleAction]);

  const handleSurrender = useCallback((): void => {
    if (!battleState || isSurrendering) return;
    setIsSurrendering(true);
    setSelectedHandInstanceId(null);
    setSelectedAttackerFrontIndex(null);
    void submitBattleAction({ type: "SURRENDER" })
      .catch(() => setError(BATTLE_TEXT_CONSTANT.SURRENDER_ERROR))
      .finally(() => {
        setIsSurrendering(false);
        setConfirmingSurrender(false);
      });
  }, [battleState, isSurrendering, submitBattleAction]);

  const handleLockCardsToVault = useCallback(async (): Promise<void> => {
    const matchId = sessionIdRef.current;
    if (!matchId || isLockingVault) return;
    if (!connected || !publicKey) {
      setVaultLockError(BATTLE_TEXT_CONSTANT.VAULT_LOCK_CONNECT_WALLET);
      return;
    }
    setIsLockingVault(true);
    setVaultLockError(null);
    try {
      const battleUseCase = getService(BATTLE_USECASE_TOKEN);
      const prepared = await battleUseCase.prepareVaultLock(matchId);
      setVaultPda(prepared.vaultPda);

      if (!prepared.alreadyLocked && prepared.serializedTransactions.length > 0) {
        const txSignatures = await sendBatchBase64SolanaTxs({
          serializedTransactions: prepared.serializedTransactions,
          connection,
          signAllTransactions,
          signTransaction,
          sendTransaction,
        });
        await battleUseCase.confirmVaultLock(matchId, txSignatures);
      }

      const latest = await battleUseCase.reconnectSession(matchId);
      if (latest) {
        applySessionView(latest);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : BATTLE_TEXT_CONSTANT.VAULT_LOCK_ERROR;
      setVaultLockError(msg);
    } finally {
      setIsLockingVault(false);
    }
  }, [
      applySessionView,
      connected,
      connection,
      isLockingVault,
      publicKey,
      sendTransaction,
      signAllTransactions,
      signTransaction,
    ]);

  useEffect(() => {
    if (!isLockingVault) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLockingVault]);

  const handleCancelPreLockMatch = useCallback(async (): Promise<boolean> => {
    const matchId = sessionIdRef.current;
    if (!matchId || isSurrendering) return false;
    setIsSurrendering(true);
    setVaultLockError(null);
    try {
      const battleUseCase = getService(BATTLE_USECASE_TOKEN);
      await battleUseCase.submitAction(matchId, {
        expectedSequence: sessionSequenceRef.current,
        idempotencyKey: crypto.randomUUID(),
        action: { type: "SURRENDER" },
      });
      removeActiveBattleSessionId();
      setIsBattleStarted(false);
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : BATTLE_TEXT_CONSTANT.SURRENDER_ERROR;
      setVaultLockError(msg);
      return false;
    } finally {
      setIsSurrendering(false);
    }
  }, [isSurrendering]);

  const completeDuelAnimation = useCallback((): void => {
    const deferredState = deferredDuelStateRef.current;
    if (!deferredState) return;
    battleStateRef.current = deferredState;
    setBattleState(deferredState);
    deferredDuelStateRef.current = null;
  }, []);

  const dismissDuelModal = useCallback((): void => {
    completeDuelAnimation();
    setActiveDuelModal(null);
    setAutoContinueDuelOutcomeId(null);
  }, [completeDuelAnimation]);

  return {
    isBattleStarted,
    exitBattleArena,
    allCards,
    battleState,
    pendingDiceSession,
    isOpeningDealAnimating,
    isOpeningDealRevealing,
    turnDeadlineAt,
    sessionReady,
    error,
    selectedHandInstanceId,
    setSelectedHandInstanceId,
    selectedAttackerFrontIndex,
    setSelectedAttackerFrontIndex,
    inspectedCard,
    setInspectedCard,
    activeDuelModal,
    autoContinueDuelOutcomeId,
    dismissDuelModal,
    attackIndicator,
    completeAttackIndicator,
    instrumentFlyer,
    showOpeningDeal,
    dealAnimationToken,
    confirmingSurrender,
    setConfirmingSurrender,
    isSurrendering,
    startNewMatch,
    handleDiceRollComplete,
    handleDiceRollAnimationComplete,
    handleOpeningDealRevealStart,
    handleOpeningDealAnimationComplete,
    handlePlayerCharacterSlotClick,
    handleBotFrontSlotClick,
    handleOpponentCharacterSlotClick,
    handleConfirmDefenderResponse,
    handleContinueClash,
    handleDiscardSelectedInstrument,
    handleSurrender,
    handleEndTurn,
    isQuickMatch,
    isLeagueMatch,
    rewardCardSlug,
    rewardCardQuantity,
    vaultPda,
    viewerLockTxSignature,
    settleTxSignature,
    vaultLockRequired,
    viewerVaultLocked,
    opponentVaultLocked,
    isLockingVault,
    vaultLockError,
    handleLockCardsToVault,
    handleCancelPreLockMatch,
    isStoryMode,
    storyNusaPoints,
    storyKingdom,
    storyOpponentTitle,
  };
}

