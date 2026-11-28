"use client";

import React from "react";
import { Lock, RotateCcw } from "lucide-react";
import type { FrozenAuctionItemEntity } from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import type { AuctionCopy } from "../constants/TextConstant";

export interface AuctionFrozenBannerProps {
  readonly frozenTotal: number;
  readonly items: readonly FrozenAuctionItemEntity[];
  readonly copy: AuctionCopy;
  readonly onOpenAuction: (auctionId: string) => void;
}

export function AuctionFrozenBanner({
  frozenTotal,
  items,
  copy,
  onOpenAuction,
}: AuctionFrozenBannerProps): React.ReactElement | null {
  if (frozenTotal <= 0 && items.length === 0) {
    return null;
  }

  return (
    <section
      id={AUCTION_SEMANTIC_IDS.frozenBanner}
      aria-label={copy.frozenBannerTitle}
      className="nc-panel border-amber/40 bg-surface-elevated p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber-light">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-cream">
              {copy.frozenBannerTitle}:{" "}
              <span className="text-amber">{frozenTotal.toLocaleString()} NUSA</span>
            </h2>
            <p className="mt-1 text-sm text-muted">
              {copy.frozenBannerDescription}
            </p>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.auctionId}
              type="button"
              onClick={() => onOpenAuction(item.auctionId)}
              className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-fg">
                  {item.cardName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-amber-light">
                    {item.heldAmount.toLocaleString()} NUSA
                  </span>
                  {item.refundPending ? (
                    <span className="nc-badge-emerald">
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      {copy.frozenRefundReadyBadge}
                    </span>
                  ) : item.isHighestBidder ? (
                    <span className="nc-badge-primary">
                      {copy.frozenHighestBadge}
                    </span>
                  ) : (
                    <span className="nc-badge-amber">
                      {copy.frozenOutbidBadge}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
