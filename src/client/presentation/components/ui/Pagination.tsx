"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslator } from "@/core/translator";

// ============================================================================
// 1. Hook: usePagination
// ============================================================================

export interface UsePaginationOptions {
  readonly initialPage?: number;
  readonly initialPageSize?: number;
}

export interface UsePaginationReturn<T> {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly paginatedItems: readonly T[];
  readonly startIndex: number;
  readonly endIndex: number;
  readonly startItem: number;
  readonly endItem: number;
  readonly setCurrentPage: (page: number) => void;
  readonly setPageSize: (size: number) => void;
  readonly nextPage: () => void;
  readonly prevPage: () => void;
  readonly resetPage: () => void;
}

export function usePagination<T>(
  items: readonly T[],
  options?: UsePaginationOptions
): UsePaginationReturn<T> {
  const [pageSize, setPageSizeState] = useState<number>(
    options?.initialPageSize ?? 10
  );
  const [currentPage, setCurrentPage] = useState<number>(
    options?.initialPage ?? 1
  );

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Automatically clamp current page if items list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const startItem = totalItems === 0 ? 0 : startIndex + 1;
  const endItem = endIndex;

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    startItem,
    endItem,
    setCurrentPage,
    setPageSize,
    nextPage,
    prevPage,
    resetPage,
  };
}

// ============================================================================
// 2. Component: Pagination
// ============================================================================

export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly totalItems?: number;
  readonly pageSize?: number;
  readonly onPageSizeChange?: (size: number) => void;
  readonly pageSizeOptions?: readonly number[];
  readonly itemLabel?: string;
  readonly className?: string;
  readonly id?: string;
  readonly showFirstLast?: boolean;
}

/**
 * Generates an array of page numbers and ellipsis tokens for readable pagination navigation.
 * E.g. [1, 2, '...', 5, 6, 7, '...', 10]
 */
function getPaginationRange(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | "..."> = [];
  const showLeftEllipsis = currentPage > 4;
  const showRightEllipsis = currentPage < totalPages - 3;

  pages.push(1);

  if (showLeftEllipsis) {
    pages.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (showRightEllipsis) {
    pages.push("...");
  }

  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  itemLabel,
  className = "",
  id,
  showFirstLast = false,
}: PaginationProps): React.ReactElement | null {
  const { t } = useTranslator();

  // If there's 1 or 0 pages and no page size options, still show summary if totalItems is passed
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) {
    return null;
  }

  const pagesRange = getPaginationRange(currentPage, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const resolvedLabel = itemLabel ?? t("common.pagination.defaultLabel");

  const startItem =
    totalItems !== undefined && pageSize !== undefined
      ? totalItems === 0
        ? 0
        : (currentPage - 1) * pageSize + 1
      : undefined;
  const endItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  return (
    <nav
      id={id}
      role="navigation"
      aria-label="Pagination"
      className={`flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3 ${className}`}
    >
      {/* Left: Summary Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {startItem !== undefined && endItem !== undefined && totalItems !== undefined ? (
          <span className="font-medium text-white/80">
            {t("common.pagination.showing", {
              start: startItem,
              end: endItem,
              total: totalItems,
              label: resolvedLabel,
            })}
          </span>
        ) : (
          <span className="font-medium text-white/80">
            {t("common.pagination.page", {
              current: currentPage,
              total: totalPages,
            })}
          </span>
        )}

        {/* Optional Page Size Selector */}
        {pageSize !== undefined && onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <label
              htmlFor={id ? `${id}-pagesize-select` : undefined}
              className="text-[11px] text-white/60"
            >
              {t("common.pagination.perPage")}
            </label>
            <select
              id={id ? `${id}-pagesize-select` : undefined}
              aria-label={t("common.pagination.perPage")}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-primary/30 bg-surface-elevated px-2 py-1 text-xs font-semibold text-white transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center justify-between gap-1 sm:justify-end">
        {/* First Page button (Optional) */}
        {showFirstLast && (
          <button
            type="button"
            disabled={isFirstPage}
            onClick={() => onPageChange(1)}
            aria-label="First page"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface-elevated/60 text-white/80 transition hover:border-primary/60 hover:bg-primary-solid/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}

        {/* Previous Button */}
        <button
          type="button"
          disabled={isFirstPage}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={t("common.pagination.previous")}
          className="flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-surface-elevated/60 px-3 text-xs font-semibold text-white/90 transition hover:border-primary/60 hover:bg-primary-solid/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t("common.pagination.previous")}</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pagesRange.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs font-bold text-white/40"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "border border-primary/80 bg-primary-solid text-white shadow-[0_2px_12px_rgba(103,102,255,0.4)]"
                    : "border border-white/10 bg-surface-elevated/60 text-white/80 hover:border-primary/50 hover:bg-primary-solid/20 hover:text-white"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={t("common.pagination.next")}
          className="flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-surface-elevated/60 px-3 text-xs font-semibold text-white/90 transition hover:border-primary/60 hover:bg-primary-solid/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="hidden sm:inline">{t("common.pagination.next")}</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page button (Optional) */}
        {showFirstLast && (
          <button
            type="button"
            disabled={isLastPage}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface-elevated/60 text-white/80 transition hover:border-primary/60 hover:bg-primary-solid/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </nav>
  );
}

