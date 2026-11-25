import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  isValidLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/core/constants/routes";
import { DICTIONARIES, translator } from "./translator";
import {
  TranslatorProvider,
  useTranslator,
  type TranslatorContextValue,
} from "./context";

export type { SupportedLocale, TranslatorContextValue };
export {
  DEFAULT_LOCALE,
  DICTIONARIES,
  isSupportedLocale,
  isValidLocale,
  SUPPORTED_LOCALES,
  translator,
  TranslatorProvider,
  useTranslator,
};
