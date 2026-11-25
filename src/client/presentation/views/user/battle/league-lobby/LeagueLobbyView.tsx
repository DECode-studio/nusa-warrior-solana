"use client";

import React from "react";
import { ArrowLeft, CheckCircle2, Plus, Trophy } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import { BaseModal, Button } from "@/client/presentation/components/ui";
import { UserFeedback, UserPageHeading } from "@/client/presentation/components/user";
import { LEAGUE_LOBBY_SEMANTIC_IDS as IDS } from "./constants/SemanticIdConstant";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "./constants/TextConstant";
import { useLeagueLobby } from "./hooks/useLeagueLobby";
import { LeagueRegistrationPanel } from "./components/LeagueRegistrationPanel";
import { LeagueRoomPanel } from "./components/LeagueRoomPanel";
import { LeagueCreateModal } from "./components/LeagueCreateModal";
import { LeagueJoinModal } from "./components/LeagueJoinModal";

export function LeagueLobbyView(): React.ReactElement {
  const model = useLeagueLobby();
  const { router, locale, t, room, rooms, error, notice, leaveConfirmationOpen, setLeaveConfirmationOpen, confirmLeaveRoom, requestLeaveRoom, setCreateModalOpen, cancelConfirmationOpen, setCancelConfirmationOpen, cancelLeague, busy } = model;

  return (
    <div id={IDS.ROOT} className="space-y-6">
      <div id={IDS.HEADING}>
        <UserPageHeading
          eyebrow={
            <span className="flex items-center gap-1.5 text-amber-light">
              <Trophy className="h-3.5 w-3.5 text-amber" aria-hidden="true" />
              <span>{t(TEXT.TITLE)}</span>
            </span>
          }
          title={t(TEXT.TITLE)}
          description={t(room ? TEXT.ROOM_DESCRIPTION : TEXT.DESCRIPTION)}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {!room && <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 py-1.5 text-xs text-muted">
                <span className="font-display text-lg font-bold text-amber-light">{rooms.length}</span>
                <span>{t(TEXT.PUBLIC_ROOMS)}</span>
              </div>}
              {!room && <Button variant="amber" size="sm" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                {t(TEXT.CREATE)}
              </Button>}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => room ? requestLeaveRoom("BATTLE_LOBBY") : router.push(ROUTES.USER_BATTLE_LOBBY(locale))}
                leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              >
                {t(TEXT.BATTLE_TITLE)}
              </Button>
            </div>
          }
        />
      </div>

      {error && <UserFeedback kind="error" title={t(TEXT.ERROR)} description={error} />}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm font-semibold text-emerald-light"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {room ? <LeagueRoomPanel model={model} /> : <LeagueRegistrationPanel model={model} />}

      <BaseModal
        id={IDS.LEAVE_CONFIRM_MODAL}
        isOpen={leaveConfirmationOpen}
        onClose={() => setLeaveConfirmationOpen(false)}
        size="sm"
        title={t(TEXT.LEAVE_CONFIRM_TITLE)}
        description={t(TEXT.LEAVE_CONFIRM_DESCRIPTION)}
        closeOnBackdropClick={false}
      >
        <div className="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setLeaveConfirmationOpen(false)}>
            {t(TEXT.LEAVE_CANCEL_ACTION)}
          </Button>
          <Button variant="amber" onClick={confirmLeaveRoom}>
            {t(TEXT.LEAVE_CONFIRM_ACTION)}
          </Button>
        </div>
      </BaseModal>
      <BaseModal
        id={IDS.CANCEL_CONFIRM_MODAL}
        isOpen={cancelConfirmationOpen}
        onClose={() => setCancelConfirmationOpen(false)}
        size="sm"
        title={t(TEXT.CANCEL_CONFIRM_TITLE)}
        description={t(TEXT.CANCEL_CONFIRM_DESCRIPTION)}
        closeOnBackdropClick={false}
      >
        <div className="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={busy} onClick={() => setCancelConfirmationOpen(false)}>
            {t(TEXT.LEAVE_CANCEL_ACTION)}
          </Button>
          <Button variant="danger" isLoading={busy} disabled={!room || (room.status !== "REGISTRATION_OPEN" && room.status !== "REGISTRATION_CLOSED")} onClick={() => room && void cancelLeague(room.id)}>
            {t(TEXT.CANCEL_CONFIRM_ACTION)}
          </Button>
        </div>
      </BaseModal>
      <LeagueCreateModal model={model} />
      <LeagueJoinModal model={model} />
    </div>
  );
}
