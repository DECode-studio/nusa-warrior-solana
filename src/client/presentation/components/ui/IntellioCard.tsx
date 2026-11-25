import React from "react";

export interface IntellioCardProps {
  readonly children: React.ReactNode;
  readonly variant?:
    | "default"
    | "elevated"
    | "interactive"
    | "glass"
    | "outline"
    | "flat";
  readonly padding?: "none" | "xs" | "sm" | "md" | "lg";
  readonly className?: string;
  readonly onClick?: () => void;
  readonly id?: string;
  readonly role?: string;
  readonly ariaPressed?: boolean;
  readonly ariaLive?: "off" | "polite" | "assertive";
  readonly as?: "div" | "article" | "section";
  readonly overflow?: "hidden" | "visible" | "auto";
}

const VARIANT_STYLES: Record<
  NonNullable<IntellioCardProps["variant"]>,
  string
> = {
  default:
    "bg-surface border border-border-base shadow-[0_12px_36px_rgba(8,2,32,0.6)] text-white",
  elevated:
    "bg-surface-elevated border border-border-base shadow-[0_16px_40px_rgba(103,102,255,0.12)] text-white",
  interactive:
    "bg-surface border border-border-base shadow-[0_12px_36px_rgba(8,2,32,0.6)] text-white transition-all duration-300 hover:border-border-strong hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(103,102,255,0.22)] cursor-pointer focus-within:border-border-strong",
  glass:
    "bg-surface-elevated/80 backdrop-blur-md border border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.5)] text-white",
  outline:
    "bg-transparent border border-white/15 text-white hover:border-border-strong transition-colors",
  flat: "bg-surface text-white",
};

const PADDING_STYLES: Record<NonNullable<IntellioCardProps["padding"]>, string> = {
  none: "p-0",
  xs: "p-3 sm:p-4",
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10 lg:p-12",
};

export function IntellioCard({
  children,
  variant = "default",
  padding = "md",
  overflow = "hidden",
  className = "",
  onClick,
  id,
  role,
  ariaPressed,
  ariaLive,
  as: Component = "div",
}: IntellioCardProps): React.ReactElement {
  const isInteractive = variant === "interactive" || Boolean(onClick);
  const resolvedVariantClass =
    isInteractive && variant === "default"
      ? VARIANT_STYLES.interactive
      : VARIANT_STYLES[variant];

  const overflowClass =
    overflow === "visible"
      ? "overflow-visible"
      : overflow === "auto"
        ? "overflow-auto"
        : "overflow-hidden";

  return (
    <Component
      id={id}
      role={role ?? (onClick ? "button" : undefined)}
      aria-pressed={ariaPressed}
      aria-live={ariaLive}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event: React.KeyboardEvent<HTMLElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative ${overflowClass} rounded-[var(--radius-card)] ${resolvedVariantClass} ${PADDING_STYLES[padding]} ${className}`}
    >
      {children}
    </Component>
  );
}

