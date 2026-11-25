import React from "react";
import { AppNavbar } from "@/client/presentation/components/AppNavbar";
import { CardAssetProtection } from "@/client/presentation/components/CardAssetProtection";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
} from "@/core/constants/routes";
import { TranslatorProvider } from "@/core/translator";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps): Promise<React.ReactElement> {
  const { lang } = await params;
  const resolvedLocale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;

  return (
    <TranslatorProvider initialLocale={resolvedLocale}>
      <CardAssetProtection />
      <AppNavbar />
      {children}
    </TranslatorProvider>
  );
}

