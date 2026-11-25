"use client";

import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface AdminFeedbackBannerProps {
  readonly id: string;
  readonly message: string;
  readonly variant: "success" | "error";
}

export function AdminFeedbackBanner({
  id,
  message,
  variant,
}: AdminFeedbackBannerProps): React.ReactElement {
  const isSuccess = variant === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      id={id}
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold text-white ${
        isSuccess
          ? "border-[#0DB561]/55 bg-[#0DB561]/15"
          : "border-rose-500/45 bg-rose-500/15"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${
          isSuccess ? "text-[#0DB561]" : "text-rose-300"
        }`}
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
