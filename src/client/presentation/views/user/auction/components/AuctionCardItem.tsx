"use client";

import React, { useEffect, useState } from "react";
import { Clock, Gavel, Lock, Shield, Swords } from "lucide-react";
import type { AuctionListingEntity } from "@/client/domain/auction/entity/auction_entity";
import type { AuctionCopy } from "../constants/TextConstant";

export function formatCountdown(endsAtIso: string, nowMs: number): {
  label: string;
  isEnded: boolean;
  isUrgent: boolean;
  isCritical: boolean;
} {
  const diffSec = Math.floor((Date.parse(endsAtIso) - nowMs) / 1000);
  if (diffSec <= 0) {
    return { label: "00:00:00", isEnded: true, isUrgent: false, isCritical: false };
  }
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return {
    label: `${pad(hours)}:${pad(mins)}:${pad(secs)}`,
    isEnded: false,
    isUrgent: diffSec <= 3600,
    isCritical: diffSec <= 300,
  };
}

export interface AuctionCardItemProps {
  readonly auction: AuctionListingEntity;
  readonly copy: AuctionCopy;
  readonly onSelect: (auctionId: string) => void;
}

export function AuctionCardItem({
  auction,
  copy,
  onSelect,
}: AuctionCardItemProps): React.ReactElement {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (auction.status !== "ACTIVE") return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [auction.status]);

  const countdown = formatCountdown(auction.endsAt, nowMs);
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
            {copy.sellerLabel}: {auction.sellerName}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-3">
          <div>
            <p className="text-xs text-subtle">
              {auction.bidCount > 0 ? copy.currentBidLabel : copy.startingPriceLabel}
            </p>
            <p className="font-display text-lg font-bold text-amber">
              {displayPrice.toLocaleString()} NUSA
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-subtle">{copy.bidsCountLabel}</p>
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
                ? copy.frozenRefundReadyBadge
                : auction.highestBidderId &&
                    !auction.canBid &&
                    auction.status === "ACTIVE"
                  ? copy.frozenHighestBadge
                  : copy.frozenOutbidBadge}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onSelect(auction.id)}
          className="nc-btn-primary mt-4 w-full"
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          {auction.canBid ? `${copy.placeBid} (${auction.minNextBid.toLocaleString()} NUSA)` : copy.viewDetail}
        </button>
      </div>
    </article>
  );
}
