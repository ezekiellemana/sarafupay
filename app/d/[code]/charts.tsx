"use client";

/**
 * Small hand-made SVG charts for the treasurer dashboard. No chart library: the data is a few
 * dozen rows at most, and drawing it ourselves keeps the bundle light and the look on brand.
 */

import { useState } from "react";

export const FOREST = "#0e3b2c";
export const GOLD = "#c98a0e";
export const MUTED = "#5b6b62";
export const LINE = "#eadfc8";
const CHANNEL_COLORS: Record<string, string> = { whatsapp: "#0e3b2c", chat: "#2f7a5a", web: "#f2a516", cash: "#c4502f" };
const EXTRA = ["#2a6f97", "#7a9e7e", "#d9a679", "#9c6b3d"];

export type Fmt = (n: number) => string;

/** Tiny trend line for a KPI tile. */
export function Sparkline({ values, color = FOREST }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - (v / max) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Ring showing raised vs target; can pass 100%. */
export function ProgressRing({ raised, target, fmt }: { raised: number; target: number; fmt: Fmt }) {
  const pct = target > 0 ? raised / target : 0;
  const r = 70;
  const c = 2 * Math.PI * r;
  const shown = Math.min(pct, 1);
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 180 180" className="h-44 w-44" role="img" aria-label={`${Math.round(pct * 100)}% of target raised`}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f3ead6" strokeWidth="16" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={pct >= 1 ? GOLD : FOREST}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${c * shown} ${c}`}
          transform="rotate(-90 90 90)"
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
        <text x="90" y="88" textAnchor="middle" className="fill-ink font-display" fontSize="34" fontWeight="700">
          {Math.round(pct * 100)}%
        </text>
        <text x="90" y="112" textAnchor="middle" fill={MUTED} fontSize="12">
          raised so far
        </text>
      </svg>
      <p className="text-center text-sm text-ink-soft">
        <strong className="text-ink">{fmt(raised)}</strong> of {target > 0 ? fmt(target) : "no target"}
        {target > raised ? <span className="block text-xs">{fmt(target - raised)} to go</span> : target > 0 ? <span className="block text-xs font-semibold text-forest">Target reached 🎉</span> : null}
      </p>
    </div>
  );
}

/** Column chart of money in per day, with empty days filled in so gaps are visible. */
export function DailyColumns({ days, fmt }: { days: { day: string; amount: number; count: number }[]; fmt: Fmt }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!days.length) return <Empty text="No payments yet. The first one will show up here." />;
  const w = 560;
  const h = 200;
  const pad = { l: 8, r: 8, t: 18, b: 24 };
  const max = Math.max(...days.map((d) => d.amount), 1);
  const slot = (w - pad.l - pad.r) / days.length;
  const bw = Math.max(3, Math.min(36, slot * 0.7));
  const label = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const every = Math.ceil(days.length / 8);
  const active = hover === null ? null : days[hover];
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label="Money in by day" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + (h - pad.t - pad.b) * (1 - g)} y2={pad.t + (h - pad.t - pad.b) * (1 - g)} stroke={LINE} strokeDasharray="3 4" />
        ))}
        {days.map((d, i) => {
          const bh = (d.amount / max) * (h - pad.t - pad.b);
          const x = pad.l + slot * i + (slot - bw) / 2;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${label(d.day)}: ${fmt(d.amount)}`}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={h - pad.t - pad.b} fill="transparent" />
              <rect
                x={x}
                y={h - pad.b - Math.max(bh, d.amount ? 2 : 0)}
                width={bw}
                height={Math.max(bh, d.amount ? 2 : 0)}
                rx={Math.min(4, bw / 3)}
                fill={hover === i ? GOLD : FOREST}
              />
              {i % every === 0 || i === days.length - 1 ? (
                <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="11" fill={MUTED}>
                  {label(d.day)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute right-2 top-0 rounded-lg bg-ink px-2.5 py-1 text-xs text-paper shadow">
          {label(active.day)} · <strong>{fmt(active.amount)}</strong> · {active.count} payment{active.count === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}

/** Donut of money in by channel, with a legend that doubles as the numbers. */
export function ChannelDonut({ parts, fmt }: { parts: { channel: string; amount: number }[]; fmt: Fmt }) {
  const total = parts.reduce((s, p) => s + p.amount, 0);
  if (!total) return <Empty text="Channels appear once money comes in." />;
  const r = 52;
  const c = 2 * Math.PI * r;
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((sum, p) => sum + (p.amount / total) * c, 0));
  const color = (ch: string, i: number) => CHANNEL_COLORS[ch] ?? EXTRA[i % EXTRA.length];
  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-36 w-36" role="img" aria-label="Money in by channel">
        {parts.map((p, i) => {
          const len = (p.amount / total) * c;
          return (
            <circle
              key={p.channel}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={color(p.channel, i)}
              strokeWidth="20"
              strokeDasharray={`${Math.max(len - 1.5, 0.5)} ${c}`}
              strokeDashoffset={-starts[i]}
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="11" fill={MUTED}>
          total
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="15" fontWeight="700" className="fill-ink">
          {fmt(0).replace(/[\d.,\s]/g, "")} {new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(total)}
        </text>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {parts.map((p, i) => (
          <li key={p.channel} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color(p.channel, i) }} />
            <span className="flex-1 capitalize">{p.channel === "whatsapp" ? "WhatsApp" : p.channel}</span>
            <span className="text-ink-soft">{Math.round((p.amount / total) * 100)}%</span>
            <span className="w-24 text-right font-semibold tabular-nums">{fmt(p.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars: who gave the most, all payments by the same name added up. */
export function TopBars({ rows, fmt }: { rows: { name: string; amount: number; count: number }[]; fmt: Fmt }) {
  if (!rows.length) return <Empty text="Top contributors appear once money comes in." />;
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              <span className="mr-1.5 font-mono text-[11px] text-ink-soft">{i + 1}</span>
              {r.name}
              {r.count > 1 ? <span className="ml-1 text-xs text-ink-soft">×{r.count}</span> : null}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{fmt(r.amount)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f3ead6]">
            <div className="h-full rounded-full" style={{ width: `${(r.amount / max) * 100}%`, background: i === 0 ? GOLD : FOREST }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="grid min-h-32 place-items-center px-4 text-center text-sm text-ink-soft">{text}</p>;
}
