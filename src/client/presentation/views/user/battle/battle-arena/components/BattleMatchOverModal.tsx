"use client";

import React from "react";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface BattleMatchOverModalProps {
  readonly isMatchOver: boolean;
  readonly isWinner: boolean;
  readonly turnNumber: number;
  readonly botGraveyardCount: number;
  readonly playerGraveyardCount: number;
  readonly isQuickMatch?: boolean;
  readonly isLeagueMatch?: boolean;
  readonly isStoryMode?: boolean;
  readonly storyNusaPoints?: number | null;
  readonly storyKingdom?: "MAJAPAHIT" | "PAJAJARAN" | null;
  readonly rewardCard?: CardEntity | null;
  readonly rewardCardName?: string | null;
  readonly rewardCardQuantity?: number | null;
  readonly onNewMatch: () => void;
  readonly onExitToLobby: () => void;
}

export function BattleMatchOverModal({
  isMatchOver,
  isWinner,
  turnNumber,
  botGraveyardCount,
  playerGraveyardCount,
  isQuickMatch = false,
  isLeagueMatch = false,
  isStoryMode = false,
  storyNusaPoints = null,
  storyKingdom = null,
  rewardCard = null,
  rewardCardName = null,
  rewardCardQuantity = null,
  onNewMatch,
  onExitToLobby,
}: BattleMatchOverModalProps): React.ReactElement | null {
  const { t } = useTranslator();
  const rewardMessageKey = isLeagueMatch
    ? isWinner
      ? BATTLE_TEXT_CONSTANT.LEAGUE_STAKE_WON
      : BATTLE_TEXT_CONSTANT.LEAGUE_STAKE_LOST
    : isWinner
      ? BATTLE_TEXT_CONSTANT.QUICK_MATCH_REWARD_WON
      : BATTLE_TEXT_CONSTANT.QUICK_MATCH_REWARD_LOST;

  return (
    <BaseModal
      id={BATTLE_SEMANTIC_IDS.MATCH_OVER_BANNER}
      isOpen={isMatchOver}
      onClose={onExitToLobby}
      size="sm"
      className="border border-primary/40 text-center"
      closeOnBackdropClick={false}
      showCloseButton={false}
      dragToDismiss={false}
    >
      <div className="space-y-4 text-center">
        <Trophy
          className={`mx-auto h-12 w-12 ${
            isWinner ? "text-emerald-light" : "text-danger-light"
          }`}
          aria-hidden="true"
        />
        <h2 className="font-display text-2xl font-bold text-cream sm:text-3xl">
          {isWinner ? t(BATTLE_TEXT_CONSTANT.VICTORY) : t(BATTLE_TEXT_CONSTANT.DEFEAT)}
        </h2>
        <p className="nc-type-caption text-muted">
          {t(BATTLE_TEXT_CONSTANT.UI_MATCH_ENDED_SUMMARY, {
            turn: turnNumber,
            opponentCount: botGraveyardCount,
            playerCount: playerGraveyardCount,
          })}
        </p>
        {isStoryMode && isWinner && (
          <div className="rounded-xl border border-amber/20 bg-amber/10 p-3 text-sm text-amber-light">
            <p className="font-semibold">{storyKingdom === "MAJAPAHIT" ? "Kisah Majapahit berlanjut" : "Kisah Pajajaran berlanjut"}</p>
            {storyNusaPoints !== null && <p className="mt-1">+{storyNusaPoints} Nusa Point</p>}
          </div>
        )}
        {isStoryMode && isWinner && rewardCardName && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
            <p className="text-sm font-semibold text-primary-light">Kartu high-end kerajaan berhasil didapatkan</p>
            {rewardCard && <div className="mt-3 flex justify-center"><CardVisual card={rewardCard} size="sm" priority="high" showName={false} showDescription={false} showOverlay={false} /></div>}
          </div>
        )}
        {(isQuickMatch || isLeagueMatch) && rewardCardName && (
          <div className="rounded-xl border border-amber/20 bg-amber/10 p-3">
            <p className="text-sm font-semibold text-amber-light">
              {t(rewardMessageKey, { card: rewardCardName })}
            </p>
            {rewardCard && (
              <div className="mt-3 flex justify-center">
                <CardVisual
                  card={rewardCard}
                  size="sm"
                  priority="high"
                  showName={false}
                  showDescription={false}
                  showOverlay={false}
                />
              </div>
            )}
            {isWinner && rewardCardQuantity !== null && (
              <p className="mt-2 text-xs font-normal text-amber-light/80">
                {t(BATTLE_TEXT_CONSTANT.UI_COLLECTION_QUANTITY, { count: rewardCardQuantity })}
              </p>
            )}
          </div>
        )}
        {isLeagueMatch && !rewardCardName && (
          <p className="rounded-xl border border-amber/20 bg-amber/10 p-3 text-sm font-semibold text-amber-light">
            {t(BATTLE_TEXT_CONSTANT.LEAGUE_STAKE_NOT_TRANSFERRED)}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {!isLeagueMatch && (
            <Button
              id={BATTLE_SEMANTIC_IDS.NEW_MATCH_BTN}
              onClick={onNewMatch}
              variant="primary"
              size="md"
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              {t(BATTLE_TEXT_CONSTANT.REMATCH_BTN)}
            </Button>
          )}

          <Button
            onClick={onExitToLobby}
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {t(BATTLE_TEXT_CONSTANT.EXIT_LOBBY_BTN)}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
