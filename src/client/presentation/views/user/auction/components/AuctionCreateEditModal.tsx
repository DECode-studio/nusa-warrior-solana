"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { ROUTES } from "@/core/constants/routes";
import type {
  AuctionListingEntity,
  SellableCardOptionEntity,
} from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { AUCTION_TEXT_CONSTANT } from "../constants/TextConstant";
import { useAuctionCreateEditModal } from "../hooks/useAuctionCreateEditModal";

export interface AuctionCreateEditModalProps {
  readonly mode: "create" | "edit";
  readonly sellableCards: readonly SellableCardOptionEntity[];
  readonly editingAuction: AuctionListingEntity | null;
  readonly onClose: () => void;
  readonly onSuccess: (message: string) => Promise<void>;
}

const DURATION_PRESETS = [1, 6, 12, 24] as const;

export function AuctionCreateEditModal({
  mode,
  sellableCards,
  editingAuction,
  onClose,
  onSuccess,
}: AuctionCreateEditModalProps): React.ReactElement {
  const vm = useAuctionCreateEditModal({
    mode,
    sellableCards,
    editingAuction,
    onClose,
    onSuccess,
  });
  const { locale, t } = vm;

  return (
    <div
      id={AUCTION_SEMANTIC_IDS.createModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auction-create-edit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 p-4"
    >
      <div className="animate-nc-modal nc-panel max-h-[90dvh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <h2
            id="auction-create-edit-title"
            className="font-display text-2xl font-bold text-fg"
          >
            {mode === "create"
              ? t(AUCTION_TEXT_CONSTANT.CREATE_MODAL_TITLE)
              : t(AUCTION_TEXT_CONSTANT.EDIT_MODAL_TITLE)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(AUCTION_TEXT_CONSTANT.CANCEL_ACTION)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-base bg-surface-elevated text-muted hover:border-border-strong hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void vm.submitForm();
          }}
          className="mt-5 space-y-5"
        >
          {mode === "create" && (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-cream">
                  {t(AUCTION_TEXT_CONSTANT.SELECT_CARD_LABEL)}
                </label>
                <Link
                  href={ROUTES.USER_DECKS(locale)}
                  className="text-xs font-semibold text-primary-light underline-offset-4 hover:underline"
                >
                  {t(AUCTION_TEXT_CONSTANT.GO_TO_DECKS)}
                </Link>
              </div>
              <p className="mb-3 text-xs text-subtle">
                {t(AUCTION_TEXT_CONSTANT.DECK_BLOCKED_HINT)}
              </p>

              {sellableCards.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 text-sm text-muted">
                  {t(AUCTION_TEXT_CONSTANT.NO_SELLABLE_CARDS)}
                </div>
              ) : (
                <div className="grid max-h-60 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {sellableCards.map((item) => {
                    const disabled = Boolean(item.blockedReason);
                    const isSelected = vm.selectedCardId === item.card.id;
                    return (
                      <button
                        key={item.card.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => vm.setSelectedCardId(item.card.id)}
                        className={`flex min-h-[76px] items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                          disabled
                            ? "cursor-not-allowed border-border-subtle bg-surface opacity-55"
                            : isSelected
                              ? "border-primary bg-primary/15"
                              : "border-border-base bg-surface-elevated hover:border-border-strong"
                        }`}
                      >
                        <img
                          src={item.card.imagePath}
                          alt={item.card.name}
                          className="h-14 w-11 shrink-0 rounded object-contain"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold text-fg">
                            {item.card.name}
                          </p>
                          <p className="text-xs text-subtle">
                            {t(AUCTION_TEXT_CONSTANT.WALLET_QTY_LABEL)}:{" "}
                            {item.walletQuantity} |{" "}
                            {t(AUCTION_TEXT_CONSTANT.DECK_QTY_LABEL)}:{" "}
                            {item.inDeckQuantity}
                          </p>
                          {item.blockedReason ? (
                            <p className="mt-0.5 text-xs text-danger-light">
                              {vm.resolveBlockedReason(item.blockedReason)}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-emerald-light">
                              {t(AUCTION_TEXT_CONSTANT.AVAILABLE_CARDS_PREFIX)}:{" "}
                              {item.availableForAuction}{" "}
                              {t(AUCTION_TEXT_CONSTANT.CARDS_UNIT)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="auction-starting-price"
                className="mb-1.5 block text-sm font-semibold text-cream"
              >
                {t(AUCTION_TEXT_CONSTANT.STARTING_PRICE_LABEL)} (NUSA)
              </label>
              <input
                id="auction-starting-price"
                type="number"
                min={50}
                step={1}
                value={vm.startingPriceStr}
                onChange={(e) => vm.setStartingPriceStr(e.target.value)}
                className="nc-input"
                placeholder="100"
                required
              />
              <p className="mt-1 text-xs text-subtle">
                {t(AUCTION_TEXT_CONSTANT.STARTING_PRICE_HINT_PREFIX)}{" "}
                <strong className="text-amber-light">
                  {vm.minFirstBid.toLocaleString()} NUSA
                </strong>{" "}
                {t(AUCTION_TEXT_CONSTANT.STARTING_PRICE_HINT_SUFFIX)}
              </p>
            </div>

            <div>
              <label
                htmlFor="auction-duration-hours"
                className="mb-1.5 block text-sm font-semibold text-cream"
              >
                {t(AUCTION_TEXT_CONSTANT.DURATION_LABEL)}
              </label>
              <input
                id="auction-duration-hours"
                type="number"
                min={1}
                max={24}
                step={1}
                value={vm.durationHours}
                onChange={(e) =>
                  vm.setDurationHours(Number.parseInt(e.target.value, 10))
                }
                className="nc-input"
                required
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => vm.setDurationHours(preset)}
                    className={`min-h-[36px] rounded-lg border px-3 text-xs font-semibold transition-colors ${
                      vm.durationHours === preset
                        ? "border-primary bg-primary/20 text-fg"
                        : "border-border-base bg-surface-elevated text-muted hover:border-border-strong"
                    }`}
                  >
                    {preset}
                    {t(AUCTION_TEXT_CONSTANT.HOUR_SHORT_SUFFIX)}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-subtle">
                {t(AUCTION_TEXT_CONSTANT.DURATION_HINT)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>
                {t(AUCTION_TEXT_CONSTANT.FEE_INFO_LABEL)} (
                {t(AUCTION_TEXT_CONSTANT.FEE_FROM_FIRST_BID_PREFIX)}{" "}
                {vm.minFirstBid.toLocaleString()} NUSA)
              </span>
              <span className="font-semibold text-danger-light">
                -{vm.estFee.toLocaleString()} NUSA
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2 font-display text-base font-bold text-fg">
              <span>{t(AUCTION_TEXT_CONSTANT.ESTIMATED_NET_LABEL)}</span>
              <span className="text-emerald-light">
                {vm.estPayout.toLocaleString()} NUSA
              </span>
            </div>
          </div>

          {vm.localError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger-light">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{vm.localError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={vm.isSubmitting}
              className="nc-btn-secondary"
            >
              {t(AUCTION_TEXT_CONSTANT.CANCEL_ACTION)}
            </button>
            <button
              type="submit"
              disabled={
                vm.isSubmitting || (mode === "create" && !vm.selectedCardId)
              }
              className="nc-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {vm.isSubmitting
                ? t(AUCTION_TEXT_CONSTANT.PROCESSING_SOLANA_TX)
                : mode === "create"
                  ? t(AUCTION_TEXT_CONSTANT.SUBMIT_CREATE)
                  : t(AUCTION_TEXT_CONSTANT.SUBMIT_EDIT)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
