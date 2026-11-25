import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

export interface PillButtonProps {
  readonly children: React.ReactNode;
  readonly href?: string;
  readonly variant?: "primary" | "outline" | "amber" | "emerald" | "dark";
  readonly size?: "sm" | "md" | "lg";
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
  readonly showArrow?: boolean;
  readonly id?: string;
}

const SIZE_MAP: Record<
  NonNullable<PillButtonProps["size"]>,
  ButtonProps["size"]
> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

export function PillButton({
  children,
  href,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  showArrow = false,
  id,
}: PillButtonProps): React.ReactElement {
  return (
    <Button
      id={id}
      href={href}
      variant={variant}
      size={SIZE_MAP[size]}
      shape="pill"
      type={type}
      disabled={disabled}
      onClick={onClick}
      rightIcon={
        showArrow ? (
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        ) : undefined
      }
      className={`tracking-wide ${className}`}
    >
      {children}
    </Button>
  );
}
