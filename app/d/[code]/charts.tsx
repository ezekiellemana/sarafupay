"use client";

/**
 * Small hand-made charts for the treasurer dashboard. No chart library: the data is a few dozen
 * rows at most. Bars are plain HTML so text stays crisp at every screen width.
 */

import { useState } from "react";

export const FOREST = "#0e3b2c";
export const GOLD = "#c98a0e";
const CHANNEL_COLORS: Record<string, string> = { whatsapp: "#0e3b2c", chat: "#2f7a5a", web: "#f2a516", cash: "#c4502f" };
const EXTRA = ["#2a6f97", "#7a9e7e", "#d9a679", "#9c6b3d"];

export type Fmt = (n: number) => string;

const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Column chart of money in per day; tap or hover a bar to read it. */
export function DailyColumns({ days, fmt }: { days: { day: string; amount: number; count: number }[]; fmt: Fmt }) {
  const [pick, setPick] = useState<number | null>(null);
  if (!days.length) return <Empty text="No payments yet. The first one will show up here." />;
  const max = Math.max(...days.map((d) => d.amount), 1);
  const best = days.reduce((b, d, i) => (d.amount > days[b].amount ? i : b), 0);
  const shown = days[pick ?? best];
  const ticks = [0, Math.floor((days.length - 1) / 2), days.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <div>
      <p className="mb-3 text-sm text-ink-soft" aria-live="polite">
        <span className="font-semibold text-ink">{dayLabel(shown.day)}</span> · {fmt(shown.amount)} · {shown.count} payment{shown.count === 1 ? "" : "s"}
        {pick === null ? <span className="ml-1 text-xs">(best day)</span> : null}
      </p>
      <div className="flex h-36 items-end gap-[3px] sm:gap-1" onMouseLeave={() => setPick(null)}>
        {days.map((d, i) => (
          <button
            key={d.day}
            type="button"
            onMouseEnter={() => setPick(i)}
            onFocus={() => setPick(i)}
            onClick={() => setPick(i)}
            aria-label={`${dayLabel(d.day)}: ${fmt(d.amount)}`}
            className="group flex h-full min-w-0 flex-1 items-end"
          >
            <span
              className="block w-full rounded-t-[4px] transition-colors"
              style={{
                height: d.amount ? `${Math.max((d.amount / max) * 100, 3)}%` : "2px",
                background: d.amount ? ((pick ?? best) === i ? GOLD : FOREST) : "#eadfc8",
              }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-soft">
        {ticks.map((t) => (
          <span key={t}>{dayLabel(days[t].day)}</span>
        ))}
      </div>
    </div>
  );
}

/** One stacked bar showing where the money came from. */
export function ChannelSplit({ parts, fmt }: { parts: { channel: string; amount: number }[]; fmt: Fmt }) {
  const total = parts.reduce((s, p) => s + p.amount, 0);
  if (!total) return null;
  const color = (ch: string, i: number) => CHANNEL_COLORS[ch] ?? EXTRA[i % EXTRA.length];
  const name = (ch: string) => (ch === "whatsapp" ? "WhatsApp" : ch === "chat" ? "Chat" : ch === "web" ? "Web" : ch);
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[#f3ead6]" role="img" aria-label="Money in by channel">
        {parts.map((p, i) => (
          <span key={p.channel} style={{ width: `${(p.amount / total) * 100}%`, background: color(p.channel, i) }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        {parts.map((p, i) => (
          <li key={p.channel} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color(p.channel, i) }} />
            <span className="capitalize text-ink">{name(p.channel)}</span>
            {Math.round((p.amount / total) * 100)}% · {fmt(p.amount)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars: who gave the most, all payments by the same name added up. */
export function TopBars({ rows, fmt }: { rows: { name: string; amount: number; count: number }[]; fmt: Fmt }) {
  if (!rows.length) return <Empty text="Top givers appear once money comes in." />;
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              <span className="mr-2 inline-block w-4 text-right font-mono text-[11px] text-ink-soft">{i + 1}</span>
              {r.name}
              {r.count > 1 ? <span className="ml-1 text-xs text-ink-soft">×{r.count}</span> : null}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{fmt(r.amount)}</span>
          </div>
          <div className="ml-6 mt-1 h-1.5 overflow-hidden rounded-full bg-[#f3ead6]">
            <div className="h-full rounded-full" style={{ width: `${(r.amount / max) * 100}%`, background: i === 0 ? GOLD : FOREST }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="grid min-h-28 place-items-center px-4 text-center text-sm text-ink-soft">{text}</p>;
}
