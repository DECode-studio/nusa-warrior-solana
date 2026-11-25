"use client";

import React from "react";

export interface AdminRequestStateProps {
  readonly loading: boolean;
  readonly error: string | null;
  readonly loadingId: string;
  readonly errorId: string;
  readonly retryId: string;
  readonly loadingMessage: string;
  readonly errorTitle: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}

export function AdminRequestState({
  loading,
  error,
  loadingId,
  errorId,
  retryId,
  loadingMessage,
  errorTitle,
  retryLabel,
  onRetry,
}: AdminRequestStateProps): React.ReactElement | null {
  if (loading) {
    return (
      <div
        id={loadingId}
        role="status"
        aria-live="polite"
        className="rounded-[24px] border border-[rgba(103,102,255,0.25)] bg-[#0F0927]/95 p-12 text-center"
      >
        <p className="font-display text-lg font-bold text-white">
          {loadingMessage}
        </p>
      </div>
    );
  }

  if (!error) return null;

  return (
    <div
      id={errorId}
      role="alert"
      className="rounded-[24px] border border-rose-500/45 bg-[#0F0927]/95 p-8 text-center"
    >
      <p className="font-display text-lg font-bold text-white">{errorTitle}</p>
      <p className="mt-1 text-xs text-[#CFCBE2]">{error}</p>
      <button
        id={retryId}
        type="button"
        onClick={onRetry}
        className="nc-btn-primary mt-4 px-5 py-2 text-xs cursor-pointer"
      >
        {retryLabel}
      </button>
    </div>
  );
}
