"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const KEY     = process.env.NEXT_PUBLIC_POSTHOG_KEY     ?? "";
const HOST    = process.env.NEXT_PUBLIC_POSTHOG_HOST    ?? "https://us.i.posthog.com";
const ENABLED = process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true";

// Session replay is blocked on sensitive pages even when tracking is enabled
const REPLAY_BLOCKED_PREFIXES = [
  "/pay",
  "/payment",
  "/login",
  "/register",
  "/dashboard/profile",
];

function ReplayGuard() {
  const pathname = usePathname();
  useEffect(() => {
    const blocked = REPLAY_BLOCKED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );
    if (blocked) {
      posthog.stopSessionRecording();
    } else {
      posthog.startSessionRecording();
    }
  }, [pathname]);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!ENABLED || !KEY) return;
    posthog.init(KEY, {
      api_host: HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      person_profiles: "identified_only",
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-sensitive]",
      },
    });
  }, []);

  if (!ENABLED || !KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <ReplayGuard />
      {children}
    </PHProvider>
  );
}
