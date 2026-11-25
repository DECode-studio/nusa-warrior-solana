"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBottomSheetGesture } from "./useBottomSheetGesture";

export interface BaseModalProps {
  readonly id?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: "sm" | "md" | "lg" | "xl" | "full";
  readonly className?: string;
  readonly containerClassName?: string;
  readonly zIndexClassName?: string;
  readonly closeOnBackdropClick?: boolean;
  readonly showCloseButton?: boolean;
  readonly ariaLabel?: string;
  /**
   * Behavior on mobile viewport (< 640px).
   * - "bottomsheet": Aligns to bottom edge as bottom sheet with rounded top corners and drag handle (default).
   * - "modal": Remains a centered modal dialog across all screen sizes.
   */
  readonly mobileBehavior?: "bottomsheet" | "modal";
  /**
   * Enables touch drag-to-dismiss gesture on mobile bottom sheet. Defaults to true.
   */
  readonly dragToDismiss?: boolean;
  /**
   * Shows top drag handle bar on mobile bottom sheet. Defaults to true.
   */
  readonly showDragHandle?: boolean;
  readonly footerClassName?: string;
}

const MODAL_SIZE_STYLES: Record<NonNullable<BaseModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[95vw] sm:max-w-7xl",
};

const BOTTOMSHEET_SIZE_STYLES: Record<NonNullable<BaseModalProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-[95vw] sm:max-w-7xl",
};

export function BaseModal({
  id,
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
  containerClassName = "",
  zIndexClassName = "z-[60]",
  closeOnBackdropClick = true,
  showCloseButton = true,
  ariaLabel,
  mobileBehavior = "bottomsheet",
  dragToDismiss = true,
  showDragHandle = true,
  footerClassName = "",
}: BaseModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const isBottomSheet = mobileBehavior === "bottomsheet";

  // Prevent SSR hydration mismatch when using React Portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Drag-to-dismiss gesture for mobile bottom sheet (< 640px)
  useBottomSheetGesture({
    enabled: isOpen && isBottomSheet && dragToDismiss,
    breakpoint: 640,
    dismissThreshold: 100,
    onClose,
    sheetRef: modalRef,
    contentRef,
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !isMounted) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const containerClasses = isBottomSheet
    ? `fixed inset-0 ${zIndexClassName} flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-md transition-opacity duration-300 sm:items-center sm:p-4 ${containerClassName}`
    : `fixed inset-0 ${zIndexClassName} flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md transition-opacity duration-300 ${containerClassName}`;

  const panelClasses = isBottomSheet
    ? `relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[24px] rounded-b-none border-t border-border-base bg-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-nc-bottomsheet sm:my-8 sm:max-h-[90vh] sm:rounded-[var(--radius-card)] sm:border sm:pb-0 sm:shadow-[0_25px_60px_rgba(0,0,0,0.8)] sm:animate-nc-modal ${BOTTOMSHEET_SIZE_STYLES[size]} ${className}`
    : `relative my-8 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-base bg-surface shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-nc-modal ${MODAL_SIZE_STYLES[size]} ${className}`;

  const modalElement = (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : ariaLabel || "Dialog Modal"}
      onClick={handleBackdropClick}
      className={containerClasses}
    >
      <div ref={modalRef} className={panelClasses}>
        {/* Mobile Bottom Sheet Drag Handle */}
        {isBottomSheet && showDragHandle && (
          <div
            data-drag-handle="true"
            aria-hidden="true"
            className="flex w-full cursor-grab justify-center pt-3 pb-1 select-none touch-none active:cursor-grabbing sm:hidden"
          >
            <div
              data-drag-handle="true"
              className="h-1.5 w-12 rounded-full bg-white/25 transition-colors hover:bg-white/40"
            />
          </div>
        )}

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex shrink-0 items-start justify-between border-b border-primary/20 px-5 py-4 sm:px-8 sm:py-5">
            <div className="pr-4">
              {title && (
                <div className="font-display text-xl font-bold tracking-wide text-white sm:text-2xl">
                  {title}
                </div>
              )}
              {description && (
                <p className="mt-1 text-xs text-cream/70 sm:text-sm">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Dialog"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 text-cream transition hover:border-primary hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6"
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={`flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-primary/20 bg-surface-elevated/60 px-5 py-3.5 sm:px-8 sm:py-4 ${footerClassName}`.trim()}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
