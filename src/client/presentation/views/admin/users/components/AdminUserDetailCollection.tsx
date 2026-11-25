"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ExternalLink, Layers, LibraryBig, Search, UserRound } from "lucide-react";
import { InputField } from "@/client/presentation/components/ui";
import type { AdminUserDetailEntity } from "@/client/domain/auth/entity/user_entity";
import { ROUTES, type SupportedLocale } from "@/core/constants/routes";
import { formatKingdomLabel, formatRoleLabel } from "@/core/utils/formatters";
import type { AdminUserCardFilter } from "../hooks/useAdminUserDetail";
import { ADMIN_USERS_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { useTranslator } from "@/core/translator";
import { ADMIN_USERS_TEXT_CONSTANT } from "../constants/TextConstant";

export interface AdminUserDetailCollectionProps {
  readonly detail: AdminUserDetailEntity;
  readonly locale: SupportedLocale;
  readonly cardSearch: string;
  readonly cardFilter: AdminUserCardFilter;
  readonly filteredCards: AdminUserDetailEntity["ownedCards"];
  readonly cardsBySlug: ReadonlyMap<string, AdminUserDetailEntity["ownedCards"][number]>;
  readonly deckUpdatedAtLabels: ReadonlyMap<string, string>;
  readonly deckCardCounts: ReadonlyMap<string, number>;
  readonly onSearchChange: (value: string) => void;
  readonly onFilterChange: (filter: AdminUserCardFilter) => void;
}

export function AdminUserDetailCollection({ detail, locale, cardSearch, cardFilter, filteredCards, cardsBySlug, deckUpdatedAtLabels, deckCardCounts, onSearchChange, onFilterChange }: AdminUserDetailCollectionProps): React.ReactElement {
  const { t } = useTranslator();
  const cardFilters = [
    ["ALL", ADMIN_USERS_TEXT_CONSTANT.DETAIL_FILTER_ALL],
    ["CHARACTER", ADMIN_USERS_TEXT_CONSTANT.DETAIL_FILTER_CHARACTER],
    ["INSTRUMENT", ADMIN_USERS_TEXT_CONSTANT.DETAIL_FILTER_INSTRUMENT],
    ["MAJAPAHIT", ADMIN_USERS_TEXT_CONSTANT.DETAIL_FILTER_MAJAPAHIT],
    ["PAJAJARAN", ADMIN_USERS_TEXT_CONSTANT.DETAIL_FILTER_PAJAJARAN],
  ] as const;
  return (
    <>
      {/* Owned cards */}
      <section id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_INVENTORY} className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(103,102,255,0.18)] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6766FF]/20 text-[#A9A8FF]">
              <LibraryBig className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-white">
                  {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INVENTORY_TITLE)}
                </h2>
                <span className="nc-badge-primary">
                  {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INVENTORY_COUNT, { count: detail.ownedCards.length })}
                </span>
              </div>
              <p className="text-xs text-[#CFCBE2]">
                {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INVENTORY_DESCRIPTION)}
              </p>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <InputField
                id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_CARD_SEARCH}
                aria-label={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INVENTORY_SEARCH)}
                type="text"
                placeholder={t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INVENTORY_SEARCH)}
                value={cardSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-[#CFCBE2]" aria-hidden="true" />}
                sizeVariant="sm"
                className="!bg-[#07011F] !pr-3"
              />
            </div>

            <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_INVENTORY_FILTERS} className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[rgba(103,102,255,0.2)] bg-[#07011F] p-1">
              {cardFilters.map(([filterKey, filterTextKey]) => (
                <button
                  key={filterKey}
                  id={`${ADMIN_USERS_SEMANTIC_IDS.DETAIL_CARD_FILTER_PREFIX}${filterKey.toLowerCase()}`}
                  type="button"
                  aria-pressed={cardFilter === filterKey}
                  onClick={() => onFilterChange(filterKey)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    cardFilter === filterKey
                      ? "bg-[#6766FF] text-white shadow-xs"
                      : "text-[#CFCBE2] hover:text-white"
                  }`}
                >
                  {t(filterTextKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card Grid Content */}
        {filteredCards.length === 0 ? (
          <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_INVENTORY_EMPTY} className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/60 p-12 text-center">
            <UserRound className="mx-auto mb-3 h-10 w-10 text-[#6766FF]/60" />
            <p className="font-display text-base font-bold text-white">
              {detail.ownedCards.length === 0
                ? t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_EMPTY_CARDS_TITLE)
                : t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_NO_MATCHING_CARDS)}
            </p>
            <p className="mt-1 text-xs text-[#CFCBE2]">
              {detail.ownedCards.length === 0
                ? t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_EMPTY_COLLECTION)
                : t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_CHANGE_FILTERS)}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => {
              const isMajapahit = card.kingdom === "MAJAPAHIT";
              const isPajajaran = card.kingdom === "PAJAJARAN";

              return (
                <div
                  key={card.id}
                  id={`${ADMIN_USERS_SEMANTIC_IDS.DETAIL_CARD_ITEM_PREFIX}${card.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(103,102,255,0.22)] bg-[#07011F]/90 transition-all duration-300 hover:border-[#6766FF] hover:shadow-[0_8px_24px_rgba(103,102,255,0.2)]"
                >
                  {/* Card Art Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden bg-gradient-to-b from-[#080220] to-[#0F0927]">
                    <Image
                      src={card.imagePath}
                      alt={card.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Quantity Badge on Artwork */}
                    <div className="absolute right-2.5 top-2.5 rounded-full border border-white/20 bg-[#080220]/90 px-2.5 py-0.5 text-xs font-extrabold text-[#3CE089] shadow-md backdrop-blur-xs">
                      × {card.quantity}
                    </div>

                    {/* Kingdom Accent Badge */}
                    <div className="absolute left-2.5 top-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isMajapahit
                            ? "bg-[#FF9F31]/20 text-[#FF9F31] border border-[#FF9F31]/30"
                            : isPajajaran
                            ? "bg-[#6766FF]/20 text-[#A9A8FF] border border-[#6766FF]/30"
                            : "bg-white/10 text-white/90 border border-white/20"
                        }`}
                      >
                        {card.code}
                      </span>
                    </div>
                  </div>

                  {/* Card Info Details */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[11px] text-[#A9A8FF]">
                        <span>{formatKingdomLabel(card.kingdom)}</span>
                        <span className="text-[#CFCBE2]">
                          {card.cardType === "CHARACTER"
                            ? formatRoleLabel(card.role)
                            : t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INSTRUMENT)}
                        </span>
                      </div>

                      <h3 className="mt-1 font-display text-base font-bold text-white group-hover:text-[#A9A8FF] transition-colors truncate">
                        <Link
                          id={`${ADMIN_USERS_SEMANTIC_IDS.DETAIL_CARD_LINK_PREFIX}${card.id}`}
                          href={ROUTES.ADMIN_CARD_DETAIL(locale, card.slug)}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span className="truncate">{card.name}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </h3>
                    </div>

                    {/* Stats or Effect Preview */}
                    <div className="mt-3 pt-3 border-t border-[rgba(103,102,255,0.14)]">
                      {card.cardType === "CHARACTER" ? (
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1 text-rose-300">
                            <span className="text-[10px] text-[#CFCBE2]">{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_STAT_ATTACK)}</span>
                            {card.baseAttack}
                          </span>
                          <span className="flex items-center gap-1 text-blue-300">
                            <span className="text-[10px] text-[#CFCBE2]">{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_STAT_DEFENSE)}</span>
                            {card.baseDefense}
                          </span>
                        </div>
                      ) : (
                        <p className="truncate text-xs text-[#3CE089]">
                          {card.effectName ?? t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_MUSIC_EFFECT)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Saved decks */}
      <section id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_DECKS} className="space-y-5 rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[rgba(103,102,255,0.18)] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0DB561]/20 text-[#0DB561]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-white">
                  {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_DECKS_TITLE)}
                </h2>
                <span className="nc-badge-primary">
                  {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_DECKS_COUNT, { count: detail.decks.length })}
                </span>
              </div>
              <p className="text-xs text-[#CFCBE2]">
                {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_DECKS_DESCRIPTION)}
              </p>
            </div>
          </div>
        </div>

        {detail.decks.length === 0 ? (
          <div id={ADMIN_USERS_SEMANTIC_IDS.DETAIL_DECKS_EMPTY} className="rounded-2xl border border-[rgba(103,102,255,0.18)] bg-[#07011F]/60 p-12 text-center">
            <Layers className="mx-auto mb-3 h-10 w-10 text-[#0DB561]/50" />
            <p className="font-display text-base font-bold text-white">
              {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_EMPTY_DECKS_TITLE)}
            </p>
            <p className="mt-1 text-xs text-[#CFCBE2]">
              {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_EMPTY_DECKS)}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {detail.decks.map((deck) => {
              const totalCardsCount = deckCardCounts.get(deck.id) ?? 0;

              return (
                <div
                  key={deck.id}
                  id={`${ADMIN_USERS_SEMANTIC_IDS.DETAIL_DECK_ITEM_PREFIX}${deck.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-[rgba(103,102,255,0.22)] bg-[#07011F]/80 p-5 backdrop-blur-xs transition hover:border-[#6766FF]/60"
                >
                  <div>
                    {/* Deck Top Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-white">
                            {deck.name}
                          </h3>
                          {deck.isPreset && (
                            <span className="rounded-md bg-[#6766FF]/20 px-2 py-0.5 text-[10px] font-bold text-[#A9A8FF] border border-[#6766FF]/30">
                              {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_PRESET)}
                            </span>
                          )}
                        </div>
                        {deck.description && (
                          <p className="mt-1 text-xs text-[#CFCBE2] line-clamp-2">
                            {deck.description}
                          </p>
                        )}
                      </div>

                      <span className="nc-badge-amber">
                        {deck.kingdomFilter === "MIXED" || !deck.kingdomFilter
                          ? t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_MIXED)
                          : formatKingdomLabel(deck.kingdomFilter)}
                      </span>
                    </div>

                    {/* Deck Slots Cards List */}
                    <div className="mt-4 space-y-3.5">
                      {/* Character Cards */}
                      <div>
                        <p className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#A9A8FF]">
                          <span>{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_CHARACTER)}</span>
                          <span>{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_CARD_COUNT, { count: deck.characterSlugs.length })}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {deck.characterSlugs.length === 0 ? (
                            <span className="text-xs text-[#A5A1B9] italic">
                              {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_NO_CHARACTER_CARDS)}
                            </span>
                          ) : (
                            deck.characterSlugs.map((slug, idx) => {
                              const cardData = cardsBySlug.get(slug);
                              return (
                                <Link
                                  key={`${slug}-${idx}`}
                                  id={`${ADMIN_USERS_SEMANTIC_IDS.DETAIL_DECK_CHARACTER_LINK_PREFIX}${deck.id}-${idx}`}
                                  href={ROUTES.ADMIN_CARD_DETAIL(locale, slug)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[rgba(103,102,255,0.22)] bg-[#0F0927] px-2.5 py-1 text-xs text-white hover:border-[#6766FF] hover:text-[#A9A8FF] transition-colors"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#6766FF]" />
                                  <span className="truncate max-w-[150px]">
                                    {cardData?.name ?? slug}
                                  </span>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Instrument Cards */}
                      <div>
                        <p className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#0DB561]">
                          <span>{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_INSTRUMENTS)}</span>
                          <span>{t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_CARD_COUNT, { count: deck.instrumentSlugs.length })}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {deck.instrumentSlugs.length === 0 ? (
                            <span className="text-xs text-[#A5A1B9] italic">
                              {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_NO_INSTRUMENT_CARDS)}
                            </span>
                          ) : (
                            deck.instrumentSlugs.map((slug, idx) => {
                              const cardData = cardsBySlug.get(slug);
                              return (
                                <Link
                                  key={`${slug}-${idx}`}
                                  id={`${ADMIN_USERS_SEMANTIC_IDS.DETAIL_DECK_INSTRUMENT_LINK_PREFIX}${deck.id}-${idx}`}
                                  href={ROUTES.ADMIN_CARD_DETAIL(locale, slug)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#0DB561]/25 bg-[#0F0927] px-2.5 py-1 text-xs text-white hover:border-[#0DB561] hover:text-[#3CE089] transition-colors"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DB561]" />
                                  <span className="truncate max-w-[150px]">
                                    {cardData?.name ?? slug}
                                  </span>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deck Footer */}
                  <div className="mt-5 pt-3.5 border-t border-[rgba(103,102,255,0.16)] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A5A1B9]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_TOTAL_CARDS, { count: totalCardsCount })}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-[#A5A1B9]" />
                      <span className="text-[11px]">
                        {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_SLOT_COUNT, { count: totalCardsCount })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="h-3.5 w-3.5 text-[#CFCBE2]" />
                      <span>
                        {t(ADMIN_USERS_TEXT_CONSTANT.DETAIL_UPDATED_PREFIX)}{" "}
                        {deckUpdatedAtLabels.get(deck.id)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
