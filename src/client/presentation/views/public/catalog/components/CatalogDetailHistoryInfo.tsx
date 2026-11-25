"use client";

import React from "react";
import { BookOpen, CheckCircle2, ExternalLink } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import {
  formatKingdomLabel,
  formatRoleLabel,
  formatVerificationBadge,
} from "@/core/utils/formatters";
import { Badge } from "@/client/presentation/components/ui";
import { CATALOG_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CATALOG_TEXT_CONSTANT } from "../constants/TextConstant";

export interface CatalogDetailHistoryInfoProps {
  readonly card: CardEntity;
}

export function CatalogDetailHistoryInfo({
  card,
}: CatalogDetailHistoryInfoProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const summary =
    locale === "en"
      ? card.historicalSummaryEn
      : locale === "zh"
        ? card.historicalSummaryZh
        : card.historicalSummaryId;

  return (
    <div
      id={CATALOG_SEMANTIC_IDS.DETAIL_INFO_SECTION}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="amber" size="sm">
          {card.code}
        </Badge>
        <Badge variant="primary" size="sm">
          {formatKingdomLabel(card.kingdom)}
        </Badge>
        <Badge variant="emerald" size="sm">
          {formatRoleLabel(card.role)}
        </Badge>
        {card.secondaryRoles.map((sr) => (
          <Badge key={sr} variant="neutral" size="sm">
            +{formatRoleLabel(sr)}
          </Badge>
        ))}
      </div>

      <h1 className="nc-type-page-title font-display font-bold text-white">
        {card.name}
      </h1>

      <div
        id={CATALOG_SEMANTIC_IDS.DETAIL_VERIFICATION_STATUS}
        className="flex items-center gap-2 rounded-xl border border-[#0DB561]/35 bg-[#0DB561]/10 p-3.5 text-xs text-[#0DB561]"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {t(CATALOG_TEXT_CONSTANT.DETAIL_VERIFICATION_LABEL)}{" "}
          <strong className="text-white">
            {formatVerificationBadge(card.verificationStatus)}
          </strong>
        </span>
      </div>

      <div
        id={CATALOG_SEMANTIC_IDS.DETAIL_HISTORY_NOTES}
        className="space-y-2 rounded-xl border border-[#6766FF]/20 bg-[#0F0927] p-5"
      >
        <h2 className="flex items-center gap-1.5 font-display text-base font-bold text-[#FF9F31]">
          <BookOpen className="h-4 w-4 text-[#FF9F31]" aria-hidden="true" />
          <span>{t(CATALOG_TEXT_CONSTANT.DETAIL_HISTORY_TITLE)}</span>
        </h2>
        <p className="nc-type-body-sm text-[#F8F5F0]/85">{summary}</p>
        <p className="nc-type-caption border-t border-[#6766FF]/20 pt-2 italic text-[#F8F5F0]/60">
          {t(CATALOG_TEXT_CONSTANT.DETAIL_ILLUSTRATION_NOTE)} {card.illustrationNote}
        </p>
      </div>

      <div
        id={CATALOG_SEMANTIC_IDS.DETAIL_CITATION_BOX}
        className="nc-type-caption space-y-2 rounded-xl border border-white/10 bg-[#0F0927]/60 p-4 text-[#F8F5F0]/75"
      >
        <div>
          <strong className="text-white">
            {t(CATALOG_TEXT_CONSTANT.DETAIL_SOURCE_CITATION)}
          </strong>{" "}
          {card.sourceCitation}
        </div>
        {card.sourceUrl && (
          <div>
            <a
              id={CATALOG_SEMANTIC_IDS.DETAIL_SOURCE_LINK}
              href={card.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1 font-bold text-[#6766FF] underline"
            >
              <span>{t(CATALOG_TEXT_CONSTANT.DETAIL_OFFICIAL_LINK)}</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
        {card.asset && (
          <div className="nc-type-caption border-t border-white/10 pt-2">
            {t(CATALOG_TEXT_CONSTANT.DETAIL_CREATOR_LABEL)} {card.asset.creator} •{" "}
            {t(CATALOG_TEXT_CONSTANT.DETAIL_LICENSE_LABEL)} {card.asset.licenseType} •{" "}
            {t(CATALOG_TEXT_CONSTANT.DETAIL_STATUS_LABEL)} {card.asset.approvalStatus}
          </div>
        )}
      </div>
    </div>
  );
}

