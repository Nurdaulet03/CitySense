"use client";

import { useEffect } from "react";

/**
 * Globally suppresses async errors originating from the Yandex Maps JS API.
 *
 * The Yandex Maps library registers internal listeners that keep firing even
 * after the React component that created the map is unmounted (e.g. when the
 * user navigates to another page). Those late-firing callbacks access internal
 * tile-layer state that has already been torn down, producing errors like
 * `Cannot read properties of null (reading '1')` inside `selectValue` /
 * `setTileUrlTemplate`. Without suppression those errors bubble up to the
 * Next.js app shell and trigger "Application error: a client-side exception
 * has occurred" on the whole site.
 *
 * We filter strictly by script source and message signature so real app errors
 * are not silenced.
 */
export function GlobalErrorSuppressor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isYandexError = (msg: string, src: string) => {
      return (
        src.includes("api-maps.yandex") ||
        src.includes("yastatic.net") ||
        msg.includes("selectValue") ||
        msg.includes("setTileUrlTemplate") ||
        msg.includes("_setLayerUrl") ||
        msg.includes("_setLayersUrl") ||
        msg.includes("_updateLayers")
      );
    };

    const onError = (event: ErrorEvent) => {
      const msg = event.message || "";
      const src = event.filename || "";
      const stack = event.error?.stack || "";
      if (isYandexError(msg, src) || isYandexError(stack, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        if (process.env.NODE_ENV !== "production") {
          console.warn("[GlobalErrorSuppressor] Yandex Maps error muted:", msg);
        }
        return true;
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || "");
      const stack = event.reason?.stack || "";
      if (isYandexError(reason, stack) || isYandexError(stack, stack)) {
        event.preventDefault();
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[GlobalErrorSuppressor] Yandex Maps rejection muted:",
            reason
          );
        }
      }
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection, true);

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection, true);
    };
  }, []);

  return null;
}
