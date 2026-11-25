"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { useTranslator } from "@/core/translator";
import { Button, EmptyState, Pagination } from "@/client/presentation/components/ui";
import { CATALOG_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { CATALOG_TEXT_CONSTANT } from "../constants/TextConstant";
import { CatalogCardItem } from "./CatalogCardItem";

export interface CatalogCardsPaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange?: (size: number) => void;
}

export interface CatalogCardsGridProps {
  readonly cards: readonly CardEntity[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly onResetFilters: () => void;
  readonly onInspectCard: (card: CardEntity) => void;
  readonly pagination?: CatalogCardsPaginationProps;
}

export function CatalogCardsGrid({
  cards,
  loading,
  error,
  onRetry,
  onResetFilters,
  onInspectCard,
  pagination,
}: CatalogCardsGridProps): React.ReactElement {
  const { t } = useTranslator();

  if (loading) {
    return (
      <div id={CATALOG_SEMANTIC_IDS.STATE_LOADING} className="mt-8">
        <EmptyState
          title={t("common.loading")}
          description={t(CATALOG_TEXT_CONSTANT.LOADING_DESC)}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div id={CATALOG_SEMANTIC_IDS.STATE_ERROR} className="mt-8">
        <EmptyState
          icon={<AlertCircle className="h-7 w-7 text-red-400" />}
          title={t(CATALOG_TEXT_CONSTANT.ERROR_TITLE)}
          description={error}
          action={
            <Button
              type="button"
              onClick={onRetry}
              variant="primary"
              size="sm"
            >
              {t(CATALOG_TEXT_CONSTANT.ERROR_RETRY)}
            </Button>
          }
        />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div id={CATALOG_SEMANTIC_IDS.STATE_EMPTY} className="mt-8">
        <EmptyState
          title={t(CATALOG_TEXT_CONSTANT.EMPTY_TITLE)}
          description={t(CATALOG_TEXT_CONSTANT.EMPTY_DESC)}
          action={
            <Button
              type="button"
              onClick={onResetFilters}
              variant="primary"
              size="sm"
            >
              {t(CATALOG_TEXT_CONSTANT.EMPTY_ACTION)}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        id={CATALOG_SEMANTIC_IDS.CARDS_GRID}
        className="catalog-defer-section mt-8 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {cards.map((card, idx) => (
          <CatalogCardItem
            key={card.slug}
            card={card}
            index={idx}
            onInspectCard={onInspectCard}
          />
        ))}
      </div>

      {pagination && pagination.totalItems > 0 && (
        <Pagination
          id={CATALOG_SEMANTIC_IDS.PAGINATION}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={[12, 24, 48]}
        />
      )}
    </div>
  );
}

