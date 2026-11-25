"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { useTranslator } from "@/core/translator";
import { Badge, SectionHeading } from "@/client/presentation/components/ui";
import { CATALOG_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CATALOG_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CatalogHeaderBannerProps {
  readonly totalCardsCount: number;
}

export function CatalogHeaderBanner({
  totalCardsCount,
}: CatalogHeaderBannerProps): React.ReactElement {
  const { t } = useTranslator();

  return (
    <div
      id={CATALOG_SEMANTIC_IDS.HEADER_BANNER}
      className="relative isolate overflow-hidden rounded-[var(--radius-card)] border border-[#6766FF]/25 bg-gradient-to-br from-[#17123D] via-[#100A30] to-[#0B0622] px-5 py-7 shadow-[0_22px_60px_rgba(4,1,18,0.35)] sm:px-8 sm:py-9"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-32 -z-10 h-72 w-72 rounded-full bg-[#6766FF]/15 blur-[90px]"
        aria-hidden="true"
      />
      <div id={CATALOG_SEMANTIC_IDS.HEADER_BADGE}>
        <Badge
          variant="primary"
          size="md"
          icon={<BookOpen className="h-3.5 w-3.5 text-[#6766FF]" />}
        >
          {t(CATALOG_TEXT_CONSTANT.HEADER_BADGE)}
        </Badge>
      </div>

      <div id={CATALOG_SEMANTIC_IDS.HEADER_TITLE}>
        <SectionHeading
          as="h1"
          size="page"
          title={t(CATALOG_TEXT_CONSTANT.TITLE_KEY)}
          description={t(CATALOG_TEXT_CONSTANT.SUBTITLE_KEY)}
          descriptionSize="body"
          titleClassName="mt-4 max-w-3xl"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge
          id={CATALOG_SEMANTIC_IDS.HEADER_STATS_CURATED}
          variant="emerald"
          size="sm"
        >
          {totalCardsCount} {t(CATALOG_TEXT_CONSTANT.CURATED_CARDS_COUNT)}
        </Badge>
        <Badge
          id={CATALOG_SEMANTIC_IDS.HEADER_TAG_MAJAPAHIT}
          variant="neutral"
          size="sm"
        >
          {t(CATALOG_TEXT_CONSTANT.TAG_MAJAPAHIT)}
        </Badge>
        <Badge
          id={CATALOG_SEMANTIC_IDS.HEADER_TAG_PAJAJARAN}
          variant="neutral"
          size="sm"
        >
          {t(CATALOG_TEXT_CONSTANT.TAG_PAJAJARAN)}
        </Badge>
        <Badge
          id={CATALOG_SEMANTIC_IDS.HEADER_TAG_INSTRUMENTS}
          variant="neutral"
          size="sm"
        >
          {t(CATALOG_TEXT_CONSTANT.TAG_INSTRUMENTS)}
        </Badge>
      </div>
    </div>
  );
}

