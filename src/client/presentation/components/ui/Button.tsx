import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export interface ButtonProps {
  readonly children: React.ReactNode;
  readonly href?: string;
  readonly variant?:
    | "primary"
    | "secondary"
    | "amber"
    | "emerald"
    | "dark"
    | "outline"
    | "ghost"
    | "danger";
  readonly size?: "xs" | "sm" | "md" | "lg";
  readonly shape?: "pill" | "rounded";
  readonly type?: "button" | "submit" | "reset";
  readonly disabled?: boolean;
  readonly isLoading?: boolean;
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  readonly className?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly id?: string;
  readonly ariaLabel?: string;
  readonly ariaPressed?: boolean;
  readonly ariaSelected?: boolean;
  readonly role?: string;
  readonly target?: string;
  readonly rel?: string;
}

const VARIANT_STYLES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary-solid text-white hover:bg-primary active:bg-primary-solid",
  secondary:
    "bg-surface-elevated text-cream border border-border-base hover:bg-surface-muted hover:border-border-strong hover:text-white",
  amber:
    "bg-amber text-surface-base font-bold hover:bg-amber-hover active:bg-amber",
  emerald:
    "bg-emerald text-surface-base font-bold hover:bg-emerald-hover active:bg-emerald",
  dark:
    "bg-surface text-cream border border-border-subtle hover:border-border-base hover:bg-surface-elevated hover:text-white",
  outline:
    "bg-transparent text-cream border border-border-base hover:border-border-strong hover:bg-surface-muted hover:text-white",
  ghost:
    "bg-transparent text-muted hover:text-white hover:bg-surface-muted",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
};

const SIZE_STYLES: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "min-h-8 px-2.5 py-1 text-xs gap-1.5",
  sm: "min-h-9 px-3.5 py-1.5 text-xs sm:text-sm gap-2",
  md: "min-h-11 px-5 py-2 text-sm sm:text-base gap-2.5",
  lg: "min-h-12 px-6 py-3 text-base sm:text-lg gap-3",
};

const SHAPE_STYLES: Record<NonNullable<ButtonProps["shape"]>, string> = {
  rounded: "rounded-[var(--radius-control)]",
  pill: "rounded-full",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  shape = "rounded",
  type = "button",
  disabled = false,
  isLoading = false,
  onClick,
  className = "",
  leftIcon,
  rightIcon,
  id,
  ariaLabel,
  ariaPressed,
  ariaSelected,
  role,
  target,
  rel,
}: ButtonProps): React.ReactElement {
  const isButtonDisabled = disabled || isLoading;

  const baseClasses = `inline-flex items-center justify-center font-display font-bold tracking-wide transition-colors duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base select-none ${
    VARIANT_STYLES[variant]
  } ${SIZE_STYLES[size]} ${SHAPE_STYLES[shape]} ${
    isButtonDisabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer"
  } ${className}`;

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {typeof children === "string" || typeof children === "number" ? (
        <span className="truncate">{children}</span>
      ) : (
        children
      )}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </>
  );

  if (href && !isButtonDisabled) {
    return (
      <Link
        id={id}
        href={href}
        target={target}
        rel={rel}
        className={baseClasses}
        aria-label={ariaLabel}
        aria-selected={ariaSelected}
        role={role}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      id={id}
      type={type}
      disabled={isButtonDisabled}
      onClick={onClick}
      className={baseClasses}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-selected={ariaSelected}
      role={role}
    >
      {content}
    </button>
  );
}
