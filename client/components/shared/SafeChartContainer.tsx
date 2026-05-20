"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Prevents the Recharts "width(-1)/height(-1) should be greater than 0"
 * warning by deferring chart rendering until the container has measurable
 * positive dimensions.
 *
 * How it works:
 *  - Renders the outer div immediately (preserves layout / stable height).
 *  - Attaches a ResizeObserver to that div.
 *  - Only mounts children once width > 0 AND height > 0 are confirmed.
 *  - Disconnects the observer after the first positive measurement (one-shot).
 *
 * This avoids both SSR rendering (no DOM) and the first-client-render cycle
 * where Recharts' own ResizeObserver hasn't fired yet.
 *
 * Note on the lint rule react-hooks/set-state-in-effect:
 *  The rule fires for *synchronous* setState inside an effect body.
 *  setReady() here is called inside a ResizeObserver callback — an async
 *  browser callback, not synchronous in the effect body — so the rule
 *  does not apply.
 */
export function SafeChartContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setReady(true);
        ro.disconnect(); // one-shot: stop observing once dimensions are known
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {ready ? children : null}
    </div>
  );
}
