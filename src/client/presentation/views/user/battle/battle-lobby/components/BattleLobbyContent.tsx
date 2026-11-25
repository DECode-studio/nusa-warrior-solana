"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Flame, Search, Shield, Swords, Trophy } from "lucide-react";
import type { BotDifficulty, MatchLogEntity } from "@/client/domain/battle/entity/battle_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import type { DeckEntity } from "@/client/domain/deck/entity/deck_entity";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { CardVisual } from "@/client/presentation/components/CardVisual";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { UserFeedback, UserPageHeading } from "@/client/presentation/components/user";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface BattleLobbyContentProps {
  readonly decks: readonly DeckEntity[];
  readonly selectedDeckId: string;
  readonly onSelectDeckId: (id: string) => void;
  readonly botDifficulty: BotDifficulty;
  readonly onSelectDifficulty: (difficulty: BotDifficulty) => void;
  readonly previewDeckCards: readonly CardEntity[];
  readonly activeLobbyDeck: DeckEntity | null;
  readonly matchHistory: readonly MatchLogEntity[];
  readonly onStartBattle: () => void;
  readonly onQuickMatch: () => void;
  readonly hasSavedBattleSession: boolean;
  readonly onInspectCard: (card: CardEntity) => void;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
}

export function BattleLobbyContent({
  decks,
  selectedDeckId,
  onSelectDeckId,
  botDifficulty,
  onSelectDifficulty,
  previewDeckCards,
  activeLobbyDeck,
  matchHistory,
  onStartBattle,
  onQuickMatch,
  hasSavedBattleSession,
  onInspectCard,
  loading,
  error,
  onRetry,
}: BattleLobbyContentProps): React.ReactElement {
  const { locale, t } = useTranslator();
  const savedUserDecks = decks.filter((deck) => !deck.isPreset && !deck.isTemporary);
  const temporaryDecks = decks.filter((deck) => deck.isTemporary);
  const battleDeckOptions = savedUserDecks.length > 0
    ? savedUserDecks
    : temporaryDecks.length > 0
      ? temporaryDecks
      : decks;

  const difficulties: readonly {
    id: BotDifficulty;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "EASY",
      label: t(BATTLE_TEXT_CONSTANT.DIFFICULTY_EASY),
      desc: t(BATTLE_TEXT_CONSTANT.DIFFICULTY_EASY_DESC),
      icon: <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: "MEDIUM",
      label: t(BATTLE_TEXT_CONSTANT.DIFFICULTY_MEDIUM),
      desc: t(BATTLE_TEXT_CONSTANT.DIFFICULTY_MEDIUM_DESC),
      icon: <Swords className="h-4 w-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: "HARD",
      label: t(BATTLE_TEXT_CONSTANT.DIFFICULTY_HARD),
      desc: t(BATTLE_TEXT_CONSTANT.DIFFICULTY_HARD_DESC),
      icon: <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />,
    },
  ];

  return (
    <div id={BATTLE_SEMANTIC_IDS.LOBBY_ROOT} className="space-y-6">
      <div id={BATTLE_SEMANTIC_IDS.LOBBY_HEADING}>
        <UserPageHeading
          title={t(BATTLE_TEXT_CONSTANT.LOBBY_HEADING)}
          description={t(BATTLE_TEXT_CONSTANT.LOBBY_SUBHEADING)}
        />
      </div>

      {loading && (
        <UserFeedback kind="loading" title={t(BATTLE_TEXT_CONSTANT.COMMON_LOADING)} />
      )}
      {!loading && error && (
        <UserFeedback
          kind="error"
          title={t(BATTLE_TEXT_CONSTANT.LOBBY_LOAD_ERROR_TITLE)}
          description={error}
          action={
            <Button onClick={onRetry} size="sm">
              {t(BATTLE_TEXT_CONSTANT.RETRY)}
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Deck & Difficulty Configuration */}
        <div className="space-y-5 lg:col-span-5">
          <IntellioCard variant="glass" padding="sm" className="space-y-5">
            <div>
              <label
                htmlFor={BATTLE_SEMANTIC_IDS.DECK_SELECT}
                className="mb-2 block text-xs font-bold text-muted"
              >
                {t(BATTLE_TEXT_CONSTANT.DECK_SELECTOR_LABEL)}
              </label>
              <select
                id={BATTLE_SEMANTIC_IDS.DECK_SELECT}
                value={selectedDeckId}
                onChange={(e) => onSelectDeckId(e.target.value)}
                className="w-full rounded-xl border border-border-base bg-surface px-4 py-3 font-display text-sm font-bold text-cream focus:border-primary focus:outline-none"
              >
                {battleDeckOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({t(BATTLE_TEXT_CONSTANT.CARACTER_COUNT, { count: d.characterSlugs.length })} •{" "}
                    {t(BATTLE_TEXT_CONSTANT.INSTRUMENT_COUNT, { count: d.instrumentSlugs.length })})
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{t(BATTLE_TEXT_CONSTANT.DECK_COMPOSITION_PROMPT)}</span>
                <Link
                  href={ROUTES.USER_DECKS(locale)}
                  className="font-bold text-primary-light hover:text-white"
                >
                  {t(BATTLE_TEXT_CONSTANT.OPEN_DECK_BUILDER)} →
                </Link>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-bold text-muted">
                {t(BATTLE_TEXT_CONSTANT.BOT_DIFFICULTY_LABEL)}
              </span>
              <div
                role="group"
                aria-label={t(BATTLE_TEXT_CONSTANT.BOT_DIFFICULTY_LABEL)}
                className="grid grid-cols-3 gap-2 sm:gap-2.5"
              >
                {difficulties.map((diff) => {
                  const isSelected = botDifficulty === diff.id;
                  return (
                    <Button
                      key={diff.id}
                      id={`${BATTLE_SEMANTIC_IDS.DIFFICULTY_BTN_PREFIX}${diff.id.toLowerCase()}`}
                      ariaPressed={isSelected}
                      onClick={() => onSelectDifficulty(diff.id)}
                      variant={isSelected ? "primary" : "secondary"}
                      shape="rounded"
                      size="sm"
                      className="h-auto min-h-[5.5rem] w-full flex-col items-center justify-center overflow-hidden px-1.5 py-3 text-center sm:px-2"
                    >
                      <span
                        className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-primary/15 text-primary-light"
                        }`}
                      >
                        {diff.icon}
                      </span>
                      <span className="block w-full font-display text-xs font-bold leading-tight sm:text-sm">
                        {diff.label}
                      </span>
                      <span
                        className={`mt-0.5 block w-full text-[10px] leading-tight ${
                          isSelected ? "text-white/85" : "text-muted"
                        }`}
                      >
                        {diff.desc}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button
              id={BATTLE_SEMANTIC_IDS.START_BATTLE_BTN}
              onClick={onStartBattle}
              size="md"
              variant="primary"
              className="w-full"
              leftIcon={<Swords className="h-4 w-4" aria-hidden="true" />}
            >
              {hasSavedBattleSession ? t(BATTLE_TEXT_CONSTANT.CONTINUE_MATCH) : t(BATTLE_TEXT_CONSTANT.START_BATTLE_BTN)}
            </Button>

            <Button
              id={BATTLE_SEMANTIC_IDS.QUICK_MATCH_BTN}
              onClick={onQuickMatch}
              size="md"
              variant="secondary"
              className="w-full"
              leftIcon={<Search className="h-4 w-4 text-primary-light" aria-hidden="true" />}
            >
              {t(BATTLE_TEXT_CONSTANT.QUICK_MATCH)}
            </Button>

            <Button
              id={BATTLE_SEMANTIC_IDS.LEAGUE_BTN}
              href={ROUTES.USER_LEAGUES(locale)}
              size="md"
              variant="secondary"
              className="w-full"
              leftIcon={<Trophy className="h-4 w-4 text-amber-light" aria-hidden="true" />}
            >
              {t(BATTLE_TEXT_CONSTANT.LEAGUE_TITLE)}
            </Button>
          </IntellioCard>

          {/* Rules Summary Card */}
          <IntellioCard variant="glass" padding="sm" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-cream">
                <BookOpen className="h-4 w-4 text-amber-light" aria-hidden="true" />
                <span>{t(BATTLE_TEXT_CONSTANT.RULES_SUMMARY_TITLE)}</span>
              </h3>
              <Link
                href={ROUTES.USER_TUTORIAL(locale)}
                className="text-xs font-bold text-primary-light hover:text-white"
              >
                {t(BATTLE_TEXT_CONSTANT.FULL_TUTORIAL)} →
              </Link>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted">
              <li>• {t(BATTLE_TEXT_CONSTANT.FORMATION_RULE)}</li>
              <li>• {t(BATTLE_TEXT_CONSTANT.INSTRUMENT_RULE)}</li>
              <li>• {t(BATTLE_TEXT_CONSTANT.CLASH_RULE)}</li>
            </ul>
          </IntellioCard>
        </div>

        {/* Right Column: Active Deck Preview & Recent Matches */}
        <div className="space-y-6 lg:col-span-7">
          <IntellioCard
            id={BATTLE_SEMANTIC_IDS.LOBBY_DECK_PREVIEW}
            variant="glass"
            padding="sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-cream">
                  {t(BATTLE_TEXT_CONSTANT.TROOP_PREVIEW)}:{" "}
                  <span className="text-primary-light">
                    {activeLobbyDeck?.name ?? t(BATTLE_TEXT_CONSTANT.DEFAULT_DECK_NAME)}
                  </span>
                </h3>
                <p className="text-xs text-muted">
                  {t(BATTLE_TEXT_CONSTANT.TROOP_PREVIEW_DESC)}
                </p>
              </div>
              <Badge variant="emerald">{t(BATTLE_TEXT_CONSTANT.READY_FOR_BATTLE)}</Badge>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
              {previewDeckCards.map((card, index) => (
                <CardVisual
                  key={`${card.slug}-${index}`}
                  card={card}
                  size="sm"
                  showOverlay={false}
                  onClick={() => onInspectCard(card)}
                />
              ))}
            </div>
          </IntellioCard>

          <IntellioCard variant="glass" padding="sm">
            <h3 className="font-display text-base font-bold text-cream">
              {t(BATTLE_TEXT_CONSTANT.RECENT_MATCHES, { count: matchHistory.length })}
            </h3>
            {matchHistory.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                {t(BATTLE_TEXT_CONSTANT.EMPTY_MATCH_HISTORY)}{" "}
                <strong>{t(BATTLE_TEXT_CONSTANT.START_BATTLE)}</strong>
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {matchHistory.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-cream">
                        {m.playerDeckName}
                      </div>
                      <div className="text-[11px] text-muted">
                        {m.botDifficulty === "PVP" ? "PvP" : `${t(BATTLE_TEXT_CONSTANT.BOT_LABEL)} ${m.botDifficulty}`} • {t(BATTLE_TEXT_CONSTANT.TURNS_LABEL, { count: m.totalTurns })}
                      </div>
                    </div>
                    <Badge variant={m.winner === "PLAYER" ? "emerald" : "danger"}>
                      {m.winner === "PLAYER" ? t(BATTLE_TEXT_CONSTANT.RESULT_WIN) : t(BATTLE_TEXT_CONSTANT.RESULT_LOSS)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </IntellioCard>
        </div>
      </div>
    </div>
  );
}
