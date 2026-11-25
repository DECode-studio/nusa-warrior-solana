import React from "react";
import { AlertCircle } from "lucide-react";

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly containerClassName?: string;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      label,
      error,
      helperText,
      containerClassName = "",
      id,
      required,
      disabled,
      className = "",
      rows = 4,
      ...restProps
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 flex items-center justify-between text-xs font-bold text-cream"
          >
            <span>
              {label}
              {required && <span className="ml-1 text-amber">*</span>}
            </span>
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`w-full rounded-xl border bg-surface-elevated p-3 font-sans text-sm text-white placeholder-cream/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-danger/80 focus:border-danger focus:ring-danger/30"
              : "border-primary/25 hover:border-primary/50 focus:border-primary"
          } ${className}`}
          {...restProps}
        />

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

TextareaField.displayName = "TextareaField";

