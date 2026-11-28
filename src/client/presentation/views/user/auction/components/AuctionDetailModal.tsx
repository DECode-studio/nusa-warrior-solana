"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Gavel,
  Lock,
  Pencil,
  RefreshCw,
  RotateCcw,
  Shield,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import type { AuctionDetailEntity } from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { AUCTION_TEXT_CONSTANT } from "../constants/TextConstant";
import type { AuctionCountdownState } from "../hooks/useAuction";
import { useAuctionDetailModal } from "../hooks/useAuctionDetailModal";

export interface AuctionDetailModalProps {
  readonly auctionId: string;
  readonly getCountdown: (endsAtIso: string) => AuctionCountdownState;
  readonly walletNusaBalance: number;
  readonly onClose: () => void;
  readonly onOpenEdit: (detail: AuctionDetailEntity) => void;
  readonly onMutated: (message: string) => Promise<void>;
}

const BID_STEPS = [0, 50, 100, 250] as const;

export function AuctionDetailModal({
  auctionId,
  getCountdown,
  walletNusaBalance,
  onClose,
  onOpenEdit,
  onMutated,
}: AuctionDetailModalProps): React.ReactElement {
  const vm = useAuctionDetailModal({
    auctionId,
    walletNusaBalance,
    onClose,
    onMutated,
  });
  const { detail, locale, t } = vm;

  if (vm.isLoading || !detail) {
    return (
      <div
        id={AUCTION_SEMANTIC_IDS.detailModal}
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 p-4"
      >
        <div className="animate-nc-modal nc-panel flex w-full max-w-md flex-col items-center gap-3 p-6 text-center">
          {vm.localError ? (
            <>
              <AlertCircle className="h-6 w-6 text-danger-light" />
              <p className="text-sm text-danger-light">{vm.localError}</p>
              <button
                type="button"
                onClick={onClose}
                className="nc-btn-secondary mt-2"
              >
                {t(AUCTION_TEXT_CONSTANT.CLOSE_BUTTON_LABEL)}
              </button>
            </>
          ) : (
            <>
              <RefreshCw className="h-6 w-6 animate-spin text-primary-light" />
              <p className="text-sm text-muted">
                {t(AUCTION_TEXT_CONSTANT.LOADING_TEXT)}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const countdown = getCountdown(detail.endsAt);

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
              {t(AUCTION_TEXT_CONSTANT.SELLER_LABEL)}: {detail.sellerName} (
              {detail.sellerWallet.slice(0, 4)}...{detail.sellerWallet.slice(-4)})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(AUCTION_TEXT_CONSTANT.CANCEL_ACTION)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-base bg-surface-elevated text-muted hover:border-border-strong hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {vm.localError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger-light">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{vm.localError}</span>
          </div>
        )}

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
              {t(AUCTION_TEXT_CONSTANT.ANTI_SNIPE_NOTE)}
            </p>
          </div>

          <div className="space-y-4 lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-base bg-surface-elevated p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-subtle">
                  {detail.bidCount > 0
                    ? t(AUCTION_TEXT_CONSTANT.CURRENT_BID_LABEL)
                    : t(AUCTION_TEXT_CONSTANT.STARTING_PRICE_LABEL)}
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
                <p className="text-xs text-subtle">
                  {t(AUCTION_TEXT_CONSTANT.TIME_REMAINING_LABEL)}
                </p>
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
                <p className="text-xs text-subtle">
                  {t(AUCTION_TEXT_CONSTANT.HIGHEST_BIDDER_LABEL)}
                </p>
                <p className="truncate font-display text-base font-bold text-fg">
                  {detail.highestBidderName ??
                    t(AUCTION_TEXT_CONSTANT.NO_BIDS_YET)}
                </p>
              </div>
            </div>

            {detail.myHeldAmount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber/40 bg-amber/10 p-3.5 text-sm">
                <div className="flex items-center gap-2 text-amber-light">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    {t(AUCTION_TEXT_CONSTANT.FROZEN_ON_THIS_AUCTION_LABEL)}{" "}
                    <strong>{detail.myHeldAmount.toLocaleString()} NUSA</strong>
                  </span>
                </div>
                {detail.myRefundPending && (
                  <button
                    type="button"
                    disabled={vm.isSubmitting}
                    onClick={() => void vm.claimRefund()}
                    className="nc-btn-emerald min-h-[40px] px-4 text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t(AUCTION_TEXT_CONSTANT.CLAIM_REFUND)}
                  </button>
                )}
              </div>
            )}

            {detail.canSettle && (
              <div className="rounded-xl border border-emerald/40 bg-emerald/10 p-4">
                <p className="text-sm text-cream">
                  {t(AUCTION_TEXT_CONSTANT.SETTLE_PROMPT_TEXT)}
                </p>
                <button
                  type="button"
                  disabled={vm.isSubmitting}
                  onClick={() => void vm.settleAuction()}
                  className="nc-btn-emerald mt-3"
                >
                  {vm.isSubmitting
                    ? t(AUCTION_TEXT_CONSTANT.SETTLING_SHORT)
                    : t(AUCTION_TEXT_CONSTANT.SETTLE_AUCTION)}
                </button>
              </div>
            )}

            {detail.canBid ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void vm.submitBid();
                }}
                className="space-y-3 rounded-xl border border-border-base bg-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted">
                    {t(AUCTION_TEXT_CONSTANT.AVAILABLE_BALANCE_LABEL)}:{" "}
                    <strong className="text-fg">
                      {walletNusaBalance.toLocaleString()} NUSA
                    </strong>
                  </span>
                  <span className="text-muted">
                    {t(AUCTION_TEXT_CONSTANT.DELTA_REQUIRED_NOW_LABEL)}{" "}
                    <strong className="text-amber-light">
                      {vm.deltaRequired.toLocaleString()} NUSA
                    </strong>
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id={AUCTION_SEMANTIC_IDS.bidInput}
                    type="number"
                    min={detail.minNextBid}
                    step={1}
                    value={vm.bidAmountStr}
                    onChange={(e) => vm.setBidAmountStr(e.target.value)}
                    className="nc-input flex-1"
                    required
                  />
                  <button
                    id={AUCTION_SEMANTIC_IDS.bidSubmitButton}
                    type="submit"
                    disabled={
                      vm.isSubmitting || !vm.isValidBid || !vm.hasEnoughBalance
                    }
                    className="nc-btn-emerald shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Gavel className="h-4 w-4" />
                    {vm.isSubmitting
                      ? t(AUCTION_TEXT_CONSTANT.PROCESSING_SHORT)
                      : t(AUCTION_TEXT_CONSTANT.PLACE_BID)}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {BID_STEPS.map((extra) => {
                    const target = detail.minNextBid + extra;
                    return (
                      <button
                        key={extra}
                        type="button"
                        onClick={() => vm.setBidAmountStr(String(target))}
                        className="min-h-[36px] rounded-lg border border-border-base bg-surface px-3 text-xs font-semibold text-muted hover:border-border-strong hover:text-fg"
                      >
                        {extra === 0
                          ? `${t(AUCTION_TEXT_CONSTANT.MIN_STEP_PREFIX)} (${target.toLocaleString()})`
                          : `+${extra + 50} (${target.toLocaleString()})`}
                      </button>
                    );
                  })}
                </div>

                {!vm.hasEnoughBalance && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger-light">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {t(AUCTION_TEXT_CONSTANT.INSUFFICIENT_BALANCE)} (
                      {t(AUCTION_TEXT_CONSTANT.NEED_SHORTFALL_PREFIX)}{" "}
                      {vm.deltaRequired.toLocaleString()} NUSA)
                    </span>
                    <Link
                      href={ROUTES.USER_SHOP(locale)}
                      className="font-bold text-fg underline"
                    >
                      {t(AUCTION_TEXT_CONSTANT.GO_TO_SHOP)}
                    </Link>
                  </div>
                )}

                <p className="text-xs text-subtle">
                  {t(AUCTION_TEXT_CONSTANT.FREEZE_WARNING)}
                </p>
              </form>
            ) : (
              detail.status === "ACTIVE" &&
              !countdown.isEnded && (
                <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3.5 text-sm text-muted">
                  {detail.canEdit || detail.canCancel
                    ? t(AUCTION_TEXT_CONSTANT.SELLER_CAN_MANAGE_NOTICE)
                    : detail.highestBidderId && detail.myHeldAmount > 0
                      ? t(AUCTION_TEXT_CONSTANT.ALREADY_HIGHEST_BIDDER)
                      : detail.bidCount > 0 && !detail.canBid
                        ? t(AUCTION_TEXT_CONSTANT.LOCKED_EDIT_REASON)
                        : t(AUCTION_TEXT_CONSTANT.SELLER_CANNOT_BID)}
                </div>
              )
            )}

            {(detail.canEdit || detail.canCancel) && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-base bg-surface-elevated p-4">
                <button
                  type="button"
                  disabled={vm.isSubmitting}
                  onClick={() => onOpenEdit(detail)}
                  className="nc-btn-secondary"
                >
                  <Pencil className="h-4 w-4" />
                  {t(AUCTION_TEXT_CONSTANT.EDIT_AUCTION)}
                </button>
                {!vm.confirmCancel ? (
                  <button
                    type="button"
                    disabled={vm.isSubmitting}
                    onClick={() => vm.setConfirmCancel(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-danger/50 bg-danger/15 px-5 font-display text-sm font-bold text-danger-light hover:bg-danger/25"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t(AUCTION_TEXT_CONSTANT.CANCEL_AUCTION)}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={vm.isSubmitting}
                      onClick={() => void vm.cancelAuction()}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-danger px-5 font-display text-sm font-bold text-fg"
                    >
                      {vm.isSubmitting
                        ? t(AUCTION_TEXT_CONSTANT.CANCELLING_SHORT)
                        : t(AUCTION_TEXT_CONSTANT.CONFIRM_DELETE_WITHDRAW)}
                    </button>
                    <button
                      type="button"
                      onClick={() => vm.setConfirmCancel(false)}
                      className="nc-btn-secondary"
                    >
                      {t(AUCTION_TEXT_CONSTANT.CANCEL_BUTTON_LABEL)}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4">
              <h3 className="font-display text-base font-bold text-fg">
                {t(AUCTION_TEXT_CONSTANT.BID_HISTORY_TITLE)} ({detail.bids.length})
              </h3>
              {detail.bids.length === 0 ? (
                <p className="mt-2 text-sm text-subtle">
                  {t(AUCTION_TEXT_CONSTANT.NO_BIDS_YET)}
                </p>
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
