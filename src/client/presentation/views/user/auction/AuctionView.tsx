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
import { Pagination } from "@/client/presentation/components/ui/Pagination";
import type { AuctionSort } from "@/client/domain/auction/entity/auction_entity";
import { AUCTION_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { AUCTION_TEXT_CONSTANT } from "./constants/TextConstant";
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
  const vm = useAuction();
  const { t } = vm;

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
            {t(AUCTION_TEXT_CONSTANT.TITLE)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted sm:text-base">
            {t(AUCTION_TEXT_CONSTANT.SUBTITLE)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void vm.loadAuctions()}
            disabled={vm.isLoading}
            className="nc-btn-secondary"
            aria-label={t(AUCTION_TEXT_CONSTANT.REFRESH_LABEL)}
          >
            <RefreshCw
              className={`h-4 w-4 ${vm.isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            id={AUCTION_SEMANTIC_IDS.createButton}
            type="button"
            disabled={!vm.walletConnected || vm.activeSelling >= vm.maxSelling}
            onClick={vm.openCreateModal}
            className="nc-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t(AUCTION_TEXT_CONSTANT.CREATE_AUCTION)}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="nc-panel flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-emerald-light">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">
              {t(AUCTION_TEXT_CONSTANT.AVAILABLE_BALANCE_LABEL)}
            </p>
            <p className="font-display text-2xl font-bold text-fg">
              {vm.availableNusa.toLocaleString()} NUSA
            </p>
          </div>
        </div>

        <div className="nc-panel flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber-light">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">
              {t(AUCTION_TEXT_CONSTANT.FROZEN_BALANCE_LABEL)}
            </p>
            <p className="font-display text-2xl font-bold text-amber">
              {vm.frozenNusa.toLocaleString()} NUSA
            </p>
          </div>
        </div>

        <div className="nc-panel flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-light">
            <Gavel className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-subtle">
              {t(AUCTION_TEXT_CONSTANT.ACTIVE_LISTINGS_LABEL)}
            </p>
            <p className="font-display text-2xl font-bold text-fg">
              {vm.activeSelling} / {vm.maxSelling}
            </p>
          </div>
        </div>
      </section>

      {!vm.walletConnected && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-amber-light">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{t(AUCTION_TEXT_CONSTANT.WALLET_REQUIRED)}</span>
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
            onClick={vm.clearError}
            className="text-xs font-semibold underline"
          >
            {t(AUCTION_TEXT_CONSTANT.CLOSE_BUTTON_LABEL)}
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
            onClick={vm.clearStatus}
            className="text-xs font-semibold underline"
          >
            {t(AUCTION_TEXT_CONSTANT.CLOSE_BUTTON_LABEL)}
          </button>
        </div>
      )}

      <AuctionFrozenBanner
        frozenTotal={vm.frozenNusa}
        items={vm.frozenAuctions}
        onOpenAuction={vm.openDetail}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {vm.tabs.map((item) => {
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
              placeholder={t(AUCTION_TEXT_CONSTANT.SEARCH_PLACEHOLDER)}
              className="w-full bg-transparent text-fg placeholder:text-subtle focus:outline-none"
            />
          </div>

          <select
            id={AUCTION_SEMANTIC_IDS.kingdomFilter}
            value={vm.kingdom}
            onChange={(e) => vm.setKingdom(e.target.value)}
            className="nc-input"
          >
            <option value="">{t(AUCTION_TEXT_CONSTANT.ALL_KINGDOMS)}</option>
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
            <option value="ending_soon">
              {t(AUCTION_TEXT_CONSTANT.SORT_ENDING_SOON)}
            </option>
            <option value="price_asc">
              {t(AUCTION_TEXT_CONSTANT.SORT_PRICE_ASC)}
            </option>
            <option value="price_desc">
              {t(AUCTION_TEXT_CONSTANT.SORT_PRICE_DESC)}
            </option>
            <option value="most_bids">
              {t(AUCTION_TEXT_CONSTANT.SORT_MOST_BIDS)}
            </option>
            <option value="newest">
              {t(AUCTION_TEXT_CONSTANT.SORT_NEWEST)}
            </option>
          </select>
        </div>
      </section>

      {vm.isLoading ? (
        <div className="nc-panel flex flex-col items-center justify-center gap-3 p-10 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary-light" />
          <p className="text-sm text-muted">
            {t(AUCTION_TEXT_CONSTANT.LOADING_TEXT)}
          </p>
        </div>
      ) : vm.auctions.length === 0 ? (
        <div className="nc-panel flex flex-col items-center justify-center gap-3 p-10 text-center">
          <Gavel className="h-8 w-8 text-subtle" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-fg">
            {vm.emptyState.title}
          </h2>
          <p className="max-w-md text-sm text-muted">{vm.emptyState.desc}</p>
          {vm.tab !== "history" && vm.walletConnected && (
            <button
              type="button"
              onClick={vm.openCreateModal}
              className="nc-btn-primary mt-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t(AUCTION_TEXT_CONSTANT.CREATE_AUCTION)}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vm.auctions.map((auction) => (
              <AuctionCardItem
                key={auction.id}
                auction={auction}
                countdown={vm.getCountdown(auction.endsAt)}
                onSelect={vm.openDetail}
              />
            ))}
          </section>

          {vm.pagination && (
            <Pagination
              id="user-auction-pagination"
              currentPage={vm.pagination.page}
              totalPages={vm.pagination.totalPages}
              totalItems={vm.pagination.totalItems}
              pageSize={vm.pagination.pageSize}
              onPageChange={vm.setPage}
            />
          )}
        </div>
      )}

      {(vm.isCreateModalOpen || vm.editingAuction) && (
        <AuctionCreateEditModal
          mode={vm.editingAuction ? "edit" : "create"}
          sellableCards={vm.sellableCards}
          editingAuction={vm.editingAuction}
          onClose={vm.closeFormModal}
          onSuccess={vm.handleMutationSuccess}
        />
      )}

      {vm.activeDetailId && (
        <AuctionDetailModal
          auctionId={vm.activeDetailId}
          getCountdown={vm.getCountdown}
          walletNusaBalance={vm.availableNusa}
          onClose={vm.closeDetail}
          onOpenEdit={vm.openEditModal}
          onMutated={vm.handleMutationSuccess}
        />
      )}
    </div>
  );
}
