"use client";

import React from "react";
import { Receipt } from "lucide-react";
import type { PaymentOrderEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency } from "@/core/utils/formatters";
import { Badge, IntellioCard } from "@/client/presentation/components/ui";
import { SHOP_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { SHOP_TEXT_CONSTANT } from "../constants/TextConstant";

export interface ShopRecentOrdersSectionProps {
  readonly orders: readonly PaymentOrderEntity[];
}

export function ShopRecentOrdersSection({
  orders,
}: ShopRecentOrdersSectionProps): React.ReactElement {
  const { t } = useTranslator();

  if (orders.length === 0) return <></>;

  return (
    <section
      id={SHOP_SEMANTIC_IDS.RECENT_ORDERS_SECTION}
      className="space-y-3"
    >
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-cream">
        <Receipt className="h-4 w-4 text-primary-light" aria-hidden="true" />
        <span>{t(SHOP_TEXT_CONSTANT.RECENT_ORDERS_TITLE)}</span>
      </h3>

      <div className="space-y-2">
        {orders.map((ord) => (
          <IntellioCard
            key={ord.id}
            id={`${SHOP_SEMANTIC_IDS.ORDER_ITEM_PREFIX}${ord.id}`}
            variant="flat"
            padding="xs"
            className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs"
          >
            <div>
              <span className="font-mono text-muted">{ord.orderNumber}</span>
              <span className="mx-2 text-subtle">•</span>
              <span className="font-bold text-cream">{ord.starterPackCode}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-amber-light">
                {ord.amountIdr === 0
                  ? ord.paymentProvider === "NUSA_POINTS" ? "LUNAS DENGAN POIN" : "GRATIS"
                  : formatIdrCurrency(ord.amountIdr)}
              </span>
              <Badge
                variant={ord.paymentStatus === "PAID" ? "emerald" : ord.paymentStatus === "PENDING" ? "amber" : ord.paymentStatus === "FAILED" ? "danger" : "neutral"}
                size="sm"
              >
                {ord.paymentStatus}
              </Badge>
            </div>
          </IntellioCard>
        ))}
      </div>
    </section>
  );
}

