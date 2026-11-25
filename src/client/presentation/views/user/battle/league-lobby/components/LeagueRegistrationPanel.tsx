import React, { useMemo, useState } from "react";
import { KeyRound, RefreshCw, Swords, Users } from "lucide-react";
import type { LeagueRoomEntity } from "@/client/domain/league/entity/league_entity";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { LEAGUE_LOBBY_SEMANTIC_IDS as IDS } from "../constants/SemanticIdConstant";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "../constants/TextConstant";
import type { useLeagueLobby } from "../hooks/useLeagueLobby";

type LobbyModel = ReturnType<typeof useLeagueLobby>;
type Section = "PUBLIC" | "MINE" | "JOIN";

function statusText(room: LeagueRoomEntity, t: LobbyModel["t"]): string {
  if (room.status === "REGISTRATION_OPEN") return t(TEXT.STATUS_OPEN);
  if (room.status === "REGISTRATION_CLOSED") return t(TEXT.STATUS_CLOSED);
  if (room.status === "IN_PROGRESS") return t(TEXT.STATUS_PROGRESS);
  if (room.status === "COMPLETED") return t(TEXT.STATUS_COMPLETE);
  return t(TEXT.STATUS_CANCELLED);
}

function RoomCard({ room, mine, model }: { room: LeagueRoomEntity; mine: boolean; model: LobbyModel }): React.ReactElement {
  const { t, openJoinRoom, openRoom, busy } = model;
  const players = room.participants.filter((participant) => participant.role === "PARTICIPANT");
  const creatorName = room.participants.find((participant) => participant.userId === room.creatorId)?.displayName ?? t(TEXT.TITLE);

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="max-w-full truncate font-display text-lg font-bold text-cream">{creatorName}</h3>
          <Badge variant={room.status === "IN_PROGRESS" ? "emerald" : room.status === "REGISTRATION_OPEN" ? "amber" : "neutral"} size="sm">{statusText(room, t)}</Badge>
          <Badge variant={room.visibility === "PUBLIC" ? "primary" : "neutral"} size="sm">{t(room.visibility === "PUBLIC" ? TEXT.PUBLIC : TEXT.PRIVATE)}</Badge>
        </div>
        <p className="text-sm text-muted">
          {players.length}/{room.maxParticipants ?? 32} {t(TEXT.PARTICIPANTS).toLowerCase()}
          <span className="px-2 text-subtle">·</span>
          {room.rules.stakeMode === "FIXED_CARD" ? room.rules.fixedCardSlug : `${room.rules.battlePowerTarget} ±10%`}
          <span className="px-2 text-subtle">·</span>
          {room.rules.kingdom ?? t(TEXT.ANY_KINGDOM)}
        </p>
        {room.isCreator && <p className="text-xs text-subtle">{t(TEXT.CREATOR_BADGE)}</p>}
      </div>
      {mine ? (
        <Button size="sm" variant={room.status === "IN_PROGRESS" ? "amber" : "secondary"} className="shrink-0" isLoading={busy} onClick={() => void openRoom(room)}>{t(TEXT.OPEN_ROOM)}</Button>
      ) : (
        <Button size="sm" variant="amber" className="shrink-0" onClick={() => openJoinRoom(room)} leftIcon={<Swords className="h-4 w-4" />}>
          {room.status === "REGISTRATION_OPEN" ? t(TEXT.JOIN_ACTION) : t(TEXT.WATCH_ACTION)}
        </Button>
      )}
    </article>
  );
}

export function LeagueRegistrationPanel({ model }: { model: LobbyModel }): React.ReactElement {
  const { t, rooms, myRooms, activeSection, setActiveSection, loading, busy, refresh, openJoinByCode } = model;
  const [showHistory, setShowHistory] = useState(false);
  const activeRooms = useMemo(() => myRooms.filter((item) => item.status === "REGISTRATION_OPEN" || item.status === "REGISTRATION_CLOSED" || item.status === "IN_PROGRESS"), [myRooms]);
  const historyRooms = useMemo(() => myRooms.filter((item) => item.status === "COMPLETED" || item.status === "CANCELLED"), [myRooms]);
  const sections: Array<{ id: Section; title: string; count?: number; detail: string }> = [
    { id: "PUBLIC", title: t(TEXT.PUBLIC_ROOMS), count: rooms.length, detail: t(TEXT.JOIN_HINT) },
    { id: "MINE", title: t(TEXT.MY_LEAGUES), count: activeRooms.length, detail: `${activeRooms.length} ${t(TEXT.ACTIVE_COUNT)}` },
    { id: "JOIN", title: t(TEXT.JOIN_SECTION), detail: t(TEXT.JOIN_CODE_HINT) },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => {
          const selected = activeSection === section.id;
          const Icon = section.id === "PUBLIC" ? Users : section.id === "MINE" ? Swords : KeyRound;
          return (
            <button
              key={section.id}
              type="button"
              aria-pressed={selected}
              onClick={() => section.id === "JOIN" ? openJoinByCode() : setActiveSection(section.id)}
              className={`group min-h-32 rounded-[var(--radius-card)] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber sm:p-5 ${selected ? "border-amber/60 bg-surface-elevated" : "border-border-subtle bg-surface hover:border-border-base"}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-lg font-bold text-cream">{section.title}</span>
                <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-amber-light" : "text-muted"}`} aria-hidden="true" />
              </span>
              <span className="mt-2 block text-sm text-muted">{section.detail}</span>
              {section.count !== undefined && <span className="mt-3 inline-flex items-baseline gap-2 text-sm text-subtle"><strong className="font-display text-2xl text-amber-light">{section.count}</strong>{section.id === "MINE" ? t(TEXT.ACTIVE_COUNT) : t(TEXT.PUBLIC_ROOMS)}</span>}
            </button>
          );
        })}
      </div>

      {activeSection === "PUBLIC" && <IntellioCard id={IDS.PUBLIC_ROOMS} variant="elevated" padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div><h2 className="font-display text-xl font-bold text-cream">{t(TEXT.PUBLIC_ROOMS)}</h2><p className="mt-1 text-sm text-muted">{rooms.length} {t(TEXT.PUBLIC_ROOMS).toLowerCase()}</p></div>
          <Button size="xs" shape="rounded" variant="ghost" disabled={busy || loading} onClick={() => void refresh()} leftIcon={<RefreshCw className="h-4 w-4" />}>{t(TEXT.REFRESH)}</Button>
        </div>
        {loading ? <p role="status" className="rounded-[var(--radius-control)] bg-surface-muted p-4 text-sm text-muted">{t(TEXT.LOADING)}</p> : rooms.length === 0 ? (
          <p className="rounded-[var(--radius-control)] border border-dashed border-border-base p-5 text-sm text-muted">{t(TEXT.NO_ROOMS)}</p>
        ) : <div className="space-y-3">{rooms.map((item) => <RoomCard key={item.id} room={item} mine={myRooms.some((mine) => mine.id === item.id)} model={model} />)}</div>}
      </IntellioCard>}

      {activeSection === "MINE" && <IntellioCard id={IDS.MY_ROOMS} variant="elevated" padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div><h2 className="font-display text-xl font-bold text-cream">{t(TEXT.MY_LEAGUES)}</h2><p className="mt-1 text-sm text-muted">{activeRooms.length} {t(TEXT.ACTIVE_COUNT)}</p></div>
          <Button size="xs" shape="rounded" variant="ghost" disabled={busy || loading} onClick={() => void refresh()} leftIcon={<RefreshCw className="h-4 w-4" />}>{t(TEXT.REFRESH)}</Button>
        </div>
        {loading ? <p role="status" className="rounded-[var(--radius-control)] bg-surface-muted p-4 text-sm text-muted">{t(TEXT.LOADING)}</p> : activeRooms.length === 0 ? (
          <p className="rounded-[var(--radius-control)] border border-dashed border-border-base p-5 text-sm text-muted">{t(TEXT.NO_MY_LEAGUES)}</p>
        ) : <div className="space-y-3">{activeRooms.map((item) => <RoomCard key={item.id} room={item} mine model={model} />)}</div>}
        {historyRooms.length > 0 && <div className="border-t border-border-subtle pt-4">
          <Button variant="ghost" size="sm" aria-expanded={showHistory} onClick={() => setShowHistory((value) => !value)}>{t(showHistory ? TEXT.HIDE_HISTORY : TEXT.SHOW_HISTORY)} · {historyRooms.length}</Button>
          {showHistory && <div className="mt-3 space-y-3">{historyRooms.map((item) => <RoomCard key={item.id} room={item} mine model={model} />)}</div>}
        </div>}
      </IntellioCard>}

      {activeSection === "JOIN" && <IntellioCard id={IDS.JOIN_CODE_FORM} variant="elevated" padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl"><h2 className="font-display text-xl font-bold text-cream">{t(TEXT.JOIN_SECTION)}</h2><p className="mt-1 text-sm leading-relaxed text-muted">{t(TEXT.JOIN_HINT)}</p></div>
        <Button variant="amber" onClick={openJoinByCode} leftIcon={<KeyRound className="h-4 w-4" />}>{t(TEXT.JOIN_CODE)}</Button>
      </IntellioCard>}
    </div>
  );
}
