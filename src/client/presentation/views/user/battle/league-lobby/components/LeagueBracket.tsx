import React from "react";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import type { LeagueRoomEntity } from "@/client/domain/league/entity/league_entity";
import type { useTranslator } from "@/core/translator";
import { Badge } from "@/client/presentation/components/ui";
import { LEAGUE_LOBBY_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { LEAGUE_TEXT_CONSTANT as TEXT } from "../constants/TextConstant";

type Translate = ReturnType<typeof useTranslator>["t"];

export function LeagueBracket({ room, t }: { room: LeagueRoomEntity; t: Translate }): React.ReactElement {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section className="rounded-[var(--radius-control)] border border-border-subtle bg-surface p-4 sm:p-5 lg:col-span-4">
        <h3 className="mb-3 font-display text-base font-bold text-cream">{t(TEXT.PARTICIPANTS)}</h3>
        <ul className="max-h-96 space-y-2 overflow-auto pr-1 text-sm">
          {room.participants.map((participant) => (
            <li key={participant.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border-subtle bg-surface-elevated px-3 py-2.5">
              <span className="min-w-0 truncate font-medium text-cream">{participant.displayName}</span>
              <span className="flex shrink-0 items-center gap-2">
                {participant.userId === room.creatorId && <Badge variant="primary" size="sm">{t(TEXT.CREATOR_BADGE)}</Badge>}
                <span className="text-xs text-muted">{participant.role === "PARTICIPANT" ? t(TEXT.PARTICIPANT) : t(TEXT.SPECTATOR)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section id={LEAGUE_LOBBY_SEMANTIC_IDS.BRACKET} className="min-w-0 lg:col-span-8">
        <h3 className="mb-3 font-display text-base font-bold text-cream">{t(TEXT.BRACKET)}</h3>
        {room.matches.length === 0 && room.bracketPreview.length === 0 ? (
          <p className="rounded-[var(--radius-control)] border border-dashed border-border-base p-4 text-sm text-muted">
            {t(room.status === "REGISTRATION_OPEN" ? TEXT.BRACKET_WAITING : TEXT.BRACKET_EMPTY)}
          </p>
        ) : room.matches.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted">{t(TEXT.BRACKET_PREVIEW)}</p>
            <ol className="space-y-3">{room.bracketPreview.map((pairing, index) => (
              <li key={pairing.playerTwo ? `${pairing.playerOne.userId}-${pairing.playerTwo.userId}` : pairing.playerOne.userId} className="rounded-[var(--radius-control)] border border-border-subtle bg-surface p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-amber-light">{t(TEXT.BATTLE_ROUND_LABEL)} 1 · {index + 1}</span>
                  {pairing.playerTwo ? <Badge variant="neutral" size="sm">{t(TEXT.STATUS_CLOSED)}</Badge> : <Badge variant="emerald" size="sm">{t(TEXT.BYE)}</Badge>}
                </div>
                <p className="break-words text-sm font-semibold text-cream">
                  {pairing.playerOne.displayName}
                  {pairing.playerTwo && <> <span className="px-1 font-normal text-subtle">vs</span>{pairing.playerTwo.displayName}</>}
                </p>
              </li>
            ))}</ol>
          </div>
        ) : <ol className="space-y-3">{room.matches.map((match) => (
          <li key={match.id} className="min-w-0 rounded-[var(--radius-control)] border border-border-subtle bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-light">{t(TEXT.BATTLE_ROUND_LABEL)} {match.roundNumber}</span>
              <Badge variant={match.winnerId ? "emerald" : "neutral"} size="sm">
                {match.winnerId ? t(TEXT.WINNER) : match.status}
              </Badge>
            </div>
            <p className="mt-2 break-words text-sm font-semibold leading-relaxed text-cream sm:text-base">
              {match.playerOne.displayName} <span className="px-1 font-normal text-subtle">vs</span> {match.playerTwo?.displayName ?? "BYE"}
            </p>
            {match.winnerId && <p className="mt-1 text-xs text-muted">{t(TEXT.WINNER)}: {room.participants.find((participant) => participant.userId === match.winnerId)?.displayName ?? "—"}</p>}
            {match.spectatorView && (
              <div className="mt-4 space-y-3 border-t border-border-subtle pt-3 text-xs">
                  <p className="font-semibold text-amber-light">{t(TEXT.BATTLE_TURN_LABEL)} {match.spectatorView.turnNumber} <span className="px-1 text-subtle">·</span> {match.spectatorView.phase}</p>
                  <p>{t(TEXT.VISIBLE_CHARACTERS)}</p>
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { name: match.playerOne.displayName, cards: [...match.spectatorView.playerFrontRow, ...match.spectatorView.playerSecondRow] },
                      { name: match.playerTwo?.displayName ?? "—", cards: [...match.spectatorView.opponentFrontRow, ...match.spectatorView.opponentSecondRow] },
                    ].map((side) => (
                      <div key={`${match.id}-${side.name}`} className="min-w-0 space-y-2">
                        <p className="truncate text-xs font-semibold text-cream">{side.name}</p>
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                          {side.cards.filter((card): card is NonNullable<typeof card> => card !== null)
                            .map((card) => <CardVisual key={`${match.id}-${side.name}-${card.slug}`} card={card} size="sm" showName={false} showDescription={false} showOverlay={false} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="break-words text-muted">{t(TEXT.USED_INSTRUMENTS)}: {match.spectatorView.usedInstruments.map((instrument) => instrument.name).join(", ") || "—"}</p>
                  {match.spectatorView.recentLogs.length > 0 && <ul className="max-h-24 space-y-1 overflow-auto text-muted">{match.spectatorView.recentLogs.map((log, index) => <li key={`${match.id}-log-${index}`}>{log}</li>)}</ul>}
              </div>
            )}
          </li>
        ))}</ol>}
      </section>
    </div>
  );
}
