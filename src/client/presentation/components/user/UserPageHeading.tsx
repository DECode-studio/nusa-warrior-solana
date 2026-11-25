import React from "react";
import { IntellioCard } from "@/client/presentation/components/ui";

export interface UserPageHeadingProps {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly eyebrow?: React.ReactNode;
  readonly eyebrowVariant?: "primary" | "amber" | "emerald" | "neutral";
  readonly actions?: React.ReactNode;
  readonly className?: string;
  readonly variant?: "default" | "hero";
}

const EYEBROW_VARIANT_STYLES: Record<
  NonNullable<UserPageHeadingProps["eyebrowVariant"]>,
  string
> = {
  primary: "bg-primary/15 text-primary-light",
  amber: "bg-amber/15 text-amber-light",
  emerald: "bg-emerald/15 text-emerald-light",
  neutral: "bg-surface-muted text-cream",
};

export function UserPageHeading({
  title,
  description,
  eyebrow,
  eyebrowVariant = "primary",
  actions,
  className = "",
  variant = "default",
}: UserPageHeadingProps): React.ReactElement {
  const panelClass =
    variant === "hero"
      ? "border-border-strong bg-gradient-to-br from-[#17123D] via-[#100A30] to-[#0B0622]"
      : "border-border-base";

  return (
    <IntellioCard
      as="section"
      variant="elevated"
      padding="sm"
      className={`flex flex-wrap items-center justify-between gap-4 sm:p-6 ${panelClass} ${className}`}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div
            className={`mb-2 inline-flex max-w-full items-center rounded-md px-2.5 py-0.5 font-display text-xs font-semibold ${EYEBROW_VARIANT_STYLES[eyebrowVariant]}`}
          >
            <span className="truncate">{eyebrow}</span>
          </div>
        ) : null}
        <h2 className="nc-type-section-title font-display font-bold text-white">
          {title}
        </h2>
        {description ? (
          <p className="nc-type-body-sm mt-2 max-w-3xl text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          {actions}
        </div>
      ) : null}
    </IntellioCard>
  );
}
