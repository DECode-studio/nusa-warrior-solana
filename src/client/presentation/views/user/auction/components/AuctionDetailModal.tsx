"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Gavel,
  Lock,
  Pencil,
  RotateCcw,
  Shield,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import { ROUTES, type SupportedLocale } from "@/core/constants/routes";
import type { AuctionDetailEntity } from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import type { AuctionCopy } from "../constants/TextConstant";
import { formatCountdown } from "./AuctionCardItem";

export interface AuctionDetailModalProps {
  readonly detail: AuctionDetailEntity;
  readonly locale: SupportedLocale;
  readonly copy: AuctionCopy;
  readonly walletNusaBalance: number;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onPlaceBid: (auctionId: string, amount: number) => Promise<boolean>;
  readonly onOpenEdit: (detail: AuctionDetailEntity) => void;
  readonly onCancelAuction: (auctionId: string) => Promise<boolean>;
  readonly onSettleAuction: (auctionId: string) => Promise<boolean>;
  readonly onClaimRefund: (auctionId: string) => Promise<boolean>;
}

const BID_STEPS = [0, 50, 100, 250] as const;

export function AuctionDetailModal({
  detail,
  locale,
  copy,
  walletNusaBalance,
  isSubmitting,
  onClose,
  onPlaceBid,
  onOpenEdit,
  onCancelAuction,
  onSettleAuction,
  onClaimRefund,
}: AuctionDetailModalProps): React.ReactElement {
  const [bidAmountStr, setBidAmountStr] = useState<string>(
    String(detail.minNextBid)
  );
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    setBidAmountStr(String(detail.minNextBid));
  }, [detail.minNextBid]);

  useEffect(() => {
    if (detail.status !== "ACTIVE") return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [detail.status]);

  const countdown = formatCountdown(detail.endsAt, nowMs);
  const parsedBid = Number.parseInt(bidAmountStr, 10);
  const isValidBid =
    Number.isInteger(parsedBid) && parsedBid >= detail.minNextBid;
  const deltaRequired = isValidBid
    ? Math.max(0, parsedBid - detail.myHeldAmount)
    : Math.max(0, detail.minNextBid - detail.myHeldAmount);
  const hasEnoughBalance = walletNusaBalance >= deltaRequired;

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBid || !hasEnoughBalance) return;
    await onPlaceBid(detail.id, parsedBid);
  };

  return (
    <div
      id={AUCTION_SEMANTIC_IDS.detailModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auction-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 p-4"
    >
      <div className="animate-nc-modal nc-panel max-h-[92dvh] w-full max-w-4xl overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
          <div className="min-w-0">
            <h2
              id="auction-detail-title"
              className="truncate font-display text-2xl font-bold text-fg"
            >
              {detail.card.name}
            </h2>
            <p className="mt-1 text-xs text-subtle">
              {copy.sellerLabel}: {detail.sellerName} ({detail.sellerWallet.slice(0, 4)}...
              {detail.sellerWallet.slice(-4)})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.cancelAction}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-base bg-surface-elevated text-muted hover:border-border-strong hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="flex items-center justify-center rounded-2xl border border-border-base bg-surface-base p-5">
              <img
                src={detail.card.imagePath}
                alt={detail.card.name}
                className="h-64 w-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border-subtle bg-surface-elevated p-3.5 text-sm">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-amber-light" />
                <span className="text-muted">ATK:</span>
                <strong className="text-fg">{detail.card.baseAttack}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-light" />
                <span className="text-muted">DEF:</span>
                <strong className="text-fg">{detail.card.baseDefense}</strong>
              </div>
              <div className="col-span-2 flex flex-wrap gap-2 pt-1">
                <span className="nc-badge-primary">{detail.card.kingdom}</span>
                <span className="nc-badge-amber">{detail.card.role}</span>
                <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs text-subtle">
                  {detail.tokenStandard}
                </span>
              </div>
            </div>

            <p className="rounded-xl border border-border-subtle bg-surface-elevated p-3 text-xs text-muted">
              {copy.antiSnipeNote}
            </p>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-base bg-surface-elevated p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-subtle">
                  {detail.bidCount > 0
                    ? copy.currentBidLabel
                    : copy.startingPriceLabel}
                </p>
                <p className="font-display text-2xl font-bold text-amber">
                  {(detail.bidCount > 0
                    ? detail.currentHighestBid
                    : detail.startingPrice
                  ).toLocaleString()}{" "}
                  NUSA
                </p>
              </div>
              <div>
                <p className="text-xs text-subtle">{copy.timeRemainingLabel}</p>
                <p
                  className={`mt-0.5 inline-flex items-center gap-1.5 font-display text-xl font-bold ${
                    countdown.isCritical
                      ? "text-danger-light"
                      : countdown.isUrgent
                        ? "text-amber-light"
                        : "text-emerald-light"
                  }`}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {detail.status === "ACTIVE" && !countdown.isEnded
                    ? countdown.label
                    : detail.status}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-subtle">{copy.highestBidderLabel}</p>
                <p className="truncate font-display text-base font-bold text-fg">
                  {detail.highestBidderName ?? copy.noBidsYet}
                </p>
              </div>
            </div>

            {detail.myHeldAmount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber/40 bg-amber/10 p-3.5 text-sm">
                <div className="flex items-center gap-2 text-amber-light">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    Dana dibekukan Anda di lelang ini:{" "}
                    <strong>{detail.myHeldAmount.toLocaleString()} NUSA</strong>
                  </span>
                </div>
                {detail.myRefundPending && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void onClaimRefund(detail.id)}
                    className="nc-btn-emerald min-h-[40px] px-4 text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {copy.claimRefund}
                  </button>
                )}
              </div>
            )}

            {detail.canSettle && (
              <div className="rounded-xl border border-emerald/40 bg-emerald/10 p-4">
                <p className="text-sm text-cream">
                  Waktu lelang telah berakhir. Selesaikan transaksi on-chain untuk
                  mengirim kartu ke pemenang dan memproses pembagian NUSA (90% penjual,
                  10% fee platform).
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void onSettleAuction(detail.id)}
                  className="nc-btn-emerald mt-3"
                >
                  {isSubmitting ? "Menyelesaikan..." : copy.settleAuction}
                </button>
              </div>
            )}

            {detail.canBid ? (
              <form
                onSubmit={handleBidSubmit}
                className="space-y-3 rounded-xl border border-border-base bg-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted">
                    {copy.availableBalanceLabel}:{" "}
                    <strong className="text-fg">
                      {walletNusaBalance.toLocaleString()} NUSA
                    </strong>
                  </span>
                  <span className="text-muted">
                    Dipakai sekarang (delta):{" "}
                    <strong className="text-amber-light">
                      {deltaRequired.toLocaleString()} NUSA
                    </strong>
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id={AUCTION_SEMANTIC_IDS.bidInput}
                    type="number"
                    min={detail.minNextBid}
                    step={1}
                    value={bidAmountStr}
                    onChange={(e) => setBidAmountStr(e.target.value)}
                    className="nc-input flex-1"
                    required
                  />
                  <button
                    id={AUCTION_SEMANTIC_IDS.bidSubmitButton}
                    type="submit"
                    disabled={isSubmitting || !isValidBid || !hasEnoughBalance}
                    className="nc-btn-emerald shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Gavel className="h-4 w-4" />
                    {isSubmitting ? "Memproses..." : copy.placeBid}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {BID_STEPS.map((extra) => {
                    const target = detail.minNextBid + extra;
                    return (
                      <button
                        key={extra}
                        type="button"
                        onClick={() => setBidAmountStr(String(target))}
                        className="min-h-[36px] rounded-lg border border-border-base bg-surface px-3 text-xs font-semibold text-muted hover:border-border-strong hover:text-fg"
                      >
                        {extra === 0
                          ? `Min (${target.toLocaleString()})`
                          : `+${extra + 50} (${target.toLocaleString()})`}
                      </button>
                    );
                  })}
                </div>

                {!hasEnoughBalance && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger-light">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {copy.insufficientBalance} (Butuh {deltaRequired.toLocaleString()} NUSA)
                    </span>
                    <Link
                      href={ROUTES.USER_SHOP(locale)}
                      className="font-bold text-fg underline"
                    >
                      {copy.goToShop}
                    </Link>
                  </div>
                )}

                <p className="text-xs text-subtle">{copy.freezeWarning}</p>
              </form>
            ) : (
              detail.status === "ACTIVE" &&
              !countdown.isEnded && (
                <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3.5 text-sm text-muted">
                  {detail.canEdit || detail.canCancel
                    ? "Anda adalah pemilik lelang ini. Selama belum ada penawar, Anda dapat mengedit harga/durasi atau menghapus lelang."
                    : detail.highestBidderId && detail.myHeldAmount > 0
                      ? copy.alreadyHighestBidder
                      : detail.bidCount > 0 && !detail.canBid
                        ? copy.lockedEditReason
                        : copy.sellerCannotBid}
                </div>
              )
            )}

            {(detail.canEdit || detail.canCancel) && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-base bg-surface-elevated p-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onOpenEdit(detail)}
                  className="nc-btn-secondary"
                >
                  <Pencil className="h-4 w-4" />
                  {copy.editAuction}
                </button>
                {!confirmCancel ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setConfirmCancel(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-danger/50 bg-danger/15 px-5 font-display text-sm font-bold text-danger-light hover:bg-danger/25"
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.cancelAuction}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void onCancelAuction(detail.id)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-danger px-5 font-display text-sm font-bold text-fg"
                    >
                      {isSubmitting ? "Membatalkan..." : "Konfirmasi Hapus & Tarik Kartu"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      className="nc-btn-secondary"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4">
              <h3 className="font-display text-base font-bold text-fg">
                {copy.bidHistoryTitle} ({detail.bids.length})
              </h3>
              {detail.bids.length === 0 ? (
                <p className="mt-2 text-sm text-subtle">{copy.noBidsYet}</p>
              ) : (
                <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {detail.bids.map((bid, idx) => (
                    <li
                      key={bid.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-fg">
                          {idx === 0 ? "#1 " : ""}
                          {bid.bidderName}
                        </span>
                        <span className="ml-2 text-subtle">
                          {new Date(bid.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-amber">
                          {bid.amount.toLocaleString()} NUSA
                        </span>
                        <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[11px] text-muted">
                          {bid.status}
                        </span>
                        <a
                          href={`https://explorer.solana.com/tx/${bid.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Solana Explorer"
                          className="text-primary-light hover:text-fg"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
