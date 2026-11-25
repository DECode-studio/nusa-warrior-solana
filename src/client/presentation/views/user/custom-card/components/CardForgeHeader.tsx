"use client";

import React from "react";
import { Sparkles, Coins, Lock, Link2 } from "lucide-react";
import type { CustomCardPricingEntity } from "@/client/domain/custom-card/entity/custom_card_entity";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeHeaderProps {
  readonly pricing: CustomCardPricingEntity | null;
}

export function CardForgeHeader({
  pricing,
}: CardForgeHeaderProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div className="space-y-6">
      <div
        id={CARD_FORGE_SEMANTIC_IDS.HEADER_BANNER}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#1c1a2e] via-[#161426] to-[#0f0e1a] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t(CARD_FORGE_TEXT_CONSTANT.BADGE)}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t(CARD_FORGE_TEXT_CONSTANT.TITLE)}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#F8F5F0]/70">
              {t(CARD_FORGE_TEXT_CONSTANT.SUBTITLE)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:min-w-[260px]">
            <div className="flex items-center justify-between text-xs text-[#F8F5F0]/70">
              <span>{t(CARD_FORGE_TEXT_CONSTANT.BALANCE_LABEL)}</span>
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Coins className="h-3.5 w-3.5" />
                {pricing ? pricing.balance.toLocaleString("id-ID") : "..."} NP
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#F8F5F0]/70">
              <span>{t(CARD_FORGE_TEXT_CONSTANT.COST_LABEL)}</span>
              <span className="font-bold text-emerald-400">
                {pricing
                  ? pricing.nextCost === 0
                    ? t(CARD_FORGE_TEXT_CONSTANT.COST_FREE)
                    : `${pricing.nextCost.toLocaleString("id-ID")} NP`
                  : "..."}
              </span>
            </div>
            <div className="mt-1 border-t border-white/10 pt-2 text-[11px] text-[#F8F5F0]/50">
              {pricing
                ? pricing.createdCount === 0
                  ? t(CARD_FORGE_TEXT_CONSTANT.TIER_HINT)
                  : t(CARD_FORGE_TEXT_CONSTANT.ACCOUNT_CARD_COUNT, {
                      count: pricing.createdCount + 1,
                    })
                : t(CARD_FORGE_TEXT_CONSTANT.LOADING_COST)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
