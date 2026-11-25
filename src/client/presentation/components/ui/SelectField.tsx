import React from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly options?: readonly SelectOption[];
  readonly sizeVariant?: "sm" | "md";
  readonly containerClassName?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      options,
      children,
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
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const sizeClasses =
      sizeVariant === "sm"
        ? "h-10 px-3 text-xs"
        : "h-11 px-4 text-sm";

    const paddingWithIcon = leftIcon ? "pl-10" : "pl-4";

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
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

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            className={`w-full appearance-none rounded-xl border bg-surface-elevated pr-10 font-sans text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
              error
                ? "border-danger/80 focus:border-danger focus:ring-danger/30"
                : "border-primary/25 hover:border-primary/50 focus:border-primary"
            } ${sizeClasses} ${paddingWithIcon} ${className}`}
            {...restProps}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-surface-elevated text-white"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="pointer-events-none absolute right-3 flex items-center justify-center text-cream/60">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
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

SelectField.displayName = "SelectField";

