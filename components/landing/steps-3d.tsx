"use client";

import { useEffect, useRef } from "react";

export type Step = { n: string; title: string; body: string; chip: string };

/**
 * "How it works" as a deck of cards in 3D. While the section scrolls past, each card swings
 * up from a tilted stack into place. Scroll position is written to one CSS variable per card
 * (no React re-render per frame). Reduced motion: cards sit flat.
 */
export function Steps3D({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el?.style.setProperty("--settled", "1");
      return;
    }
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-step]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const c of cards) {
        const r = c.getBoundingClientRect();
        // 0 when the card's top is at the bottom of the screen, 1 when it reaches 55% height.
        const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.45)));
        c.style.setProperty("--p", p.toFixed(3));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={root} className="grid gap-6 md:grid-cols-3" style={{ perspective: "1200px" }}>
      {steps.map((s, i) => (
        <article key={s.n} data-step className="step-card" style={{ "--i": i } as React.CSSProperties}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-marigold">{s.n}</span>
            <span className="rounded-full border border-paper/20 px-3 py-1 text-xs text-paper/70">{s.chip}</span>
          </div>
          <h3 className="font-display mt-6 text-3xl font-semibold leading-tight">{s.title}</h3>
          <p className="mt-3 leading-relaxed text-paper/75">{s.body}</p>
        </article>
      ))}
    </div>
  );
}
