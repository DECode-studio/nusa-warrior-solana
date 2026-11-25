"use client";

import { useEffect, useRef } from "react";

export interface UseBottomSheetGestureOptions {
  readonly enabled?: boolean;
  readonly breakpoint?: number;
  readonly dismissThreshold?: number;
  readonly onClose: () => void;
  readonly sheetRef: React.RefObject<HTMLDivElement | null>;
  readonly contentRef?: React.RefObject<HTMLDivElement | null>;
}

export function useBottomSheetGesture({
  enabled = true,
  breakpoint = 640,
  dismissThreshold = 100,
  onClose,
  sheetRef,
  contentRef,
}: UseBottomSheetGestureOptions): void {
  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const currentTranslateYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isClosingRef = useRef<boolean>(false);
  const dragSourceRef = useRef<"handle" | "content" | "none">("none");

  // Keep latest onClose in ref to avoid re-binding listeners on identity changes
  const onCloseRef = useRef<() => void>(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!enabled) return;

    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    const isInteractiveElement = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const interactiveTagNames = ["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"];
      return interactiveTagNames.includes(target.tagName) || !!target.closest("button, a, input, textarea, select");
    };

    const handleTouchStart = (event: TouchEvent): void => {
      if (window.innerWidth >= breakpoint || isClosingRef.current) return;
      if (event.touches.length !== 1) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Allow clicks on interactive elements without triggering drag start
      if (isInteractiveElement(target) && !target.hasAttribute("data-drag-handle")) {
        dragSourceRef.current = "none";
        return;
      }

      // Check if touching inside the scrollable content area
      if (contentRef?.current && contentRef.current.contains(target)) {
        if (contentRef.current.scrollTop > 0) {
          dragSourceRef.current = "none";
          return;
        }
        dragSourceRef.current = "content";
      } else {
        dragSourceRef.current = "handle";
      }

      startYRef.current = event.touches[0].clientY;
      startXRef.current = event.touches[0].clientX;
      startTimeRef.current = Date.now();
      isDraggingRef.current = false;
      currentTranslateYRef.current = 0;
    };

    const handleTouchMove = (event: TouchEvent): void => {
      if (dragSourceRef.current === "none" || window.innerWidth >= breakpoint || isClosingRef.current) {
        return;
      }
      if (event.touches.length !== 1) return;

      const currentY = event.touches[0].clientY;
      const currentX = event.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - startXRef.current;

      if (!isDraggingRef.current) {
        // Horizontal gesture priority: cancel vertical drag if moving horizontally
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          dragSourceRef.current = "none";
          return;
        }

        // Trigger dragging when moving downwards
        if (deltaY > 6) {
          if (dragSourceRef.current === "content" && contentRef?.current && contentRef.current.scrollTop > 0) {
            dragSourceRef.current = "none";
            return;
          }
          isDraggingRef.current = true;
          sheetEl.style.animation = "none";
          sheetEl.style.transition = "none";
        } else if (deltaY < -6) {
          // Dragging upwards: let normal content scroll happen
          dragSourceRef.current = "none";
          return;
        }
      }

      if (isDraggingRef.current) {
        if (deltaY > 0) {
          currentTranslateYRef.current = deltaY;
          sheetEl.style.transform = `translateY(${deltaY}px)`;
          if (event.cancelable) {
            event.preventDefault();
          }
        } else {
          // Upward rubber-band resistance
          const resisted = deltaY * 0.15;
          currentTranslateYRef.current = resisted;
          sheetEl.style.transform = `translateY(${resisted}px)`;
        }
      }
    };

    const handleTouchEnd = (): void => {
      if (!isDraggingRef.current) {
        dragSourceRef.current = "none";
        return;
      }

      isDraggingRef.current = false;
      dragSourceRef.current = "none";

      const deltaY = currentTranslateYRef.current;
      const elapsed = Date.now() - startTimeRef.current;
      const velocity = deltaY / Math.max(elapsed, 1);

      // Check if drag distance or velocity exceeds dismiss threshold
      const shouldDismiss = deltaY >= dismissThreshold || (velocity > 0.45 && deltaY > 35);

      if (shouldDismiss) {
        isClosingRef.current = true;
        sheetEl.style.transition = "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        sheetEl.style.transform = "translateY(100%)";

        window.setTimeout(() => {
          onCloseRef.current();
          isClosingRef.current = false;
          if (sheetEl) {
            sheetEl.style.transform = "";
            sheetEl.style.transition = "";
            sheetEl.style.animation = "";
          }
        }, 220);
      } else {
        // Snap back to normal resting position
        sheetEl.style.transition = "transform 0.25s cubic-bezier(0.2, 0.9, 0.4, 1)";
        sheetEl.style.transform = "translateY(0px)";

        window.setTimeout(() => {
          if (sheetEl && !isClosingRef.current) {
            sheetEl.style.transform = "";
            sheetEl.style.transition = "";
            sheetEl.style.animation = "";
          }
        }, 260);
      }
    };

    sheetEl.addEventListener("touchstart", handleTouchStart, { passive: true });
    sheetEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    sheetEl.addEventListener("touchend", handleTouchEnd, { passive: true });
    sheetEl.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      sheetEl.removeEventListener("touchstart", handleTouchStart);
      sheetEl.removeEventListener("touchmove", handleTouchMove);
      sheetEl.removeEventListener("touchend", handleTouchEnd);
      sheetEl.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, breakpoint, dismissThreshold, sheetRef, contentRef]);
}

