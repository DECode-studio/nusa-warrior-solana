"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaymentOrderEntity } from "@/client/domain/shop/entity/shop_entity";
import { useTranslator } from "@/core/translator";
import { formatIdrCurrency } from "@/core/utils/formatters";
import {
  Badge,
  Button,
  EmptyState,
  InputField,
  IntellioCard,
  Pagination,
} from "@/client/presentation/components/ui";
import { UserPageHeading } from "@/client/presentation/components/user";
import { TransactionDetailModal } from "./components";
import { TRANSACTION_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { TRANSACTION_TEXT } from "./constants/TextConstant";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useTransactionHistory } from "./hooks/useTransactionHistory";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

function statusVariant(status: PaymentOrderEntity["paymentStatus"]): "emerald" | "amber" | "danger" | "neutral" {
  if (status === "PAID") return "emerald";
  if (status === "PENDING") return "amber";
  if (status === "FAILED") return "danger";
  return "neutral";
}

function statusText(status: PaymentOrderEntity["paymentStatus"]): string {
  return `shop.transactionStatus.${status.toLowerCase()}`;
}

export function TransactionView(): React.ReactElement {
  const { t, locale } = useTranslator();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeState = useMemo(() => {
    const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const rawPageSize = Number.parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10);
    return {
      page: Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1,
      pageSize: PAGE_SIZE_OPTIONS.includes(rawPageSize as (typeof PAGE_SIZE_OPTIONS)[number])
        ? rawPageSize
        : DEFAULT_PAGE_SIZE,
      search: searchParams.get("search")?.trim() ?? "",
    };
  }, [searchParams]);
  const [searchValue, setSearchValue] = useState<string>(routeState.search);
  const debouncedSearch = useDebouncedValue(searchValue, 400);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentOrderEntity | null>(null);

  const updateSearchParams = useCallback((updates: Record<string, string | null>): void => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) nextParams.delete(key);
      else nextParams.set(key, value);
    });
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setSearchValue(routeState.search);
  }, [routeState.search]);

  useEffect(() => {
    const nextSearch = debouncedSearch.trim();
    if (nextSearch === routeState.search) return;
    updateSearchParams({ search: nextSearch || null, page: "1" });
  }, [debouncedSearch, routeState.search, updateSearchParams]);

  const query = useMemo(() => ({
    page: routeState.page,
    pageSize: routeState.pageSize,
    search: routeState.search,
  }), [routeState.page, routeState.pageSize, routeState.search]);
  const { result, loading, error, reload } = useTransactionHistory(query);
  const currentPage = result?.page ?? routeState.page;
  const totalPages = result?.totalPages ?? 1;
  const totalItems = result?.total ?? 0;

  useEffect(() => {
    if (result && result.page !== routeState.page) {
      updateSearchParams({ page: String(result.page) });
    }
  }, [result, routeState.page, updateSearchParams]);

  return (
    <div id={TRANSACTION_SEMANTIC_IDS.ROOT} className="space-y-6">
      <UserPageHeading
        title={t(TRANSACTION_TEXT.HISTORY_TITLE)}
        description={t(TRANSACTION_TEXT.HISTORY_SUBTITLE)}
      />

      <section id={TRANSACTION_SEMANTIC_IDS.HISTORY} className="space-y-4">
        <div className="max-w-xl">
          <InputField
            id="transaction-search"
            type="search"
            label={t(TRANSACTION_TEXT.SEARCH_LABEL)}
            placeholder={t(TRANSACTION_TEXT.SEARCH_PLACEHOLDER)}
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            autoComplete="off"
          />
        </div>

        {loading && (
          <p className="rounded-xl border border-border-base bg-surface-elevated/40 p-4 text-sm text-subtle">
            {t("common.loading")}
          </p>
        )}
        {!loading && error && (
          <EmptyState
            title={t(TRANSACTION_TEXT.HISTORY_ERROR)}
            action={
              <Button size="sm" onClick={reload}>
                {t(TRANSACTION_TEXT.RETRY)}
              </Button>
            }
          />
        )}
        {!loading && !error && totalItems === 0 && (
          <EmptyState
            title={routeState.search ? t(TRANSACTION_TEXT.SEARCH_EMPTY) : t(TRANSACTION_TEXT.HISTORY_EMPTY)}
          />
        )}
        {!loading && !error && (result?.items.length ?? 0) > 0 && (
          <div className="space-y-2">
            {result?.items.map((transaction) => (
              <IntellioCard
                key={transaction.id}
                id={`${TRANSACTION_SEMANTIC_IDS.ITEM_PREFIX}${transaction.id}`}
                variant="flat"
                padding="xs"
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="block truncate font-mono text-xs text-muted">
                      {transaction.orderNumber}
                    </span>
                    {(transaction.orderType === "TOPUP" || transaction.starterPackCode === "TOPUP_NUSA_POINT") && (
                      <Badge variant="amber" size="sm">TOP UP</Badge>
                    )}
                  </div>
                  <span className="mt-1 block truncate text-sm font-bold text-cream">
                    {transaction.starterPackName || transaction.starterPackCode}
                  </span>
                  <span className="mt-1 block text-xs text-subtle">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(transaction.createdAt))}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-sm font-bold text-amber-light">
                    {transaction.amountIdr === 0
                      ? "GRATIS"
                      : formatIdrCurrency(transaction.amountIdr)}
                  </span>
                  <Badge variant={statusVariant(transaction.paymentStatus)} size="sm">
                    {t(statusText(transaction.paymentStatus))}
                  </Badge>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    {t(TRANSACTION_TEXT.VIEW_DETAILS)}
                  </Button>
                </div>
              </IntellioCard>
            ))}
          </div>
        )}
        {!loading && !error && result && totalItems > 0 && (
          <Pagination
            id="transaction-history-pagination"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={query.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            itemLabel={t(TRANSACTION_TEXT.ITEM_LABEL)}
            onPageChange={(page) => updateSearchParams({ page: String(page) })}
            onPageSizeChange={(pageSize) => updateSearchParams({ page: "1", pageSize: String(pageSize) })}
          />
        )}
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </section>
    </div>
  );
}
