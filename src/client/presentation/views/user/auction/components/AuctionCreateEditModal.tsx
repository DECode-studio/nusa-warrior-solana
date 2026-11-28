"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { ROUTES, type SupportedLocale } from "@/core/constants/routes";
import type {
  AuctionListingEntity,
  SellableCardOptionEntity,
} from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import type { AuctionCopy } from "../constants/TextConstant";

export interface AuctionCreateEditModalProps {
  readonly mode: "create" | "edit";
  readonly locale: SupportedLocale;
  readonly copy: AuctionCopy;
  readonly sellableCards: readonly SellableCardOptionEntity[];
  readonly editingAuction: AuctionListingEntity | null;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onSubmitCreate: (input: {
    cardId: string;
    startingPrice: number;
    durationHours: number;
  }) => Promise<boolean>;
  readonly onSubmitEdit: (input: {
    auctionId: string;
    startingPrice: number;
    durationHours: number;
  }) => Promise<boolean>;
}

const DURATION_PRESETS = [1, 6, 12, 24] as const;

export function AuctionCreateEditModal({
  mode,
  locale,
  copy,
  sellableCards,
  editingAuction,
  isSubmitting,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: AuctionCreateEditModalProps): React.ReactElement {
  const firstAvailable = useMemo(
    () => sellableCards.find((item) => !item.blockedReason)?.card.id ?? "",
    [sellableCards]
  );

  const [selectedCardId, setSelectedCardId] = useState<string>(
    mode === "edit" ? (editingAuction?.card.id ?? "") : firstAvailable
  );
  const [startingPriceStr, setStartingPriceStr] = useState<string>(
    mode === "edit" ? String(editingAuction?.startingPrice ?? 100) : "100"
  );
  const [durationHours, setDurationHours] = useState<number>(
    mode === "edit" ? (editingAuction?.durationHours ?? 12) : 12
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const parsedPrice = Number.parseInt(startingPriceStr, 10);
  const isValidPrice = Number.isInteger(parsedPrice) && parsedPrice >= 50;
  const minFirstBid = isValidPrice ? parsedPrice + 50 : 100;
  const estFee = Math.floor((minFirstBid * 1000) / 10_000);
  const estPayout = Math.max(0, minFirstBid - estFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!isValidPrice) {
      setLocalError("Harga awal minimal 50 NUSA (bilangan bulat).");
      return;
    }
    if (durationHours < 1 || durationHours > 24) {
      setLocalError("Durasi lelang harus antara 1 hingga 24 jam.");
      return;
    }
    if (mode === "create") {
      if (!selectedCardId) {
        setLocalError("Pilih kartu yang tersedia untuk dilelang.");
        return;
      }
      await onSubmitCreate({
        cardId: selectedCardId,
        startingPrice: parsedPrice,
        durationHours,
      });
    } else if (editingAuction) {
      await onSubmitEdit({
        auctionId: editingAuction.id,
        startingPrice: parsedPrice,
        durationHours,
      });
    }
  };

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
            {mode === "create" ? copy.createModalTitle : copy.editModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.cancelAction}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-base bg-surface-elevated text-muted hover:border-border-strong hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {mode === "create" && (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-cream">
                  {copy.selectCardLabel}
                </label>
                <Link
                  href={ROUTES.USER_DECKS(locale)}
                  className="text-xs font-semibold text-primary-light underline-offset-4 hover:underline"
                >
                  {copy.goToDecks}
                </Link>
              </div>
              <p className="mb-3 text-xs text-subtle">{copy.deckBlockedHint}</p>

              {sellableCards.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 text-sm text-muted">
                  Belum ada kartu on-chain di dompet Anda yang dapat dilelang.
                </div>
              ) : (
                <div className="grid max-h-60 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {sellableCards.map((item) => {
                    const disabled = Boolean(item.blockedReason);
                    const isSelected = selectedCardId === item.card.id;
                    return (
                      <button
                        key={item.card.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedCardId(item.card.id)}
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
                            Dompet: {item.walletQuantity} | Deck: {item.inDeckQuantity}
                          </p>
                          {item.blockedReason ? (
                            <p className="mt-0.5 text-xs text-danger-light">
                              {item.blockedReason}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-emerald-light">
                              Tersedia: {item.availableForAuction} kartu
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
                {copy.startingPriceLabel} (NUSA)
              </label>
              <input
                id="auction-starting-price"
                type="number"
                min={50}
                step={1}
                value={startingPriceStr}
                onChange={(e) => setStartingPriceStr(e.target.value)}
                className="nc-input"
                placeholder="100"
                required
              />
              <p className="mt-1 text-xs text-subtle">
                Minimal 50 NUSA. Bid pertama otomatis minimal{" "}
                <strong className="text-amber-light">
                  {minFirstBid.toLocaleString()} NUSA
                </strong>{" "}
                (+50 NUSA).
              </p>
            </div>

            <div>
              <label
                htmlFor="auction-duration-hours"
                className="mb-1.5 block text-sm font-semibold text-cream"
              >
                {copy.durationLabel}
              </label>
              <input
                id="auction-duration-hours"
                type="number"
                min={1}
                max={24}
                step={1}
                value={durationHours}
                onChange={(e) =>
                  setDurationHours(
                    Math.max(1, Math.min(24, Number.parseInt(e.target.value, 10) || 1))
                  )
                }
                className="nc-input"
                required
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDurationHours(preset)}
                    className={`min-h-[36px] rounded-lg border px-3 text-xs font-semibold transition-colors ${
                      durationHours === preset
                        ? "border-primary bg-primary/20 text-fg"
                        : "border-border-base bg-surface-elevated text-muted hover:border-border-strong"
                    }`}
                  >
                    {preset}j
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-subtle">{copy.durationHint}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>{copy.feeInfoLabel} (dari bid pertama {minFirstBid.toLocaleString()} NUSA)</span>
              <span className="font-semibold text-danger-light">
                -{estFee.toLocaleString()} NUSA
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2 font-display text-base font-bold text-fg">
              <span>{copy.estimatedNetLabel}</span>
              <span className="text-emerald-light">
                {estPayout.toLocaleString()} NUSA
              </span>
            </div>
          </div>

          {localError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger-light">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="nc-btn-secondary"
            >
              {copy.cancelAction}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (mode === "create" && !selectedCardId)}
              className="nc-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Memproses transaksi Solana..."
                : mode === "create"
                  ? copy.submitCreate
                  : copy.submitEdit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
