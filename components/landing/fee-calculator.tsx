"use client";

import { useEffect, useRef, useState } from "react";
import { quotePayment, quotePayout, type Rates } from "@/lib/pricing";

const STEPS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000];
const tzs = (cents: number) => `TZS ${Math.round(cents / 100).toLocaleString("en-US")}`;

/** Number that rolls to its new value instead of jumping (transform-free, text only). */
function Rolling({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 380);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{tzs(shown)}</>;
}

/**
 * Drag the total a collection raises; see each fee and what the organiser finally receives
 * after one withdrawal to mobile money. Uses the live rates from the server.
 */
export function FeeCalculator({ rates }: { rates: Rates }) {
  const [i, setI] = useState(6);
  const gross = STEPS[i] * 100;
  const pay = quotePayment(rates, "snippe", gross);
  const out = quotePayout(rates, "mobile_money", pay.netCents);
  const kept = (out.netCents / gross) * 100;

  const rows: [string, number, string][] = [
    ["Snippe collection fee", pay.providerFeeCents, "bg-terracotta"],
    ["SarafuPay fee", pay.sarafuFeeCents, "bg-marigold"],
    ["Snippe transfer fee", out.providerFeeCents, "bg-terracotta/70"],
    ["SarafuPay payout fee", out.sarafuFeeCents, "bg-marigold/70"],
  ];

  return (
    <div className="calc grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <label htmlFor="calc-amount" className="text-sm font-medium text-paper/80">
          Your collection raises
        </label>
        <p className="font-display mt-1 text-5xl font-semibold tracking-tight text-paper sm:text-6xl">
          <Rolling value={gross} />
        </p>
        <input
          id="calc-amount"
          type="range"
          min={0}
          max={STEPS.length - 1}
          step={1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          aria-valuetext={tzs(gross)}
          className="calc-range mt-6 w-full"
          style={{ "--fill": `${(i / (STEPS.length - 1)) * 100}%` } as React.CSSProperties}
        />
        <div className="mt-2 flex justify-between font-mono text-xs text-paper/60">
          <span>TZS 10K</span>
          <span>TZS 20M</span>
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-paper/75">
          Friends pay exactly what they give by mobile money. The fees come out of the collection, and every one of them is
          on the receipt.
        </p>
      </div>

      <div className="rounded-[1.6rem] border border-paper/15 bg-paper/[0.06] p-5 sm:p-6">
        <ul className="space-y-3">
          {rows.map(([label, cents, dot]) => (
            <li key={label} className="flex items-center justify-between gap-3 text-sm text-paper/80">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
                {label}
              </span>
              <span className="font-mono">− <Rolling value={cents} /></span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-paper/15 pt-5">
          <p className="text-sm text-paper/70">Organiser receives on their phone</p>
          <p className="font-display mt-1 text-4xl font-semibold text-marigold">
            <Rolling value={out.netCents} />
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper/10" aria-hidden>
            <div className="h-full rounded-full bg-marigold transition-[width] duration-500" style={{ width: `${kept}%` }} />
          </div>
          <p className="mt-2 text-xs text-paper/60">{kept.toFixed(1)}% of everything raised, after one withdrawal.</p>
        </div>
      </div>
    </div>
  );
}
