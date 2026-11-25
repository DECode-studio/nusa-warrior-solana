import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Swords } from "lucide-react";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { LEAGUE_LOBBY_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "../constants/TextConstant";
import type { useLeagueLobby } from "../hooks/useLeagueLobby";
import { LeagueBracket } from "./LeagueBracket";

type LobbyModel = ReturnType<typeof useLeagueLobby>;

export function LeagueRoomPanel({ model }: { model: LobbyModel }): React.ReactElement {
  const { room, t, setNotice, busy, closeRegistration, startLeague, openDuel, requestLeaveRoom, setCancelConfirmationOpen } = model;
  if (!room) return <></>;

  const statusKey = room.status === "REGISTRATION_OPEN" ? TEXT.STATUS_OPEN
    : room.status === "REGISTRATION_CLOSED" ? TEXT.STATUS_CLOSED
      : room.status === "COMPLETED" ? TEXT.STATUS_COMPLETE
        : room.status === "CANCELLED" ? TEXT.STATUS_CANCELLED : TEXT.STATUS_PROGRESS;

  return (
    <IntellioCard id={LEAGUE_LOBBY_SEMANTIC_IDS.ROOM_PANEL} variant="elevated" padding="md" className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-4 sm:pb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-cream sm:text-2xl">{t(TEXT.TITLE)}</h2>
          <div className="mt-2">
            <Badge
              variant={
                room.status === "REGISTRATION_OPEN"
                  ? "amber"
                  : room.status === "IN_PROGRESS"
                    ? "emerald"
                    : "neutral"
              }
              size="sm"
            >
              {t(statusKey)}
            </Badge>
            <Badge variant={room.visibility === "PUBLIC" ? "primary" : "neutral"} size="sm" className="ml-2">
              {t(room.visibility === "PUBLIC" ? TEXT.PUBLIC : TEXT.PRIVATE)}
            </Badge>
            {room.isCreator && <Badge variant="primary" size="sm" className="ml-2">{t(TEXT.CREATOR_BADGE)}</Badge>}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => requestLeaveRoom("ROOM_LIST")}>
          {t(TEXT.ROOM_LIST)}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-control)] border border-amber/20 bg-surface px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <span className="block text-xs font-semibold text-muted">{t(TEXT.COPY_CODE)}</span>
          <strong className="mt-1 block select-all break-all font-mono text-xl font-bold tracking-[0.12em] text-amber-light sm:text-2xl">{room.joinCode}</strong>
        </div>  
        <Button variant="ghost" size="sm" onClick={() => {
          void navigator.clipboard.writeText(room.joinCode)
            .then(() => setNotice(t(TEXT.CODE_COPIED)))
            .catch(() => setNotice(t(TEXT.CODE_COPY_FAILED)));
        }} leftIcon={<Copy className="h-4 w-4" />}>
          {t(TEXT.COPY_CODE)}
        </Button>
        {room.visibility === "PRIVATE" && <details className="basis-full border-t border-border-subtle pt-3 sm:basis-auto sm:border-0 sm:pt-0">
          <summary className="w-fit cursor-pointer text-sm font-semibold text-primary-light outline-none focus-visible:ring-2 focus-visible:ring-amber">{t(TEXT.QR_ROOM_CODE)}</summary>
          <div className="mt-3 flex w-fit flex-col items-center gap-2 rounded-[var(--radius-control)] bg-white p-3">
            <QRCodeSVG value={room.joinCode} size={144} level="M" aria-label={t(TEXT.QR_ROOM_CODE)} />
          </div>
        </details>}
        <span className="flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] border border-border-subtle bg-surface-elevated px-3 py-2 text-sm font-semibold text-cream">
          <span className="text-amber-light">{room.participants.filter((item) => item.role === "PARTICIPANT").length}</span>
          <span className="text-subtle">/</span>
          <span>{room.maxParticipants ?? 32}</span>
        </span>
      </div>
      {room.isCreator && (
        <p className="rounded-[var(--radius-control)] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted">
          {t(TEXT.CREATOR_ROOM_HINT)}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {room.isCreator && room.status === "REGISTRATION_OPEN" && (
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" isLoading={busy} onClick={() => void closeRegistration(room.id)}>{t(TEXT.CLOSE_REGISTRATION)}</Button>
        )}
        {room.isCreator && room.status === "REGISTRATION_CLOSED" && (
          <Button size="sm" variant="amber" className="w-full sm:w-auto" isLoading={busy} onClick={() => void startLeague(room.id)}>{t(TEXT.START_NOW)}</Button>
        )}
        {room.isCreator && (room.status === "REGISTRATION_OPEN" || room.status === "REGISTRATION_CLOSED") && (
          <Button size="sm" variant="danger" className="w-full sm:w-auto" disabled={busy} onClick={() => setCancelConfirmationOpen(true)}>{t(TEXT.CANCEL_LEAGUE)}</Button>
        )}
        {room.viewerBattleSessionId && room.status === "IN_PROGRESS" && (
          <Button size="sm" variant="amber" className="w-full sm:w-auto" isLoading={busy} onClick={openDuel} leftIcon={<Swords className="h-4 w-4" />}>{t(TEXT.OPEN_DUEL)}</Button>
        )}
      </div>
      <LeagueBracket room={room} t={t} />
    </IntellioCard>
  );
}
