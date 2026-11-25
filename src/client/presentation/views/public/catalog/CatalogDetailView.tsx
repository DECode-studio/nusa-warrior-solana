"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { APP_ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { CARD_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";
import { PublicPageLayout } from "@/client/presentation/components/layout/PublicPageLayout";
import {
  Button,
  EmptyState,
  IntellioCard,
  PublicContainer,
} from "@/client/presentation/components/ui";
import {
  CatalogDetailCardPreview,
  CatalogDetailHistoryInfo,
} from "./components";
import { CATALOG_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { CATALOG_TEXT_CONSTANT } from "./constants/TextConstant";

export interface CatalogDetailViewProps {
  readonly slug: string;
}

export function CatalogDetailView({
  slug,
}: CatalogDetailViewProps): React.ReactElement {
  const { locale, t } = useTranslator();
  const [card, setCard] = useState<CardEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const loadCard = async (): Promise<void> => {
      try {
        const cardUseCase = getService(CARD_USECASE_TOKEN);
        const detail = await cardUseCase.getCardBySlug(slug);
        if (active) {
          setCard(detail);
        }
      } catch {
        setCard(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadCard();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <PublicPageLayout locale={locale}>
        <main className="nc-page nc-public-main flex items-center justify-center">
          <PublicContainer size="narrow">
            <EmptyState
              title={t("common.loading")}
              description={t(CATALOG_TEXT_CONSTANT.DETAIL_LOADING_DESC)}
            />
          </PublicContainer>
        </main>
      </PublicPageLayout>
    );
  }

  if (!card) {
    return (
      <PublicPageLayout locale={locale}>
        <main className="nc-page nc-public-main flex items-center justify-center">
          <PublicContainer size="narrow">
            <EmptyState
              title={t(CATALOG_TEXT_CONSTANT.DETAIL_NOT_FOUND_TITLE)}
              description={t(CATALOG_TEXT_CONSTANT.DETAIL_NOT_FOUND_DESC)}
              action={
                <Button
                  href={APP_ROUTES.CATALOG(locale)}
                  variant="primary"
                  size="md"
                >
                  {t(CATALOG_TEXT_CONSTANT.DETAIL_NOT_FOUND_BACK)}
                </Button>
              }
            />
          </PublicContainer>
        </main>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout locale={locale}>
      <main
        id={CATALOG_SEMANTIC_IDS.DETAIL_ROOT}
        className="nc-page nc-public-main"
      >
        <PublicContainer size="narrow">
          <Button
            id={CATALOG_SEMANTIC_IDS.DETAIL_BACK_BTN}
            href={APP_ROUTES.CATALOG(locale)}
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {t(CATALOG_TEXT_CONSTANT.DETAIL_BACK_BTN)}
          </Button>

          <IntellioCard
            variant="default"
            padding="md"
            className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12"
          >
            {/* Left Column: Card Image & Stats */}
            <CatalogDetailCardPreview card={card} />

            {/* Right Column: Historical Context */}
            <div className="space-y-6 md:col-span-7">
              <CatalogDetailHistoryInfo card={card} />
            </div>
          </IntellioCard>
        </PublicContainer>
      </main>
    </PublicPageLayout>
  );
}
