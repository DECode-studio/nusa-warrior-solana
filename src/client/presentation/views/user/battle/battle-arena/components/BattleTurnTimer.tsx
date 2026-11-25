"use client";

import React, { useEffect, useState } from "react";
import { BATTLE_TEXT_CONSTANT } from "../constants/TextConstant";
import { Timer } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { BATTLE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";

export interface BattleTurnTimerProps {
  readonly deadlineAt: string | null;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function BattleTurnTimer({
  deadlineAt,
}: BattleTurnTimerProps): React.ReactElement {
  const { t } = useTranslator();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const deadline = deadlineAt ? Date.parse(deadlineAt) : Number.NaN;
  const remainingSeconds = Number.isFinite(deadline)
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : null;
  const isUrgent = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div
      id={BATTLE_SEMANTIC_IDS.TURN_INDICATOR}
      role="timer"
      aria-label={
        remainingSeconds === null
          ? t(BATTLE_TEXT_CONSTANT.UI_TURN_TIMER_UNAVAILABLE)
          : t(BATTLE_TEXT_CONSTANT.UI_TURN_TIME_LEFT, { time: formatTime(remainingSeconds) })
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs font-bold tabular-nums ${
        isUrgent
          ? "border-danger/30 bg-danger/10 text-danger-light"
          : "border-amber/30 bg-surface-base text-amber-light"
      }`}
    >
      <Timer className={`h-3.5 w-3.5 ${isUrgent ? "text-danger-light" : "text-amber-light"}`} aria-hidden="true" />
      <span className="hidden sm:inline">{t(BATTLE_TEXT_CONSTANT.UI_TIMER_SHORT)}</span>
      <span>{remainingSeconds === null ? "--:--" : formatTime(remainingSeconds)}</span>
    </div>
  );
}
