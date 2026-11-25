"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import { CARD_FORGE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CardForgeSuccessBannerProps {
  readonly card: CardEntity;
  readonly onCreateAnother: () => void;
}

export function CardForgeSuccessBanner({
  card,
  onCreateAnother,
}: CardForgeSuccessBannerProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <div
      id={CARD_FORGE_SEMANTIC_IDS.SUCCESS_BANNER}
      className="mt-8 rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-8 text-center backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold text-white">
        {t(CARD_FORGE_TEXT_CONSTANT.SUCCESS_TITLE)}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-emerald-200/80">
        {t(CARD_FORGE_TEXT_CONSTANT.SUCCESS_CARD_SAVED, { name: card.name })}
      </p>

      <div className="mx-auto mt-6 max-w-xs overflow-hidden rounded-2xl border border-white/20 shadow-xl">
        <img
          src={card.imagePath}
          alt={card.name}
          className="h-auto w-full"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link
          id={CARD_FORGE_SEMANTIC_IDS.SUCCESS_DECK_BUILDER_BTN}
          href={ROUTES.USER_DECKS(locale)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6766FF] px-6 py-3 font-display text-sm font-semibold text-white shadow-lg shadow-[#6766FF]/30 transition hover:bg-[#5554e6]"
        >
          {t(CARD_FORGE_TEXT_CONSTANT.DECK_BUILDER_BTN)} <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          id={CARD_FORGE_SEMANTIC_IDS.SUCCESS_CREATE_ANOTHER_BTN}
          type="button"
          onClick={onCreateAnother}
          className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {t(CARD_FORGE_TEXT_CONSTANT.CREATE_ANOTHER_BTN)}
        </button>
      </div>
    </div>
  );
}
