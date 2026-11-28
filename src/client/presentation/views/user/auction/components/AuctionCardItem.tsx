"use client";

import React from "react";
import { Clock, Gavel, Lock, Shield, Swords } from "lucide-react";
import { useTranslator } from "@/core/translator";
import type { AuctionListingEntity } from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_TEXT_CONSTANT } from "../constants/TextConstant";
import type { AuctionCountdownState } from "../hooks/useAuction";

export interface AuctionCardItemProps {
  readonly auction: AuctionListingEntity;
  readonly countdown: AuctionCountdownState;
  readonly onSelect: (auctionId: string) => void;
}

export function AuctionCardItem({
  auction,
  countdown,
  onSelect,
}: AuctionCardItemProps): React.ReactElement {
  const { t } = useTranslator();
  const displayPrice =
    auction.bidCount > 0 ? auction.currentHighestBid : auction.startingPrice;

  return (
    <article className="intellio-card flex flex-col overflow-hidden p-4">
      <div className="relative mb-3 flex items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-surface-base p-3">
        <img
          src={auction.card.imagePath}
          alt={auction.card.name}
          className="h-44 w-auto object-contain"
          loading="lazy"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className="nc-badge-primary">{auction.card.kingdom}</span>
          {auction.card.isCustom || auction.card.isRareEdition ? (
            <span className="inline-flex items-center rounded-md bg-cyan/15 px-2 py-0.5 text-xs font-semibold text-cyan">
              NFT
            </span>
          ) : null}
        </div>
        <div className="absolute right-2.5 top-2.5">
          {auction.status === "ACTIVE" && !countdown.isEnded ? (
            <span
              className={
                countdown.isCritical
                  ? "inline-flex items-center gap-1 rounded-md bg-danger/20 px-2 py-1 font-display text-xs font-bold text-danger-light"
                  : countdown.isUrgent
                    ? "nc-badge-amber font-display font-bold"
                    : "nc-badge-emerald font-display font-bold"
              }
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {countdown.label}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-1 font-display text-xs font-bold text-muted">
              {auction.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="truncate font-display text-lg font-bold text-fg">
          {auction.card.name}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-subtle">
          <span className="inline-flex items-center gap-1">
            <Swords className="h-3.5 w-3.5 text-amber-light" aria-hidden="true" />
            {auction.card.baseAttack}
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
            {auction.card.baseDefense}
          </span>
          <span className="truncate">
            {t(AUCTION_TEXT_CONSTANT.SELLER_LABEL)}: {auction.sellerName}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-3">
          <div>
            <p className="text-xs text-subtle">
              {auction.bidCount > 0
                ? t(AUCTION_TEXT_CONSTANT.CURRENT_BID_LABEL)
                : t(AUCTION_TEXT_CONSTANT.STARTING_PRICE_LABEL)}
            </p>
            <p className="font-display text-lg font-bold text-amber">
              {displayPrice.toLocaleString()} NUSA
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-subtle">
              {t(AUCTION_TEXT_CONSTANT.BIDS_COUNT_LABEL)}
            </p>
            <p className="font-display text-lg font-bold text-fg">
              {auction.bidCount}
            </p>
          </div>
        </div>

        {auction.myHeldAmount > 0 && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-amber/10 px-3 py-1.5 text-xs text-amber-light">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {auction.myHeldAmount.toLocaleString()} NUSA
            </span>
            <span>
              {auction.myRefundPending
                ? t(AUCTION_TEXT_CONSTANT.FROZEN_REFUND_READY_BADGE)
                : auction.highestBidderId &&
                    !auction.canBid &&
                    auction.status === "ACTIVE"
                  ? t(AUCTION_TEXT_CONSTANT.FROZEN_HIGHEST_BADGE)
                  : t(AUCTION_TEXT_CONSTANT.FROZEN_OUTBID_BADGE)}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onSelect(auction.id)}
          className="nc-btn-primary mt-4 w-full"
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          {auction.canBid
            ? `${t(AUCTION_TEXT_CONSTANT.PLACE_BID)} (${auction.minNextBid.toLocaleString()} NUSA)`
            : t(AUCTION_TEXT_CONSTANT.VIEW_DETAIL)}
        </button>
      </div>
    </article>
  );
}
