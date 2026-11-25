"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, ShieldCheck, Gift } from "lucide-react";
import type { StarterPackEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency, formatKingdomLabel } from "@/core/utils/formatters";
import { Badge, IntellioCard } from "@/client/presentation/components/ui";
import { SHOP_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";

export interface ShopPackCardProps {
  readonly pack: StarterPackEntity;
  readonly isSelected: boolean;
  readonly onSelect: (pack: StarterPackEntity) => void;
}

export function ShopPackCard({
  pack,
  isSelected,
  onSelect,
}: ShopPackCardProps): React.ReactElement {
  const { locale, t } = useTranslator();

  const packTitle =
    locale === "en" ? pack.nameEn : locale === "zh" ? pack.nameZh : pack.nameId;
  const packDesc =
    locale === "en"
      ? pack.descriptionEn
      : locale === "zh"
        ? pack.descriptionZh
        : pack.descriptionId;

  const isBooster = pack.packType === "BOOSTER" || pack.code.includes("BOOSTER");
  const isStarter = pack.isStarter || pack.code.includes("STARTER");
  const isFree = Boolean(pack.isFree);

  return (
    <IntellioCard
      id={`${SHOP_SEMANTIC_IDS.PACK_CARD_PREFIX}${pack.code.toLowerCase()}`}
      onClick={() => onSelect(pack)}
      ariaPressed={isSelected}
      variant="interactive"
      padding="sm"
      className={`w-full text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border-base bg-surface-elevated/40 hover:border-border-strong"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Pack Cover Art */}
        {pack.imagePath && (
          <div className="relative h-44 w-28 flex-shrink-0 self-center sm:self-start">
            <Image
              src={pack.imagePath}
              alt={packTitle}
              fill
              sizes="(max-width: 640px) 112px, 120px"
              className="object-contain object-center transition-transform duration-300 hover:scale-105"
            />
            {isFree && (
              <div className="absolute inset-x-1 -bottom-1 rounded-md bg-emerald py-0.5 text-center text-[11px] font-bold text-surface-base">
                Gratis
              </div>
            )}
          </div>
        )}

        {/* Pack Information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isFree ? (
              <Badge
                variant="emerald"
                size="sm"
                icon={<Gift className="h-3 w-3" />}
              >
                GRATIS KLAIM AWAL
              </Badge>
            ) : isBooster ? (
              <Badge
                variant="amber"
                size="sm"
                icon={<Sparkles className="h-3 w-3" />}
              >
                5 Kartu · Garansi 1 High-End
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                20 Kartu Low-End
              </Badge>
            )}

            <Badge variant="emerald" size="sm">
              {formatKingdomLabel(pack.kingdomTheme)}
            </Badge>

            {isSelected && (
              <Badge variant="primary" size="sm">
                Dipilih
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-cream">
              {packTitle}
            </h3>

            <div className="text-right">
              {isFree ? (
                <div>
                  <div className="font-display text-xl font-bold text-emerald-light">
                    GRATIS
                  </div>
                  <div className="text-[11px] text-subtle line-through">
                    {formatIdrCurrency(20000)}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-display text-xl font-bold text-amber-light">
                    {formatIdrCurrency(pack.priceIdr)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="nc-type-body-sm mt-1 text-muted">{packDesc}</p>

          <div className="mt-4 border-t border-border-base pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-light">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isBooster
                  ? "Pool Kartu (Garansi 1 High-End + 4 Acak):"
                  : t(SHOP_TEXT_CONSTANT.CONTENTS_TRANSPARENT_KEY) + ":"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pack.cardSlugs.slice(0, isBooster ? 10 : 20).map((slug) => (
                <span
                  key={slug}
                  className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] text-cream"
                >
                  {slug}
                </span>
              ))}
              {pack.cardSlugs.length > 10 && isBooster && (
                <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] text-primary-light">
                  +{pack.cardSlugs.length - 10} kartu lainnya
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </IntellioCard>
  );
}
