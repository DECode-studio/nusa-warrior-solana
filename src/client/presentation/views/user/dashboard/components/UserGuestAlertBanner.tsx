"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Badge, Button } from "@/client/presentation/components/ui";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";

export interface UserGuestAlertBannerProps {
  readonly isGuest?: boolean;
}

export function UserGuestAlertBanner({
  isGuest,
}: UserGuestAlertBannerProps): React.ReactElement | null {
  const { locale, t } = useTranslator();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const querySuccess = searchParams.get("success");

  const isConflict = queryError === "google_link_conflict";
  const isLinked = querySuccess === "account_linked";

  const handleLinkGoogle = (): void => {
    window.location.href = `${API_ROUTES.AUTH.GOOGLE}?action=link&lang=${encodeURIComponent(locale)}`;
  };

  if (!isGuest && !isLinked && !isConflict) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Feedback if account link succeeded */}
      {isLinked && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald/20 bg-emerald/10 p-4 text-sm text-emerald-light backdrop-blur-md"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-light" aria-hidden="true" />
          <p className="flex-1 font-medium">
            {t("userGuest.accountLinked")}
          </p>
        </div>
      )}

      {/* Feedback if conflict occurred */}
      {isConflict && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger-light backdrop-blur-md"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-danger-light" aria-hidden="true" />
          <p className="flex-1 font-medium">
            {t("userGuest.linkConflict")}
          </p>
        </div>
      )}

      {/* Guest Account Expiry Warning & Link CTA */}
      {isGuest && (
        <div
          role="region"
          aria-label={t("userGuest.regionLabel")}
          className="relative overflow-hidden rounded-xl border border-amber/20 bg-surface-elevated/80 p-4 sm:p-5 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber/15 text-amber-light">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-bold tracking-wide text-amber-light">
                    {t("userGuest.title")}
                  </h2>
                  <Badge variant="amber" size="sm" icon={<Clock className="h-3 w-3" />}>
                    {t("userGuest.activeDuration")}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  {t("userGuest.expiryBody")}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="amber"
              size="sm"
              onClick={handleLinkGoogle}
              className="shrink-0"
            >
              {t("userGuest.linkButton")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

