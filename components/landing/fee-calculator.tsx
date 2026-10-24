"use client";

import { useEffect, useRef, useState } from "react";
import { quotePayment, quotePayout, type Rates } from "@/lib/pricing";
import { fmt, friendly, type Visitor } from "@/lib/locale";

type Rail = "mobile" | "card";
const STEPS: Record<Rail, number[]> = {
  mobile: [10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000],
  card: [20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000],
};
const CUR: Record<Rail, string> = { mobile: "TZS", card: "USD" };
const show = (rail: Rail, cents: number) =>
  rail === "mobile"
    ? fmt("TZS", cents / 100)
    : `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const short = (rail: Rail, n: number) =>
  (rail === "mobile" ? "TZS " : "$") + new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

/** Number that rolls to its new value instead of jumping (transform-free, text only). */
function Rolling({ value, rail }: { value: number; rail: Rail }) {
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
  return <>{show(rail, shown)}</>;
}

/**
 * Drag the total a collection raises; see each fee and what the organiser finally receives
 * after one withdrawal. Two rails, with live rates from the server: mobile money in TZS
 * (Tanzania) and card in any currency, which PayPal settles in USD. Visitors outside Tanzania
 * start on card and also see the rough value in their own currency.
 */
export function FeeCalculator({ rates, v, perUsd }: { rates: Rates; v: Visitor; perUsd: number }) {
  const [rail, setRail] = useState<Rail>(v.mobileMoney ? "mobile" : "card");
  const [i, setI] = useState(6);
  const steps = STEPS[rail];
  const gross = steps[i] * 100;
  const pay = quotePayment(rates, rail === "mobile" ? "snippe" : "paypal", gross);
  const out = quotePayout(rates, rail === "mobile" ? "mobile_money" : "paypal", pay.netCents);
  const kept = (out.netCents / gross) * 100;
  const local = rail === "card" && v.cur !== "USD" ? fmt(v.cur, friendly((out.netCents / 100) * perUsd)) : null;

  const rows: [string, React.ReactNode, number, string][] = [
    ["in", "Provider fee", pay.providerFeeCents, "bg-terracotta"],
    ["sp", "SarafuPay fee", pay.sarafuFeeCents, "bg-marigold"],
    ["out", "Transfer fee", out.providerFeeCents, "bg-terracotta/70"],
    ["spo", "SarafuPay payout fee", out.sarafuFeeCents, "bg-marigold/70"],
  ];

  return (
    <div className="calc grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <div className="mb-5 inline-flex rounded-full bg-paper/10 p-1 text-sm" role="radiogroup" aria-label="How friends pay">
          {(["mobile", "card"] as Rail[]).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rail === r}
              onClick={() => setRail(r)}
              className={`rounded-full px-4 py-1.5 transition-colors ${rail === r ? "bg-paper text-ink" : "text-paper/75 hover:text-paper"}`}
            >
              {r === "mobile" ? "📱 Mobile money" : "💳 Card"}
            </button>
          ))}
        </div>
        <label htmlFor="calc-amount" className="block text-sm font-medium text-paper/80">
          Your collection raises
        </label>
        <p className="font-display mt-1 text-5xl font-semibold tracking-tight text-paper sm:text-6xl">
          <Rolling key={rail} value={gross} rail={rail} />
        </p>
        <input
          id="calc-amount"
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          aria-valuetext={show(rail, gross)}
          className="calc-range mt-6 w-full"
          style={{ "--fill": `${(i / (steps.length - 1)) * 100}%` } as React.CSSProperties}
        />
        <div className="mt-2 flex justify-between font-mono text-xs text-paper/60">
          <span>{short(rail, steps[0])}</span>
          <span>{short(rail, steps[steps.length - 1])}</span>
        </div>
        <p className="mt-3 text-xs text-paper/60">
          {rail === "mobile" ? "Tanzania · TZS" : `Any card currency · settles in ${CUR.card}`}
        </p>
      </div>

      <div className="rounded-[1.6rem] border border-paper/15 bg-paper/[0.06] p-5 sm:p-6">
        <ul className="space-y-3">
          {rows.map(([k, label, cents, dot]) => (
            <li key={k} className="flex items-center justify-between gap-3 text-sm text-paper/80">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
                {label}
              </span>
              <span className="font-mono">− <Rolling key={rail} value={cents} rail={rail} /></span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-paper/15 pt-5">
          <p className="text-sm text-paper/70">You receive</p>
          <p className="font-display mt-1 text-4xl font-semibold text-marigold">
            <Rolling key={rail} value={out.netCents} rail={rail} />
          </p>
          {local ? <p className="mt-1 text-sm text-paper/70">≈ {local}</p> : null}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper/10" aria-hidden>
            <div className="h-full rounded-full bg-marigold transition-[width] duration-500" style={{ width: `${kept}%` }} />
          </div>
          <p className="mt-2 text-xs text-paper/60">{kept.toFixed(1)}% kept</p>
        </div>
      </div>
    </div>
  );
}
