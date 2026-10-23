"use client";

import { useRef } from "react";

/** A card that leans toward the pointer with a moving highlight. Touch and reduced motion: flat. */
export function TiltCard({ children, className = "", fill = true }: { children: React.ReactNode; className?: string; fill?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ty", `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tx", "0deg");
    el.style.setProperty("--ty", "0deg");
  };
  return (
    <div style={{ perspective: "900px" }} className={fill ? "h-full" : ""}>
      <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`tilt-card ${fill ? "h-full" : ""} ${className}`}>
        {children}
      </div>
    </div>
  );
}
