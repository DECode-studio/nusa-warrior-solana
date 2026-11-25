import React from "react";

const STAT_MODIFIER_PATTERN =
  /([+＋−-]\s*\d+\s*(?:Attack|ATK|Defence|Defense|DEF|攻击力?|防御力?)(?:\s*\/\s*(?:Attack|ATK|Defence|Defense|DEF|攻击力?|防御力?))?)/giu;

export function InstrumentEffectDescription({
  text,
}: {
  readonly text: string;
}): React.ReactElement {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(STAT_MODIFIER_PATTERN)) {
    const modifier = match[0];
    const start = match.index ?? cursor;
    if (start > cursor) parts.push(text.slice(cursor, start));

    const isPenalty = /^[−-]/u.test(modifier.trimStart());
    parts.push(
      <strong
        key={`modifier-${matchIndex}`}
        className={isPenalty ? "font-bold text-rose-400" : "font-bold text-emerald-400"}
      >
        {modifier}
      </strong>
    );
    cursor = start + modifier.length;
    matchIndex += 1;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}
