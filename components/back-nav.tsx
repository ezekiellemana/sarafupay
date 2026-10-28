"use client";

import { useEffect } from "react";

/**
 * A page restored from the browser's back-forward cache comes back exactly as it was left, so a pay
 * button frozen on "Sending…" stays frozen. Reload such a page so it is usable again.
 */
export function useFreshOnBack() {
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
}

/**
 * Makes the browser's Back button leave a payment screen for `href` (the collection), instead of
 * stepping back into PayPal's finished checkout or a form that was already sent.
 */
export function BackTo({ href }: { href: string }) {
  useEffect(() => {
    const st = (window.history.state ?? {}) as Record<string, unknown>;
    if (!st.__backTo) window.history.pushState({ ...st, __backTo: href }, "");
    const onPop = () => {
      const now = (window.history.state ?? {}) as Record<string, unknown>;
      if (!now.__backTo) window.location.replace(href);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [href]);
  return null;
}
