"use client";

import { useEffect } from "react";

/**
 * Page-wide scroll motion, mounted once per public page:
 * - [data-reveal] blocks rise and un-tilt into place the first time they enter the screen
 *   (delay with style="--rd: .1s");
 * - [data-depth] elements drift against the scroll (--sp runs -1 → 1 as they cross the screen),
 *   so each section has its own layer of depth.
 * Nothing is hidden until this has run, and reduced motion turns it all off.
 */
export function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const doc = document.documentElement;
    doc.classList.add("fx");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    const reveal = Array.from(document.querySelectorAll("[data-reveal]"));
    reveal.forEach((el) => {
      // Already on screen at load: show without the entrance.
      if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add("is-in");
      else io.observe(el);
    });

    const depth = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = innerHeight;
      for (const el of depth) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.setProperty("--sp", Math.max(-1, Math.min(1, p)).toFixed(3));
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      doc.classList.remove("fx");
    };
  }, []);
  return null;
}
