import React from "react";

export interface BadgeProps {
  readonly children: React.ReactNode;
  readonly variant?:
    | "primary"
    | "amber"
    | "emerald"
    | "neutral"
    | "danger";
  readonly size?: "sm" | "md";
  readonly shape?: "rounded" | "pill";
  readonly uppercase?: boolean;
  readonly icon?: React.ReactNode;
  readonly className?: string;
  readonly id?: string;
}

const VARIANT_STYLES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  primary: "bg-primary/15 text-primary-light",
  amber: "bg-amber/15 text-amber-light",
  emerald: "bg-emerald/15 text-emerald-light",
  neutral: "bg-surface-muted text-cream",
  danger: "bg-danger/15 text-danger-light",
};

const SIZE_STYLES: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs gap-1 font-medium",
  md: "px-2.5 py-1 text-xs sm:text-sm gap-1.5 font-semibold",
};

const SHAPE_STYLES: Record<NonNullable<BadgeProps["shape"]>, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
};

export function Badge({
  children,
  variant = "primary",
  size = "md",
  shape = "rounded",
  uppercase = false,
  icon,
  className = "",
  id,
}: BadgeProps): React.ReactElement {
  return (
    <span
      id={id}
      className={`inline-flex max-w-full min-w-0 items-center transition-colors select-none ${
        uppercase ? "uppercase tracking-wide" : "tracking-normal"
      } ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${SHAPE_STYLES[shape]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
