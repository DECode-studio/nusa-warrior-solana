"use client";

import React, { useEffect, useState } from "react";
import { Clock3, Search, ShieldAlert, Trophy } from "lucide-react";
import type { BattleSessionEntity, QuickMatchQueueEntity } from "@/client/domain/battle/entity/battle_entity";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface QuickMatchModalProps {
  readonly agreementOpen: boolean;
  readonly queue: QuickMatchQueueEntity | null;
  readonly error: string | null;
  readonly activeBattle: BattleSessionEntity | null;
  readonly endingActiveBattle: boolean;
  readonly onAgree: () => void;
  readonly onDecline: () => void;
  readonly onCancelSearch: () => void;
  readonly onPlayBot: () => void;
  readonly onBrowseLeagues: () => void;
  readonly onContinueActiveBattle: () => void;
  readonly onSurrenderActiveBattle: () => void;
}

export function QuickMatchModal({
  agreementOpen,
  queue,
  error,
  activeBattle,
  endingActiveBattle,
  onAgree,
  onDecline,
  onCancelSearch,
  onPlayBot,
  onBrowseLeagues,
  onContinueActiveBattle,
  onSurrenderActiveBattle,
}: QuickMatchModalProps): React.ReactElement | null {
  const { t } = useTranslator();
  const [offerSnoozedUntil, setOfferSnoozedUntil] = useState<number | null>(null);
  const searching = Boolean(queue && queue.status === "WAITING");
  const waitMs = queue?.waitMs ?? 0;
  const botOffer = searching && waitMs >= 30_000 &&
    (offerSnoozedUntil === null || waitMs >= offerSnoozedUntil);
  const leagueOffer = searching && waitMs >= 90_000 &&
    (offerSnoozedUntil === null || waitMs >= offerSnoozedUntil);
  const [confirmingActiveBattleEnd, setConfirmingActiveBattleEnd] = useState(false);
  useEffect(() => {
    if (!agreementOpen || !activeBattle) setConfirmingActiveBattleEnd(false);
  }, [agreementOpen, activeBattle]);
  if (!agreementOpen && !searching) return null;

  return (
    <BaseModal
      id="battle-quick-match-modal"
      isOpen={agreementOpen || searching}
      onClose={agreementOpen ? onDecline : onCancelSearch}
      title={agreementOpen && activeBattle
        ? t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_ACTIVE_TITLE)
        : agreementOpen
        ? t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_AGREEMENT_TITLE)
        : leagueOffer
          ? t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_OFFER_TITLE)
          : botOffer
          ? t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_NO_OPPONENT)
          : t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_SEARCHING)}
      size={botOffer || leagueOffer ? "md" : "sm"}
      closeOnBackdropClick={!searching}
      showCloseButton={!searching}
      dragToDismiss={!searching}
      footer={agreementOpen && activeBattle ? (
        <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" disabled={endingActiveBattle} onClick={confirmingActiveBattleEnd ? () => setConfirmingActiveBattleEnd(false) : onContinueActiveBattle}>
            {confirmingActiveBattleEnd ? t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_KEEP_ACTIVE) : t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_CONTINUE_ACTIVE)}
          </Button>
          <Button variant="primary" size="sm" className="w-full sm:w-auto" isLoading={endingActiveBattle} onClick={confirmingActiveBattleEnd ? onSurrenderActiveBattle : () => setConfirmingActiveBattleEnd(true)}>
            {confirmingActiveBattleEnd ? t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_CONFIRM_END_ACTIVE) : t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_END_ACTIVE)}
          </Button>
        </div>
      ) : agreementOpen ? (
        <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onDecline}
          >
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_CANCEL)}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onAgree}
          >
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_AGREE)}
          </Button>
        </div>
      ) : leagueOffer ? (
        <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={onCancelSearch}>
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_CANCEL_SEARCH)}
          </Button>
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => setOfferSnoozedUntil(waitMs + 30_000)}>
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_KEEP_SEARCHING)}
          </Button>
          <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={onBrowseLeagues}>
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_OFFER_ACTION)}
          </Button>
        </div>
      ) : botOffer ? (
        <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onCancelSearch}
          >
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_CANCEL_SEARCH)}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setOfferSnoozedUntil(waitMs + 30_000)}
          >
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_KEEP_SEARCHING)}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onPlayBot}
          >
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_PLAY_BOT)}
          </Button>
        </div>
      ) : (
        <div className="flex w-full justify-end">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onCancelSearch}
          >
            {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_CANCEL_SEARCH)}
          </Button>
        </div>
      )}
    >
      {agreementOpen ? (
        activeBattle ? (
          <div className="space-y-3 text-sm leading-relaxed text-muted">
            <p role="alert" className="font-semibold text-danger-light">{error}</p>
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-light" aria-hidden="true" />
              <p>{t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_ACTIVE_BODY)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 text-sm leading-relaxed text-muted">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-light" aria-hidden="true" />
              <p>{t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_AGREEMENT_BODY)}</p>
            </div>
            {error && <p role="alert" className="text-sm font-semibold text-danger-light">{error}</p>}
          </div>
        )
      ) : (
        <div className="space-y-3 text-center text-sm text-muted">
          {leagueOffer ? (
            <div className="space-y-2">
              <Trophy className="mx-auto h-6 w-6 text-amber-light" aria-hidden="true" />
              <p>{t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_OFFER_BODY)}</p>
            </div>
          ) : botOffer ? <p>{t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_BOT_OFFER)}</p> : (
            <div className="flex items-center justify-center gap-2">
              <Search className="h-5 w-5 animate-pulse text-primary-light" aria-hidden="true" />
              <p>{t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_SEARCHING)}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-xs text-primary-light">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            <span>{Math.floor((queue?.waitMs ?? 0) / 1000)}s</span>
          </div>
          {queue && <p className="text-xs">{t(BATTLE_TEXT_CONSTANT.QUICK_MATCH_POWER, { power: queue.battlePower })}</p>}
          {error && <p role="alert" className="text-xs font-semibold text-danger-light">{error}</p>}
        </div>
      )}
    </BaseModal>
  );
}
