"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { APP_ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  formatKingdomLabel,
  formatRoleLabel,
} from "@/core/utils/formatters";
import {
  Badge,
  Button,
  IntellioCard,
} from "@/client/presentation/components/ui";
import { CATALOG_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CATALOG_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CatalogCardItemProps {
  readonly card: CardEntity;
  readonly index: number;
  readonly onInspectCard: (card: CardEntity) => void;
}

export function CatalogCardItem({
  card,
  index,
  onInspectCard,
}: CatalogCardItemProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const summary =
    locale === "en"
      ? card.historicalSummaryEn
      : locale === "zh"
        ? card.historicalSummaryZh
        : card.historicalSummaryId;

  return (
    <IntellioCard
      id={`${CATALOG_SEMANTIC_IDS.CARD_ITEM_PREFIX}${card.slug}`}
      as="article"
      variant="flat"
      padding="sm"
      className="group flex h-full min-w-0 items-stretch gap-3 transition-colors hover:bg-[var(--nc-surface-elevated)] sm:gap-4"
    >
      <div className="w-32 shrink-0 self-start sm:w-36">
        <Image
          src={card.imagePath}
          alt={`${card.name} (${formatKingdomLabel(card.kingdom)})`}
          width={288}
          height={384}
          className="aspect-[3/4] h-auto w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
          priority={index < 4}
          unoptimized
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col text-xs">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 overflow-hidden">
            <Badge variant="amber" size="sm" className="max-w-full min-w-0">
              {card.code}
            </Badge>
            <Badge variant="primary" size="sm" className="max-w-full min-w-0">
              {formatRoleLabel(card.role)}
            </Badge>
            {card.secondaryRoles.map((sr) => (
              <Badge
                key={sr}
                variant="emerald"
                size="sm"
                className="max-w-full min-w-0"
              >
                +{formatRoleLabel(sr)}
              </Badge>
            ))}
          </div>

          <h2 className="mt-2 line-clamp-2 min-h-[3.5rem] break-words font-display text-lg font-bold leading-7 text-white">
            {card.name}
          </h2>

          <p className="mt-1 line-clamp-3 min-h-[4.5rem] break-words leading-6 text-[#F8F5F0]/75">
            {summary}
          </p>
        </div>

        <div className="mt-auto min-w-0 border-t border-[#6766FF]/20 pt-2.5">
          <div
            className="nc-type-caption min-w-0 truncate text-[#F8F5F0]/70"
            title={card.sourceCitation}
          >
            <strong className="text-white">
              {t(CATALOG_TEXT_CONSTANT.CARD_CITATION_LABEL)}
            </strong>{" "}
            <span>{card.sourceCitation}</span>
          </div>
          <div className="mt-2 flex flex-col items-stretch gap-1.5">
            <Button
              id={`${CATALOG_SEMANTIC_IDS.CARD_INSPECT_BTN_PREFIX}${card.slug}`}
              type="button"
              onClick={() => onInspectCard(card)}
              variant="secondary"
              size="xs"
              className="w-full"
            >
              {t(CATALOG_TEXT_CONSTANT.CARD_INSPECT_BTN)}
            </Button>

            <Link
              id={`${CATALOG_SEMANTIC_IDS.CARD_DETAIL_LINK_PREFIX}${card.slug}`}
              href={APP_ROUTES.CATALOG_DETAIL(locale, card.slug)}
              className="inline-flex min-h-9 max-w-full items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold text-[#A8A7FF] transition-colors hover:bg-[#6766FF]/10 hover:underline"
            >
              <span>{t(CATALOG_TEXT_CONSTANT.CARD_DETAIL_LINK)}</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </IntellioCard>
  );
}

