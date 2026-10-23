"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/**
 * A horizontal, swipeable row of cards. Phones see one card and a peek of the next; desktops see
 * two or three with arrow buttons. Each card leans in 3D by its distance from the centre while the
 * row scrolls. Dots show the position.
 */
export function Belt({ children, cols = 3, label }: { children: React.ReactNode; cols?: 2 | 3; label: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [ends, setEnds] = useState({ start: true, end: false });
  const items = Children.toArray(children);

  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    const overflow = el.scrollWidth > el.clientWidth + 8;
    let best = 0;
    let bestD = Infinity;
    Array.from(el.children).forEach((c, k) => {
      const r = (c as HTMLElement).getBoundingClientRect();
      const off = overflow ? Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / box.width)) : 0;
      (c as HTMLElement).style.setProperty("--rot", `${(-off * 16).toFixed(2)}deg`);
      (c as HTMLElement).style.setProperty("--sc", (1 - Math.abs(off) * 0.06).toFixed(3));
      const d = Math.abs(r.left - box.left);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    setAt(best);
    setEnds({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnds({ start: true, end: el.scrollWidth <= el.clientWidth + 8 });
      return;
    }
    let raf = 0;
    const on = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), update()));
    };
    update();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [update]);

  const go = (dir: number) => {
    const el = row.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    el.scrollBy({ left: dir * (first.offsetWidth + 16), behavior: "smooth" });
  };

  return (
    <div>
      <div ref={row} className={`belt ${cols === 2 ? "cols-2" : ""}`} role="list" aria-label={label}>
        {items.map((c, k) => (
          <div key={k} role="listitem">
            {c}
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-between px-5 lg:px-0 ${ends.start && ends.end ? "invisible h-0" : ""}`}>
        <div className="flex gap-1.5" aria-hidden>
          {items.map((_, k) => (
            <span key={k} className={`belt-dot ${k === at ? "on" : ""}`} />
          ))}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" className="belt-btn" onClick={() => go(-1)} disabled={ends.start} aria-label="Previous">
            ←
          </button>
          <button type="button" className="belt-btn" onClick={() => go(1)} disabled={ends.end} aria-label="Next">
            →
          </button>
        </div>
      </div>
    </div>
  );
}
