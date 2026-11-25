"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { BattleSlotCharacter } from "@/client/domain/battle/entity/battle_entity";
import { useTranslator } from "@/core/translator";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { CardDetailModal } from "@/client/presentation/components/CardDetailModal";
import { UserFeedback } from "@/client/presentation/components/user";
import { ROUTES } from "@/core/constants/routes";
const BOARD_DESKTOP_SRC = "/assets/board/board-desktop.png";
const BOARD_MOBILE_SRC = "/assets/board/board-mobile.png";
const CARD_BACK_IMAGE = "/cards/nusantara-card.back-card.png";
import {
  BattleArenaHeader,
  BattleAttackIndicator,
  BattleCardPiles,
  BattleCombatLogDrawer,
  BattleInstrumentHand,
  BattleOpeningDealAnimation,
  BattleStateChangeAnimation,
  BattleMatchOverModal,
  BattleSurrenderModal,
  BattleTurnChangeModal,
  type BattleTurnChangeNotice,
  BattleCardActionBottomSheet,
  type MobileCardTarget,
  DiceRollOverlay,
  DuelStageOverlay,
  InstrumentPreviewFlyer,
  OpeningDealFlyer,
} from "./components";
import { BATTLE_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import styles from "./components/BattleAnimations.module.css";
import { useBattleArena } from "./hooks/useBattleArena";
import { BATTLE_TEXT_CONSTANT } from "./constants/TextConstant";

interface PreviousTurnState {
  matchId: string;
  activePlayer: "PLAYER" | "BOT";
  phase: string;
}

export function BattleArenaView(): React.ReactElement {
  const { t, locale } = useTranslator();
  const router = useRouter();
  const {
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
    isStoryMode,
    storyNusaPoints,
    storyKingdom,
    storyOpponentTitle,
    rewardCardSlug,
    rewardCardQuantity,
  } = useBattleArena();

  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [mobileCardTarget, setMobileCardTarget] = useState<MobileCardTarget | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [turnChangeNotice, setTurnChangeNotice] = useState<BattleTurnChangeNotice | null>(null);
  const previousTurnStateRef = useRef<PreviousTurnState | null>(null);
  const turnChangeNoticeIdRef = useRef(0);
  const isLeavingArenaRef = useRef(false);
  const opponentLabel = isStoryMode && storyOpponentTitle
    ? storyOpponentTitle
    : isQuickMatch
    ? t(BATTLE_TEXT_CONSTANT.OPPONENT_LABEL)
    : t(BATTLE_TEXT_CONSTANT.BOT_LABEL);

  const handleInspectCard = (card: CardEntity | null): void => {
    if (card && isMobile) {
      setMobileCardTarget(null);
    }
    setInspectedCard(card);
  };

  const exitToLobby = (): void => {
    isLeavingArenaRef.current = true;
    const leagueId = new URLSearchParams(window.location.search).get("leagueId") ??
      window.sessionStorage.getItem("nusa-active-league-room");
    window.sessionStorage.removeItem("nusa-active-league-room");
    exitBattleArena();
    if (leagueId) {
      router.push(`${ROUTES.USER_LEAGUES(locale)}?roomId=${encodeURIComponent(leagueId)}`);
      return;
    }
    router.push(isStoryMode ? ROUTES.USER_STORY_MODE(locale) : ROUTES.USER_BATTLE_LOBBY(locale));
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!battleState) return;

    const previousTurnState = previousTurnStateRef.current;
    previousTurnStateRef.current = {
      matchId: battleState.matchId,
      activePlayer: battleState.activePlayer,
      phase: battleState.phase,
    };

    if (
      !previousTurnState ||
      previousTurnState.matchId !== battleState.matchId ||
      previousTurnState.activePlayer === battleState.activePlayer ||
      previousTurnState.phase === "DICE_ROLL" ||
      battleState.phase === "DICE_ROLL" ||
      battleState.phase === "MATCH_OVER" ||
      showOpeningDeal ||
      isOpeningDealAnimating
    ) {
      return;
    }

    turnChangeNoticeIdRef.current += 1;
    setTurnChangeNotice({
      id: turnChangeNoticeIdRef.current,
      activePlayer: battleState.activePlayer,
    });
  }, [
    battleState?.matchId,
    battleState?.activePlayer,
    battleState?.phase,
    isOpeningDealAnimating,
    showOpeningDeal,
  ]);

  useEffect(() => {
    if (battleState?.phase === "DICE_ROLL") {
      setShowDiceOverlay(true);
    }
    if (!isBattleStarted || !battleState) {
      setShowDiceOverlay(false);
    }
  }, [battleState?.phase, isBattleStarted, battleState]);

  // Lock-in mode: prevent accidental browser navigation while match is active
  useEffect(() => {
    if (!isBattleStarted || !battleState || battleState.phase === "MATCH_OVER") {
      return;
    }
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [battleState, isBattleStarted]);

  useEffect(() => {
    if (sessionReady && !isBattleStarted && !isLeavingArenaRef.current) {
      router.replace(ROUTES.USER_BATTLE_LOBBY(locale));
    }
  }, [isBattleStarted, locale, router, sessionReady]);

  const cardsBySlug = useMemo(() => new Map(allCards.map((card) => [card.slug, card])), [allCards]);
  const instrumentsFor = (slot: BattleSlotCharacter) =>
    slot.appliedInstruments
      .map((applied) => cardsBySlug.get(applied.instrumentSlug))
      .filter((card): card is CardEntity => Boolean(card));

  if (!isBattleStarted || !battleState) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <UserFeedback
          kind={error ? "error" : "loading"}
          title={error ? t(error) : t(BATTLE_TEXT_CONSTANT.COMMON_LOADING)}
        />
      </div>
    );
  }

  // =========================================================================
  // STATE 2: FULL-SCREEN LOCK-IN BATTLEFIELD ARENA
  // =========================================================================
  const selectedHandInstrument =
    battleState.playerInstrumentHand.find(
      (h) => h.instanceId === selectedHandInstanceId
    )?.card ?? null;

  const isPlayerPromotionNeeded =
    battleState.phase === "PROMOTE_CHARACTER" &&
    battleState.pendingPromotion?.side === "PLAYER";

  const isPlayerDefenderResponse =
    battleState.phase === "DEFENDER_INSTRUMENT_RESPONSE" &&
    battleState.pendingAttack?.attackerSide === "BOT";

  const isBotDefenderResponse =
    battleState.phase === "DEFENDER_INSTRUMENT_RESPONSE" &&
    battleState.pendingAttack?.attackerSide === "PLAYER";
  const latestBattleLog = battleState.battleLogs[0];
  const latestBattleLogMessage = latestBattleLog?.messageKey
    ? (() => {
        const params = { ...(latestBattleLog.messageParams ?? {}) };
        for (const name of ["actor", "firstPlayer", "nextPlayer", "winner"]) {
          const side = params[name];
          if (side === "PLAYER") params[name] = t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER);
          else if (side === "BOT") params[name] = t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);
        }
        return t(latestBattleLog.messageKey, params);
      })()
    : latestBattleLog?.message;
  const botDefenderResponseMessage = isBotDefenderResponse
    ? latestBattleLogMessage ?? t(isQuickMatch ? "battle.response.opponent" : "battle.response.bot")
    : "";
  const playerDefenderResponseMessage = isPlayerDefenderResponse
    ? latestBattleLog?.actor === "PLAYER" &&
      (latestBattleLog?.highlight === "INSTRUMENT" || latestBattleLog?.highlight === "SYNERGY")
      ? `${latestBattleLogMessage} ${t(BATTLE_TEXT_CONSTANT.RESPONSE_CONTINUE)}`
      : t(BATTLE_TEXT_CONSTANT.RESPONSE_PLAYER)
    : "";

  const isMatchOver = battleState.phase === "MATCH_OVER";
  const isInitialDealPending =
    battleState.phase === "DICE_ROLL" && !isOpeningDealAnimating;

  const startAttackSelection = (): void => {
    if (selectedAttackerFrontIndex !== null || battleState.phase !== "PRE_ATTACK_INSTRUMENT") return;
    const firstReadyIndex = battleState.playerFrontRow.findIndex(
      (slot) => slot !== null && !slot.hasAttackedThisTurn
    );
    if (firstReadyIndex >= 0) {
      if (isMobile) {
        const slot = battleState.playerFrontRow[firstReadyIndex];
        if (slot) {
          setMobileCardTarget({
            type: "PLAYER_FRONT",
            slotIndex: firstReadyIndex,
            card: slot.card,
            slot,
            appliedInstruments: instrumentsFor(slot),
          });
        }
      } else {
        setSelectedAttackerFrontIndex(firstReadyIndex);
      }
    }
  };

  return (
    <div
      id={BATTLE_SEMANTIC_IDS.ARENA_ROOT}
      className={`${styles.arenaBoard} battlefield-zero-scroll fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col justify-between overflow-hidden bg-surface-base text-white select-none`}
      style={{
        "--battle-board-desktop": `url("${BOARD_DESKTOP_SRC}")`,
        "--battle-board-mobile": `url("${BOARD_MOBILE_SRC}")`,
      } as React.CSSProperties}
    >
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute top-20 left-1/2 z-[70] w-[min(90vw,36rem)] -translate-x-1/2 rounded-xl border border-danger/30 bg-surface-base/95 p-3 text-center text-xs font-semibold text-danger-light shadow-xl"
        >
          {t(error)}
        </div>
      )}
      {/* 1. TOP TACTICAL CONTROL BAR */}
      <BattleArenaHeader
        battleState={battleState}
        isQuickMatch={isQuickMatch}
        turnDeadlineAt={turnDeadlineAt}
        isPlayerPromotionNeeded={isPlayerPromotionNeeded}
        isPlayerDefenderResponse={isPlayerDefenderResponse}
        isBotDefenderResponse={isBotDefenderResponse}
        botDefenderResponseMessage={botDefenderResponseMessage}
        playerDefenderResponseMessage={playerDefenderResponseMessage}
        selectedHandInstrument={selectedHandInstrument}
        selectedAttackerFrontIndex={selectedAttackerFrontIndex}
        confirmingSurrender={confirmingSurrender}
        onExitToLobby={exitToLobby}
        onToggleLogDrawer={() => setShowLogDrawer((prev) => !prev)}
        onSurrender={handleSurrender}
        onStartSurrenderConfirm={() => setConfirmingSurrender(true)}
        onConfirmDefenderResponse={handleConfirmDefenderResponse}
        onContinueClash={handleContinueClash}
        onStartAttackSelection={startAttackSelection}
        onEndTurn={handleEndTurn}
        onClearSelection={() => {
          setSelectedHandInstanceId(null);
          setSelectedAttackerFrontIndex(null);
        }}
      />

      {battleState.phase !== "DICE_ROLL" && !isOpeningDealAnimating && (
        <div
          aria-hidden="true"
          className={`${styles.activeTurnGlow} ${
            battleState.activePlayer === "PLAYER"
              ? styles.activePlayerTurnGlow
              : styles.activeBotTurnGlow
          }`}
        />
      )}

      {/* 2. CARD SLOTS FOLLOW THE BOARD'S 16:9 ARTWORK GRID */}
      <div className={`${styles.battlefieldStage} ${isInitialDealPending ? "pointer-events-none opacity-0" : ""}`}>
        {/* OPPONENT (BOT) FIELD */}
        <section
          id={BATTLE_SEMANTIC_IDS.BOT_BOARD}
          className={styles.botBoard}
        >
          {/* Bot Second Row */}
          <div
            id={BATTLE_SEMANTIC_IDS.BOT_SECOND_ROW}
            className={styles.botSecondRow}
          >
            {battleState.botSecondRow.map((slot, idx) =>
              slot ? (
                <CardVisual
                  key={slot.instanceId}
                  semanticId={`${BATTLE_SEMANTIC_IDS.BOT_SECOND_SLOT_PREFIX}${idx}`}
                  card={slot.card}
                  appliedInstruments={instrumentsFor(slot)}
                  isFaceDown={!slot.isRevealed}
                  animateFlip
                  flipClassName={styles.flip}
                  size="sm"
                  className={styles.battleCard}
                  currentAttack={slot.currentAttack}
                  currentDefense={slot.currentDefense}
                  tempAttackMod={slot.tempAttackMod}
                  tempDefenseMod={slot.tempDefenseMod}
                  showName={false}
                  badgeContent="role"
                  onClick={() => {
                    if (isMobile && slot.isRevealed) {
                      setMobileCardTarget({
                        type: "BOT_SECOND",
                        slotIndex: idx,
                        card: slot.card,
                        slot,
                        appliedInstruments: instrumentsFor(slot),
                      });
                    }
                  }}
                  onInspect={slot.isRevealed ? handleInspectCard : undefined}
                />
              ) : (
                <div
                  key={`bot-sec-empty-${idx}`}
                  className={`${styles.emptySlot} flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-primary/20 bg-surface-base/60 text-[10px] text-subtle`}
                >
                  {t(BATTLE_TEXT_CONSTANT.UI_EMPTY)}
                </div>
              )
            )}
          </div>

          {/* Bot Front Row */}
          <div
            id={BATTLE_SEMANTIC_IDS.BOT_FRONT_ROW}
            className={styles.botFrontRow}
          >
            {battleState.botFrontRow.map((slot, idx) => {
              const isTargetable =
                selectedAttackerFrontIndex !== null &&
                battleState.activePlayer === "PLAYER" &&
                battleState.phase === "PRE_ATTACK_INSTRUMENT" &&
                slot !== null;

              return slot ? (
                <CardVisual
                  key={slot.instanceId}
                  semanticId={`${BATTLE_SEMANTIC_IDS.BOT_FRONT_SLOT_PREFIX}${idx}`}
                  card={slot.card}
                  appliedInstruments={instrumentsFor(slot)}
                  isFaceDown={!slot.isRevealed}
                  animateFlip
                  flipClassName={styles.flip}
                  size="md"
                  className={styles.battleCard}
                  priority="high"
                  currentAttack={slot.currentAttack}
                  currentDefense={slot.currentDefense}
                  tempAttackMod={slot.tempAttackMod}
                  tempDefenseMod={slot.tempDefenseMod}
                  selected={isTargetable}
                  badgeText={isTargetable ? t(BATTLE_TEXT_CONSTANT.UI_ATTACK_TO_SELECT) : undefined}
                  showName={false}
                  badgeContent="role"
                  onClick={() => {
                    if (isMobile) {
                      setMobileCardTarget({
                        type: "BOT_FRONT",
                        slotIndex: idx,
                        card: slot.card,
                        slot,
                        appliedInstruments: instrumentsFor(slot),
                      });
                    } else {
                      if (selectedHandInstrument?.effectType === "DEBUFF_ENEMY_ATK") {
                        handleOpponentCharacterSlotClick("FRONT", idx);
                      } else {
                        handleBotFrontSlotClick(idx);
                      }
                    }
                  }}
                  onInspect={slot.isRevealed ? handleInspectCard : undefined}
                />
              ) : (
                <div
                  key={`bot-front-empty-${idx}`}
                  className={`${styles.emptySlot} flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-danger/30 bg-surface-base/60 text-center text-xs font-bold text-subtle`}
                >
                  {t(BATTLE_TEXT_CONSTANT.UI_FRONT_FALLEN, { index: idx + 1 })}
                </div>
              );
            })}
          </div>
        </section>

        {/* CLASH DIVIDER CENTER LINE */}
        <div className={styles.clashDivider} aria-hidden="true" />

        {/* PLAYER FIELD */}
        <section
          id={BATTLE_SEMANTIC_IDS.PLAYER_BOARD}
          className={styles.playerBoard}
        >
          {/* Player Front Row */}
          <div
            id={BATTLE_SEMANTIC_IDS.PLAYER_FRONT_ROW}
            className={styles.playerFrontRow}
          >
            {battleState.playerFrontRow.map((slot, idx) => {
              const isSelectedAttacker = selectedAttackerFrontIndex === idx;
              return slot ? (
                <CardVisual
                  key={slot.instanceId}
                  semanticId={`${BATTLE_SEMANTIC_IDS.PLAYER_FRONT_SLOT_PREFIX}${idx}`}
                  card={slot.card}
                  appliedInstruments={instrumentsFor(slot)}
                  isFaceDown={isOpeningDealAnimating && !isOpeningDealRevealing}
                  animateFlip
                  flipClassName={styles.flip}
                  size="md"
                  className={styles.battleCard}
                  priority="high"
                  currentAttack={slot.currentAttack}
                  currentDefense={slot.currentDefense}
                  tempAttackMod={slot.tempAttackMod}
                  tempDefenseMod={slot.tempDefenseMod}
                  selected={isSelectedAttacker}
                  badgeText={
                    slot.hasAttackedThisTurn
                      ? t(BATTLE_TEXT_CONSTANT.UI_ALREADY_ATTACKED_BADGE)
                      : isSelectedAttacker
                        ? t(BATTLE_TEXT_CONSTANT.UI_READY_TO_ATTACK)
                        : undefined
                  }
                  showName={false}
                  badgeContent="role"
                  onClick={() => {
                    if (isMobile) {
                      setMobileCardTarget({
                        type: "PLAYER_FRONT",
                        slotIndex: idx,
                        card: slot.card,
                        slot,
                        appliedInstruments: instrumentsFor(slot),
                      });
                    } else {
                      handlePlayerCharacterSlotClick("FRONT", idx);
                    }
                  }}
                  onInspect={handleInspectCard}
                />
              ) : (
                <div
                  key={`player-front-empty-${idx}`}
                  className={`${styles.emptySlot} flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-emerald/40 bg-emerald/10 p-2 text-center font-display text-xs font-bold text-emerald-light`}
                >
                  {isPlayerPromotionNeeded
                    ? t(BATTLE_TEXT_CONSTANT.UI_PROMOTE_FROM_SECOND)
                    : t(BATTLE_TEXT_CONSTANT.UI_FRONT_EMPTY, { index: idx + 1 })}
                </div>
              );
            })}
          </div>

          {/* Player Second Row */}
          <div
            id={BATTLE_SEMANTIC_IDS.PLAYER_SECOND_ROW}
            className={styles.playerSecondRow}
          >
            {battleState.playerSecondRow.map((slot, idx) => {
              return slot ? (
                <CardVisual
                  key={slot.instanceId}
                  semanticId={`${BATTLE_SEMANTIC_IDS.PLAYER_SECOND_SLOT_PREFIX}${idx}`}
                  card={slot.card}
                  appliedInstruments={instrumentsFor(slot)}
                  isFaceDown={isOpeningDealAnimating && !isOpeningDealRevealing}
                  animateFlip
                  flipClassName={styles.flip}
                  size="sm"
                  className={styles.battleCard}
                  currentAttack={slot.currentAttack}
                  currentDefense={slot.currentDefense}
                  tempAttackMod={slot.tempAttackMod}
                  tempDefenseMod={slot.tempDefenseMod}
                  selected={isPlayerPromotionNeeded}
                  badgeText={isPlayerPromotionNeeded ? t(BATTLE_TEXT_CONSTANT.UI_PROMOTE_BADGE) : undefined}
                  showName={false}
                  badgeContent="role"
                  onClick={() => {
                    if (isMobile) {
                      setMobileCardTarget({
                        type: "PLAYER_SECOND",
                        slotIndex: idx,
                        card: slot.card,
                        slot,
                        appliedInstruments: instrumentsFor(slot),
                      });
                    } else {
                      handlePlayerCharacterSlotClick("SECOND", idx);
                    }
                  }}
                  onInspect={handleInspectCard}
                />
              ) : (
                <div
                  key={`player-sec-empty-${idx}`}
                  className={`${styles.emptySlot} flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-primary/20 bg-surface-base/60 text-[10px] text-subtle`}
                >
                  {t(BATTLE_TEXT_CONSTANT.UI_EMPTY)}
                </div>
              );
            })}
          </div>

        </section>

        <BattleCardPiles battleState={battleState} />

        <div id={BATTLE_SEMANTIC_IDS.BOT_INSTRUMENT_HAND} className={styles.opponentInstrumentHand} aria-label={t(BATTLE_TEXT_CONSTANT.UI_OPPONENT_INSTRUMENT_HAND)}>
          {battleState.botInstrumentHand.map((item) => (
            <Image
              key={item.instanceId}
              id={`${BATTLE_SEMANTIC_IDS.BOT_INSTRUMENT_SLOT_PREFIX}${item.instanceId}`}
              src={CARD_BACK_IMAGE}
              alt=""
              width={400}
              height={560}
              className="h-auto w-full"
            />
          ))}
        </div>
      </div>

      {/* DRAWN INSTRUMENTS: RIGHT-SIDE 2×3 BOARD PANEL */}
      <div className={isInitialDealPending ? "invisible" : undefined}>
        <BattleInstrumentHand
          hand={battleState.playerInstrumentHand}
          isDealingFaceDown={isOpeningDealAnimating && !isOpeningDealRevealing}
          selectedHandInstanceId={selectedHandInstanceId}
          isPlayerTurn={battleState.activePlayer === "PLAYER"}
          onSelectInstrument={(instanceId) =>
            setSelectedHandInstanceId(
              selectedHandInstanceId === instanceId ? null : instanceId
            )
          }
          onCardClick={(item) => {
            if (isMobile) {
              setMobileCardTarget({
                type: "PLAYER_HAND",
                instanceId: item.instanceId,
                card: item.card,
              });
            } else {
              setSelectedHandInstanceId(
                selectedHandInstanceId === item.instanceId ? null : item.instanceId
              );
            }
          }}
          onDiscardSelected={handleDiscardSelectedInstrument}
          onInspectCard={handleInspectCard}
        />
      </div>

      {/* Slide-out Tactical Combat Log Drawer */}
      <BattleCombatLogDrawer
        isOpen={showLogDrawer}
        onClose={() => setShowLogDrawer(false)}
        logs={battleState.battleLogs}
        opponentLabel={opponentLabel}
      />

      {/* Surrender Confirmation Modal */}
      <BattleSurrenderModal
        isOpen={confirmingSurrender}
        onCancel={() => setConfirmingSurrender(false)}
        onConfirm={handleSurrender}
      />

      <BattleTurnChangeModal
        notice={turnChangeNotice}
        opponentLabel={opponentLabel}
        onComplete={(noticeId) => {
          setTurnChangeNotice((current) =>
            current?.id === noticeId ? null : current
          );
        }}
      />

      {/* OVERLAYS */}
      {showDiceOverlay && (
        <DiceRollOverlay
          isOpen={showDiceOverlay}
          onRollComplete={handleDiceRollComplete}
          onRollSettled={() => {
            setShowDiceOverlay(false);
            handleDiceRollAnimationComplete();
          }}
          playerRoll={pendingDiceSession?.state.diceRollResult?.playerRoll ?? battleState.diceRollResult?.playerRoll ?? null}
          botRoll={pendingDiceSession?.state.diceRollResult?.botRoll ?? battleState.diceRollResult?.botRoll ?? null}
          opponentLabel={opponentLabel}
          canRoll={battleState.activePlayer === "PLAYER"}
        />
      )}

      <OpeningDealFlyer
        visible={showOpeningDeal}
        firstPlayer={battleState.diceRollResult?.firstPlayer ?? null}
        playerRoll={battleState.diceRollResult?.playerRoll ?? null}
        botRoll={battleState.diceRollResult?.botRoll ?? null}
        opponentLabel={opponentLabel}
      />

      <BattleOpeningDealAnimation
        battleState={battleState}
        token={dealAnimationToken}
        onRevealStart={handleOpeningDealRevealStart}
        onComplete={handleOpeningDealAnimationComplete}
      />
      <BattleStateChangeAnimation
        battleState={battleState}
        allCards={allCards}
        token={dealAnimationToken}
        turnChangeNoticeVisible={turnChangeNotice !== null}
        openingDealAnimating={isOpeningDealAnimating}
      />

      <BattleAttackIndicator attack={attackIndicator} onComplete={completeAttackIndicator} />

      <DuelStageOverlay
        outcome={activeDuelModal}
        autoContinue={activeDuelModal?.id === autoContinueDuelOutcomeId}
        onDismiss={dismissDuelModal}
        opponentLabel={opponentLabel}
      />

      {instrumentFlyer && (
        <InstrumentPreviewFlyer
          instrument={instrumentFlyer.instrument}
          targetName={instrumentFlyer.targetName}
          actor={instrumentFlyer.actor}
          opponentLabel={opponentLabel}
          synergyTriggered={instrumentFlyer.synergyTriggered}
        />
      )}

      {/* MOBILE CARD ACTION BOTTOM SHEET */}
      <BattleCardActionBottomSheet
        target={mobileCardTarget}
        onClose={() => setMobileCardTarget(null)}
        isPlayerTurn={battleState.activePlayer === "PLAYER"}
        phase={battleState.phase}
        selectedAttackerFrontIndex={selectedAttackerFrontIndex}
        selectedHandInstanceId={selectedHandInstanceId}
        canTargetOpponent={selectedHandInstrument?.effectType === "DEBUFF_ENEMY_ATK"}
        canApplyInstrumentToOwn={selectedHandInstrument?.effectType !== "DEBUFF_ENEMY_ATK"}
        canRespond={isPlayerDefenderResponse}
        isPlayerPromotionNeeded={isPlayerPromotionNeeded}
        onSelectAttacker={(slotIndex) => {
          handlePlayerCharacterSlotClick("FRONT", slotIndex);
        }}
        onDeselectAttacker={() => {
          setSelectedAttackerFrontIndex(null);
        }}
        onAttackTarget={(defenderFrontIndex) => {
          handleBotFrontSlotClick(defenderFrontIndex);
        }}
        onApplyInstrumentToOpponent={(slotIndex) => {
          handleOpponentCharacterSlotClick("FRONT", slotIndex);
        }}
        onSelectHandInstrument={(instanceId) => {
          setSelectedHandInstanceId(instanceId);
        }}
        onDeselectHandInstrument={() => {
          setSelectedHandInstanceId(null);
        }}
        onApplyInstrumentToSlot={(row, slotIndex) => {
          handlePlayerCharacterSlotClick(row, slotIndex);
        }}
        onPromoteCharacter={(slotIndex) => {
          handlePlayerCharacterSlotClick("SECOND", slotIndex);
        }}
      />

      <CardDetailModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
      />

      {/* MATCH OVER MODAL */}
      <BattleMatchOverModal
        isMatchOver={isMatchOver}
        isWinner={battleState.winner === "PLAYER"}
        turnNumber={battleState.turnNumber}
        botGraveyardCount={battleState.botGraveyard.length}
        playerGraveyardCount={battleState.playerGraveyard.length}
        isQuickMatch={isQuickMatch}
        isLeagueMatch={isLeagueMatch}
        isStoryMode={isStoryMode}
        storyNusaPoints={storyNusaPoints}
        storyKingdom={storyKingdom}
        rewardCard={rewardCardSlug ? cardsBySlug.get(rewardCardSlug) ?? null : null}
        rewardCardName={rewardCardSlug ? cardsBySlug.get(rewardCardSlug)?.name ?? rewardCardSlug : null}
        rewardCardQuantity={rewardCardQuantity}
        onNewMatch={() => startNewMatch()}
        onExitToLobby={exitToLobby}
      />
    </div>
  );
}

export { BattleArenaView as BattleView };
