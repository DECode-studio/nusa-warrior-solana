"use client";

import React from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import Image from "next/image";
import { Music } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";

export interface InstrumentPreviewFlyerProps {
  instrument: CardEntity | null;
  targetName: string;
  actor: "PLAYER" | "BOT";
  synergyTriggered: boolean;
  opponentLabel?: string;
}

export function InstrumentPreviewFlyer({
  instrument,
  targetName,
  actor,
  synergyTriggered,
  opponentLabel,
}: InstrumentPreviewFlyerProps): React.ReactElement | null {
  const { t } = useTranslator();
  if (!instrument) return null;
  const displayedActor = actor === "PLAYER" ? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_PLAYER) : opponentLabel ?? t(BATTLE_TEXT_CONSTANT.LOG_ACTOR_BOT);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
    >
      <div className="nc-panel flex items-center gap-3 border border-primary/50 px-5 py-3 shadow-2xl">
        <div className="h-14 w-11 overflow-hidden rounded-lg border border-[var(--nc-border-strong)]">
          <Image
            src={instrument.imagePath}
            alt={instrument.name}
            width={176}
            height={224}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--nc-fg)]">
            <Music className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
            <span>
              {t(BATTLE_TEXT_CONSTANT.UI_PLAYING_INSTRUMENT, { actor: displayedActor })}
            </span>
          </div>
          <div className="text-xs text-[var(--nc-fg-muted)]">
            {t(BATTLE_TEXT_CONSTANT.UI_TARGET)} <strong className="text-[var(--nc-fg)]">{targetName}</strong>
          </div>
          {synergyTriggered && (
            <div className="nc-badge-amber mt-1">
              <span>{t(BATTLE_TEXT_CONSTANT.UI_AFFINITY_SYNERGY)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

