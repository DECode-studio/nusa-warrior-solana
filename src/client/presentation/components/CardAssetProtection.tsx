"use client";

import { useEffect } from "react";

/** Discourages casual saving/dragging of card artwork in the browser. */
export function CardAssetProtection(): null {
  useEffect(() => {
    const isCardArtwork = (target: EventTarget | null): boolean =>
      target instanceof HTMLImageElement &&
      new URL(target.currentSrc || target.src, window.location.href).pathname.startsWith(
        "/cards/"
      );

    const preventArtworkAction = (event: Event): void => {
      if (isCardArtwork(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventArtworkAction, true);
    document.addEventListener("dragstart", preventArtworkAction, true);

    return () => {
      document.removeEventListener("contextmenu", preventArtworkAction, true);
      document.removeEventListener("dragstart", preventArtworkAction, true);
    };
  }, []);

  return null;
}
