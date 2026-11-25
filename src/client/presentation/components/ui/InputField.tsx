import React from "react";
import { AlertCircle } from "lucide-react";

export interface InputFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly sizeVariant?: "sm" | "md";
  readonly containerClassName?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      sizeVariant = "md",
      containerClassName = "",
      id,
      required,
      disabled,
      className = "",
      ...restProps
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const sizeClasses =
      sizeVariant === "sm"
        ? "h-10 px-3 text-xs"
        : "h-11 px-4 text-sm";

    const paddingWithIcons = `${leftIcon ? "pl-10" : ""} ${
      rightIcon ? "pr-10" : ""
    }`;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 flex items-center justify-between text-xs font-bold text-cream"
          >
            <span>
              {label}
              {required && <span className="ml-1 text-amber">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center justify-center text-cream/60">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`w-full rounded-xl border bg-surface-elevated font-sans text-white placeholder-cream/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
              error
                ? "border-danger/80 focus:border-danger focus:ring-danger/30"
                : "border-primary/25 hover:border-primary/50 focus:border-primary"
            } ${sizeClasses} ${paddingWithIcons} ${className}`}
            {...restProps}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center text-cream/60">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-light">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-cream/60">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";

