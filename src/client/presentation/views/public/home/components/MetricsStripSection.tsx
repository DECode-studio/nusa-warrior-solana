"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { PublicContainer } from "@/client/presentation/components/ui";
import { HOME_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { HOME_TEXT_CONSTANT } from "../constants/TextConstant";

export interface MetricsStripSectionProps {
  readonly totalCardsCount: number;
}

export function MetricsStripSection({
  totalCardsCount,
}: MetricsStripSectionProps): React.ReactElement {
  const { t } = useTranslator();
  const metrics = [
    {
      id: HOME_SEMANTIC_IDS.METRIC_CARDS,
      value: totalCardsCount > 0 ? totalCardsCount : t(HOME_TEXT_CONSTANT.METRICS_CARD_VAL),
      title: t(HOME_TEXT_CONSTANT.METRICS_CARD_TITLE),
      description: t(HOME_TEXT_CONSTANT.METRICS_CARD_SUB),
      color: "text-[#A8A7FF]",
    },
    {
      id: HOME_SEMANTIC_IDS.METRIC_FORMATION,
      value: t(HOME_TEXT_CONSTANT.METRICS_FORMATION_VAL),
      title: t(HOME_TEXT_CONSTANT.METRICS_FORMATION_TITLE),
      description: t(HOME_TEXT_CONSTANT.METRICS_FORMATION_SUB),
      color: "text-[#FFBD70]",
    },
    {
      id: HOME_SEMANTIC_IDS.METRIC_FAIRPLAY,
      value: t(HOME_TEXT_CONSTANT.METRICS_FAIRPLAY_VAL),
      title: t(HOME_TEXT_CONSTANT.METRICS_FAIRPLAY_TITLE),
      description: t(HOME_TEXT_CONSTANT.METRICS_FAIRPLAY_SUB),
      color: "text-[#46D995]",
    },
    {
      id: HOME_SEMANTIC_IDS.METRIC_LANGUAGES,
      value: t(HOME_TEXT_CONSTANT.METRICS_LANG_VAL),
      title: t(HOME_TEXT_CONSTANT.METRICS_LANG_TITLE),
      description: t(HOME_TEXT_CONSTANT.METRICS_LANG_SUB),
      color: "text-[#8B89FF]",
    },
  ] as const;

  return (
    <section
      id={HOME_SEMANTIC_IDS.METRICS_SECTION}
      className="relative border-y border-white/[0.07] bg-[#0A0520]/90 py-7 sm:py-8"
    >
      <PublicContainer size="wide">
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-white/[0.025] px-2 sm:grid-cols-4 sm:divide-y-0 sm:px-3">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              id={metric.id}
              className="flex min-h-28 flex-col items-center justify-center px-2 py-4 text-center sm:min-h-32 sm:px-4"
            >
              <div className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${metric.color}`}>
                {metric.value}
              </div>
              <div className="mt-1 font-display text-sm font-bold text-white sm:text-base">
                {metric.title}
              </div>
              <div className="nc-type-caption mt-1 text-[#CFCBE2]/75">
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </PublicContainer>
    </section>
  );
}

