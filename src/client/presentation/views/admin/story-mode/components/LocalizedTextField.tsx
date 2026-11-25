"use client";

import React from "react";
import type { SupportedLocale } from "@/core/constants/routes";
import type { StoryTextTranslations } from "@/client/domain/story-mode/entity/story_mode_entity";

interface LocalizedTextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly translations?: StoryTextTranslations;
  readonly locale: SupportedLocale;
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly onChange: (value: string, translations: StoryTextTranslations) => void;
}

export function LocalizedTextField({ id, label, value, translations, locale, multiline = false, rows = 3, onChange }: LocalizedTextFieldProps): React.ReactElement {
  const currentValue = locale === "id" ? value : translations?.[locale] ?? "";
  const update = (nextValue: string): void => {
    onChange(
      locale === "id" ? nextValue : value,
      { ...translations, [locale]: nextValue },
    );
  };
  const fieldClassName = "w-full rounded-xl border border-primary/25 bg-surface-elevated px-3 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-cream">{label}<span className="ml-2 font-normal uppercase text-subtle">{locale}</span></label>
      {multiline ? (
        <textarea id={id} value={currentValue} rows={rows} onChange={(event) => update(event.currentTarget.value)} className={`${fieldClassName} resize-y leading-relaxed`} />
      ) : (
        <input id={id} value={currentValue} onChange={(event) => update(event.currentTarget.value)} className={fieldClassName} />
      )}
    </div>
  );
}
