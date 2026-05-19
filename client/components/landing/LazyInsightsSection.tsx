"use client";

import dynamic from "next/dynamic";

const InsightsSectionDynamic = dynamic(
  () => import("@/components/landing/InsightsSection").then((m) => ({ default: m.InsightsSection })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-96 border-y border-white/70 bg-[#035034]/3" aria-hidden="true" />
    ),
  },
);

export function LazyInsightsSection() {
  return <InsightsSectionDynamic />;
}
