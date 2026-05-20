"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const KEY     = process.env.NEXT_PUBLIC_POSTHOG_KEY     ?? "";
const HOST    = process.env.NEXT_PUBLIC_POSTHOG_HOST    ?? "https://us.i.posthog.com";
const ENABLED = process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true";

// Sensitive paths — query params are stripped entirely before tracking,
// and session replay is blocked on these pages.
const SENSITIVE_PREFIXES = [
  "/pay",
  "/payment",
  "/login",
  "/register",
  "/dashboard/profile",
];

// The only query params we ever forward to PostHog.
// Everything else (auth codes, payment refs, callback tokens, error strings) is dropped.
const SAFE_UTM_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

// ── Pageview tracker ────────────────────────────────────────────────────────
// Fires one safe $pageview per route change.
// Wrapped in <Suspense> in the provider because useSearchParams requires it
// in Next.js App Router SSR (the Suspense boundary defers it to the client).
function PageviewTracker() {
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  // Use the serialised string as the effect dependency so we only re-fire
  // when params actually change, not on every object reference refresh.
  const searchString = searchParams.toString();

  useEffect(() => {
    const origin    = window.location.origin;
    const sensitive = SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p));

    let url: string;
    if (sensitive) {
      // Sensitive page — track clean path only, no query params at all.
      // This prevents leaking payment references, auth error codes, OAuth
      // state tokens, or any other params that appear on these routes.
      url = `${origin}${pathname}`;
    } else {
      // Non-sensitive page — keep only safe UTM attribution params.
      const safe = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (SAFE_UTM_PARAMS.has(key)) safe.set(key, value);
      });
      const qs = safe.toString();
      url = qs ? `${origin}${pathname}?${qs}` : `${origin}${pathname}`;
    }

    // PostHog fills in referrer, device, browser etc. automatically.
    // We only pass $current_url so that the sanitised URL is recorded,
    // not the raw window.location.href which may contain sensitive params.
    posthog.capture("$pageview", { $current_url: url });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchString]);

  return null;
}

// ── Session replay guard ────────────────────────────────────────────────────
// Stops recording when the user navigates to a sensitive page and
// restarts it when they navigate away.
function ReplayGuard() {
  const pathname = usePathname();
  useEffect(() => {
    const blocked = SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p));
    if (blocked) posthog.stopSessionRecording();
    else posthog.startSessionRecording();
  }, [pathname]);
  return null;
}

// ── Provider ────────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!ENABLED || !KEY) return;
    posthog.init(KEY, {
      api_host: HOST,
      // ── Privacy & scope constraints ───────────────────────────────────────
      autocapture: false,                // we control exactly what is tracked
      capture_pageview: false,           // fired manually by PageviewTracker
      capture_pageleave: false,
      person_profiles: "identified_only",
      // ── Disable features we are not using (reduces network requests) ──────
      // disable_session_recording confirmed in @posthog/types PostHogConfig
      disable_session_recording: true,
      // disable_surveys confirmed in @posthog/types PostHogConfig
      disable_surveys: true,
      // advanced_disable_flags confirmed in @posthog/types — prevents
      // /flags and /decide calls we do not need (no feature flags in use)
      advanced_disable_flags: true,
      // capture_heatmaps confirmed in @posthog/types as boolean | HeatmapConfig
      capture_heatmaps: false,
      // ── Session replay config (applies when recording is re-enabled later) ─
      session_recording: {
        maskAllInputs: true,                     // mask every input field
        maskTextSelector: "[data-sensitive]",    // mask data-sensitive elements
      },
    });
  }, []);

  // When tracking is disabled or no key is set, render children with zero
  // PostHog code active — no init, no network requests, no cookies.
  if (!ENABLED || !KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      {/* Suspense required by Next.js App Router when useSearchParams is
          used in a component that participates in server rendering */}
      <Suspense>
        <PageviewTracker />
      </Suspense>
      <ReplayGuard />
      {children}
    </PHProvider>
  );
}
