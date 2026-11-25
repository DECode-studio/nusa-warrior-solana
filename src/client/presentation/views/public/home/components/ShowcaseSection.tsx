"use client";

import React from "react";
import Image from "next/image";
import { BookOpen, ArrowRight, AlertCircle, RotateCcw } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { APP_ROUTES } from "@/core/constants/routes";
import { useTranslator } from "@/core/translator";
import {
  formatKingdomLabel,
  formatRoleLabel,
} from "@/core/utils/formatters";
import {
  IntellioCard,
  Badge,
  Button,
  EmptyState,
  PublicContainer,
} from "@/client/presentation/components/ui";
import { HOME_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { HOME_TEXT_CONSTANT } from "../constants/TextConstant";

export interface ShowcaseSectionProps {
  readonly featuredCards: readonly CardEntity[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onInspectCard: (card: CardEntity) => void;
  readonly onRetry: () => void;
}

export function ShowcaseSection({
  featuredCards,
  loading,
  error,
  onInspectCard,
  onRetry,
}: ShowcaseSectionProps): React.ReactElement {
  const { locale, t } = useTranslator();

  return (
    <section
      id={HOME_SEMANTIC_IDS.SHOWCASE_SECTION}
      className="heavy-section-deferred nc-public-section !pt-0"
    >
      {/* Header Bar */}
      <PublicContainer
        size="wide"
        className="flex flex-col items-start justify-between gap-4 border-b border-[#6766FF]/20 pb-5 sm:flex-row sm:items-end"
      >
        <div>
          <Badge variant="primary" size="sm">
            {t(HOME_TEXT_CONSTANT.SHOWCASE_BADGE)}
          </Badge>
          <h2
            id={HOME_SEMANTIC_IDS.SHOWCASE_HEADING}
            className="nc-type-section-title mt-3 font-display font-bold text-white"
          >
            {t(HOME_TEXT_CONSTANT.SHOWCASE_TITLE)}
          </h2>
          <p className="nc-type-body-sm mt-2 text-[#CFCBE2]">
            {t(HOME_TEXT_CONSTANT.SHOWCASE_SUBTITLE)}
          </p>
        </div>

        <Button
          id={HOME_SEMANTIC_IDS.SHOWCASE_VIEW_ALL_BTN}
          href={APP_ROUTES.CATALOG(locale)}
          variant="secondary"
          size="sm"
          leftIcon={<BookOpen className="h-3.5 w-3.5 text-[#6766FF]" />}
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          {t(HOME_TEXT_CONSTANT.SHOWCASE_VIEW_ALL)}
        </Button>
      </PublicContainer>

      {/* Content Area */}
      {loading ? (
        <PublicContainer size="wide" className="mt-6">
          <EmptyState
            title={t("common.loading")}
            description={t(HOME_TEXT_CONSTANT.SHOWCASE_LOADING)}
          />
        </PublicContainer>
      ) : error ? (
        <PublicContainer size="wide" className="mt-6">
          <EmptyState
            icon={<AlertCircle className="h-6 w-6 text-[#FF9F31]" />}
            title={t(HOME_TEXT_CONSTANT.SHOWCASE_ERROR_TITLE)}
            description={error}
            action={
              <Button
                onClick={onRetry}
                variant="amber"
                size="sm"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                {t(HOME_TEXT_CONSTANT.SHOWCASE_RETRY)}
              </Button>
            }
          />
        </PublicContainer>
      ) : (
        <PublicContainer size="wide" className="mt-6">
          <div
            id={HOME_SEMANTIC_IDS.FEATURED_GRID}
            className="grid grid-cols-2 place-items-center gap-3 sm:grid-cols-4 sm:gap-4"
          >
            {featuredCards.map((card) => (
              <IntellioCard
                key={card.slug}
                id={`${HOME_SEMANTIC_IDS.FEATURED_CARD_PREFIX}${card.slug}`}
                variant="interactive"
                padding="xs"
                onClick={() => onInspectCard(card)}
                className="flex w-full flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-[#6766FF] focus-visible:outline-offset-2"
              >
                <Image
                  src={card.imagePath}
                  alt={`${card.name} (${formatKingdomLabel(card.kingdom)})`}
                  width={288}
                  height={384}
                  unoptimized
                  className="aspect-[3/4] w-32 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)] sm:w-36"
                />
                <div className="mt-2 w-full truncate font-display text-sm font-bold text-white sm:text-base">
                  {card.name}
                </div>
                <div className="nc-type-caption flex items-center gap-1 pt-1 text-[#A8A7FF]">
                  <span>{formatKingdomLabel(card.kingdom)}</span>
                  <span>•</span>
                  <span>{formatRoleLabel(card.role)}</span>
                </div>
              </IntellioCard>
            ))}
          </div>
        </PublicContainer>
      )}
    </section>
  );
}

