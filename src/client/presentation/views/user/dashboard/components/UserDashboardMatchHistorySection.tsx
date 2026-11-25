"use client";

import React from "react";
import Link from "next/link";
import { Clock, ShieldCheck, Swords, Trophy } from "lucide-react";
import type { MatchLogEntity } from "@/client/domain/battle/entity/battle_entity";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { Badge, Button, IntellioCard } from "@/client/presentation/components/ui";
import { USER_DASHBOARD_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { USER_DASHBOARD_TEXT_CONSTANT } from "../constants/TextConstant";

export interface UserDashboardMatchHistorySectionProps {
  readonly matchHistory: readonly MatchLogEntity[];
}

export function UserDashboardMatchHistorySection({
  matchHistory,
}: UserDashboardMatchHistorySectionProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={USER_DASHBOARD_SEMANTIC_IDS.MATCH_HISTORY_SECTION}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-cream">
          <Trophy className="h-5 w-5 text-amber-light" aria-hidden="true" />
          <span>{t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_TITLE)}</span>
        </h2>
        <Button
          href={ROUTES.USER_BATTLE(locale)}
          variant="secondary"
          size="sm"
          leftIcon={<Swords className="h-4 w-4" />}
        >
          {t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_ACTION_LOBBY)}
        </Button>
      </div>

      <IntellioCard
        id={USER_DASHBOARD_SEMANTIC_IDS.MATCH_HISTORY_CARD}
        variant="glass"
        padding="md"
        className="divide-y divide-border-subtle"
      >
        {matchHistory.length === 0 ? (
          <div
            id={USER_DASHBOARD_SEMANTIC_IDS.MATCH_EMPTY}
            className="py-12 text-center"
          >
            <Clock className="mx-auto h-8 w-8 text-subtle" />
            <h3 className="mt-3 font-display text-base font-bold text-cream">
              {t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_EMPTY_TITLE)}
            </h3>
            <p className="nc-type-body-sm mx-auto mt-1 max-w-sm text-muted">
              {t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_EMPTY_DESC)}
            </p>
            <div className="mt-5">
              <Button href={ROUTES.USER_BATTLE(locale)} size="sm">
                {t(USER_DASHBOARD_TEXT_CONSTANT.ACTION_BATTLE_LOBBY)}
              </Button>
            </div>
          </div>
        ) : (
          <div
            id={USER_DASHBOARD_SEMANTIC_IDS.MATCH_HISTORY_LIST}
            className="space-y-3 pt-1"
          >
            {matchHistory.slice(0, 6).map((m) => {
              const isWin = m.winner === "PLAYER";
              return (
                <div
                  key={m.id}
                  id={`${USER_DASHBOARD_SEMANTIC_IDS.MATCH_ITEM_PREFIX}${m.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-elevated/40 p-3.5 transition-colors hover:bg-surface-elevated/70"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-bold ${
                        isWin
                          ? "bg-emerald/15 text-emerald-light"
                          : "bg-danger/15 text-danger-light"
                      }`}
                    >
                      {isWin ? "W" : "L"}
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-cream">
                        {isWin
                          ? t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_VICTORY)
                          : t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_DEFEAT)}{" "}
                        <span className="text-xs font-normal text-subtle">
                          (Ronde {m.totalTurns})
                        </span>
                      </div>
                      <div className="nc-type-caption text-subtle">
                        vs Bot {m.botDifficulty}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isWin ? "emerald" : "danger"} size="sm">
                      {isWin
                        ? t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_VICTORY)
                        : t(USER_DASHBOARD_TEXT_CONSTANT.HISTORY_DEFEAT)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </IntellioCard>
    </section>
  );
}
