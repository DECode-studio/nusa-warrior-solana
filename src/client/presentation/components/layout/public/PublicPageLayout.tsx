import React from "react";
import type { SupportedLocale } from "@/core/constants/routes";
import { IntellioFooter } from "./IntellioFooter";

export interface PublicPageLayoutProps {
  readonly children: React.ReactNode;
  readonly locale?: SupportedLocale;
  readonly showFooter?: boolean;
}

export function PublicPageLayout({
  children,
  locale,
  showFooter = true,
}: PublicPageLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-[var(--nc-bg)] text-[var(--nc-fg)]">
      {children}
      {showFooter ? <IntellioFooter locale={locale} /> : null}
    </div>
  );
}
