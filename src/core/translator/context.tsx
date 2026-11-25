"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/core/constants/routes";
import { translator } from "./translator";

export interface TranslatorContextValue {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  t: (key: string, values?: TranslationValues) => string;
}

export type TranslationValues = Record<string, string | number>;

const TranslatorContext = createContext<TranslatorContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string, values?: TranslationValues) =>
    translator.t(key, DEFAULT_LOCALE, values),
});

export function TranslatorProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: SupportedLocale;
  children: React.ReactNode;
}): React.ReactElement {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: SupportedLocale): void => {
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: string, values?: TranslationValues): string =>
      translator.t(key, locale, values),
    [locale]
  );

  return React.createElement(
    TranslatorContext.Provider,
    { value: { locale, setLocale, t } },
    children
  );
}

export function useTranslator(): TranslatorContextValue {
  return useContext(TranslatorContext);
}

