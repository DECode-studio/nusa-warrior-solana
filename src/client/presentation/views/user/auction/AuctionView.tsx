"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Gavel,
  Lock,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTranslator } from "@/core/translator";
import type {
  AuctionSort,
  AuctionTab,
} from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { getAuctionCopy } from "./constants/TextConstant";
import { useAuction } from "./hooks/useAuction";
import {
  AuctionCardItem,
  AuctionCreateEditModal,
  AuctionDetailModal,
  AuctionFrozenBanner,
} from "./components";

const KINGDOM_OPTIONS = [
  "MAJAPAHIT",
  "PAJAJARAN",
  "NUSANTARA_UMUM",
  "DAHA_KADIRI",
  "PORTUGIS",
  "DEMAK_CIREBON",
  "BANTEN",
] as const;

export function UserAuctionView(): React.ReactElement {
  const { locale } = useTranslator();
  const copy = getAuctionCopy(locale);
  const vm = useAuction();

  const tabs: Array<{ key: AuctionTab; label: string; id: string }> = [
    { key: "explore", label: copy.tabs.explore, id: AUCTION_SEMANTIC_IDS.tabExplore },
    { key: "selling", label: copy.tabs.selling, id: AUCTION_SEMANTIC_IDS.tabSelling },
    { key: "bidding", label: copy.tabs.bidding, id: AUCTION_SEMANTIC_IDS.tabBidding },
    { key: "history", label: copy.tabs.history, id: AUCTION_SEMANTIC_IDS.tabHistory },
  ];

  const auctions = vm.listData?.auctions ?? [];
  const availableNusa = vm.listData?.walletNusaBalance ?? 0;
  const frozenNusa = vm.listData?.frozenNusaTotal ?? 0;
  const activeSelling = vm.listData?.activeSellingCount ?? 0;
  const maxSelling = vm.listData?.maxActiveListings ?? 5;

  const emptyState =
    vm.tab === "explore"
      ? { title: copy.emptyExploreTitle, desc: copy.emptyExploreDesc }
      : vm.tab === "selling"
        ? { title: copy.emptySellingTitle, desc: copy.emptySellingDesc }
        : vm.tab === "bidding"
          ? { title: copy.emptyBiddingTitle, desc: copy.emptyBiddingDesc }
          : { title: copy.emptyHistoryTitle, desc: copy.emptyHistoryDesc };

  return (
    <div
      id={AUCTION_SEMANTIC_IDS.pageRoot}
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6"
    >
      <header className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            id={AUCTION_SEMANTIC_IDS.headerTitle}
            className="font-display text-3xl font-bold text-fg sm:text-4xl"
          >
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted sm:text-base">
            {copy.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void vm.loadAuctions()}
            disabled={vm.isLoading}
            className="nc-btn-secondary"
            aria-label="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${vm.isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            id={AUCTION_SEMANTIC_IDS.createButton}
            type="button"
            disabled={!vm.walletConnected || activeSelling >= maxSelling}
            onClick={() => vm.setIsCreateModalOpen(true)}
            className="nc-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {copy.createAuction}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="nc-panel flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-emerald-light">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">{copy.availableBalanceLabel}</p>
            <p className="font-display text-2xl font-bold text-fg">
              {availableNusa.toLocaleString()} NUSA
            </p>
          </div>
        </div>

        <div className="nc-panel flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber-light">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">{copy.frozenBalanceLabel}</p>
            <p className="font-display text-2xl font-bold text-amber">
              {frozenNusa.toLocaleString()} NUSA
            </p>
          </div>
        </div>

        <div className="nc-panel flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-light">
            <Gavel className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">{copy.activeListingsLabel}</p>
            <p className="font-display text-2xl font-bold text-fg">
              {activeSelling} / {maxSelling}
            </p>
          </div>
        </div>
      </section>

      {!vm.walletConnected && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-amber-light">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{copy.walletRequired}</span>
        </div>
      )}

      {vm.errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-light">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{vm.errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => vm.setErrorMessage(null)}
            className="text-xs font-semibold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {vm.statusMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald/40 bg-emerald/10 p-4 text-sm text-emerald-light">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{vm.statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => vm.setStatusMessage(null)}
            className="text-xs font-semibold underline"
          >
            Tutup
          </button>
        </div>
      )}

      <AuctionFrozenBanner
        frozenTotal={frozenNusa}
        items={vm.listData?.frozenAuctions ?? []}
        copy={copy}
        onOpenAuction={(id) => void vm.openDetail(id)}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {tabs.map((item) => {
            const active = vm.tab === item.key;
            return (
              <button
                key={item.key}
                id={item.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => vm.setTab(item.key)}
                className={`min-h-[44px] rounded-full px-5 font-display text-sm font-bold transition-colors ${
                  active
                    ? "bg-primary text-fg"
                    : "border border-border-base bg-surface-elevated text-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="nc-input flex items-center gap-2.5">
            <Search
              className="h-4 w-4 shrink-0 text-subtle"
              aria-hidden="true"
            />
            <input
              id={AUCTION_SEMANTIC_IDS.searchInput}
              type="search"
              value={vm.search}
              onChange={(e) => vm.setSearch(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full bg-transparent text-fg placeholder:text-subtle focus:outline-none"
            />
          </div>

          <select
            id={AUCTION_SEMANTIC_IDS.kingdomFilter}
            value={vm.kingdom}
            onChange={(e) => vm.setKingdom(e.target.value)}
            className="nc-input"
          >
            <option value="">{copy.allKingdoms}</option>
            {KINGDOM_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            id={AUCTION_SEMANTIC_IDS.sortSelect}
            value={vm.sort}
            onChange={(e) => vm.setSort(e.target.value as AuctionSort)}
            className="nc-input"
          >
            <option value="ending_soon">{copy.sortOptions.ending_soon}</option>
            <option value="price_asc">{copy.sortOptions.price_asc}</option>
            <option value="price_desc">{copy.sortOptions.price_desc}</option>
            <option value="most_bids">{copy.sortOptions.most_bids}</option>
            <option value="newest">{copy.sortOptions.newest}</option>
          </select>
        </div>
      </section>

      {vm.isLoading ? (
        <div className="nc-panel flex flex-col items-center justify-center gap-3 p-10 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary-light" />
          <p className="text-sm text-muted">{copy.loadingText}</p>
        </div>
      ) : auctions.length === 0 ? (
        <div className="nc-panel flex flex-col items-center justify-center gap-3 p-10 text-center">
          <Gavel className="h-8 w-8 text-subtle" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-fg">
            {emptyState.title}
          </h2>
          <p className="max-w-md text-sm text-muted">{emptyState.desc}</p>
          {vm.tab !== "history" && vm.walletConnected && (
            <button
              type="button"
              onClick={() => vm.setIsCreateModalOpen(true)}
              className="nc-btn-primary mt-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {copy.createAuction}
            </button>
          )}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <AuctionCardItem
              key={auction.id}
              auction={auction}
              copy={copy}
              onSelect={(id) => void vm.openDetail(id)}
            />
          ))}
        </section>
      )}

      {vm.isCreateModalOpen && (
        <AuctionCreateEditModal
          mode="create"
          locale={locale}
          copy={copy}
          sellableCards={vm.listData?.sellableCards ?? []}
          editingAuction={null}
          isSubmitting={vm.isSubmitting}
          onClose={() => vm.setIsCreateModalOpen(false)}
          onSubmitCreate={vm.createAuction}
          onSubmitEdit={vm.editAuction}
        />
      )}

      {vm.editingAuction && (
        <AuctionCreateEditModal
          mode="edit"
          locale={locale}
          copy={copy}
          sellableCards={vm.listData?.sellableCards ?? []}
          editingAuction={vm.editingAuction}
          isSubmitting={vm.isSubmitting}
          onClose={() => vm.setEditingAuction(null)}
          onSubmitCreate={vm.createAuction}
          onSubmitEdit={vm.editAuction}
        />
      )}

      {vm.selectedDetail && !vm.isLoadingDetail && (
        <AuctionDetailModal
          detail={vm.selectedDetail}
          locale={locale}
          copy={copy}
          walletNusaBalance={availableNusa}
          isSubmitting={vm.isSubmitting}
          onClose={vm.closeDetail}
          onPlaceBid={vm.placeBid}
          onOpenEdit={(detail) => {
            vm.closeDetail();
            vm.setEditingAuction(detail);
          }}
          onCancelAuction={vm.cancelAuction}
          onSettleAuction={vm.settleAuction}
          onClaimRefund={vm.claimRefund}
        />
      )}
    </div>
  );
}
