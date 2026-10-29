"use client";

/**
 * The organiser's treasurer dashboard: headline numbers, charts, ledgers, the pledge scoreboard
 * and the Treasurer chat. Everything is drawn here from the rows the page hands over.
 */

import { useCallback, useMemo, type ReactNode } from "react";
import { ChannelDonut, DailyColumns, FOREST, GOLD, ProgressRing, Sparkline, TopBars } from "./charts";
import { Ledger } from "./ledger";
import { PledgeScoreboard, type NudgeResult, type PledgeRow } from "./pledge-scoreboard";
import { TreasurerChat } from "./treasurer-chat";

export type DashboardData = {
  contributions: { contributor: string; amount: number; channel: string; paid_on: string; message: string; provider_ref: string }[];
  pledges: PledgeRow[];
  payouts: { recipient: string; amount: number; purpose: string; status: string; sent_on: string }[];
  summary: { target: number; raised: number; balance: number; paid_out: number; open_pledges: number; open_pledge_count: number };
};

const DAY = 86_400_000;

/** Currency formatter that drops ".00" on whole amounts, like the header's figures. */
function formatter(currency: string) {
  const make = (digits?: number) => {
    const opts = digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits };
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", ...opts });
    } catch {
      return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits ?? 2, maximumFractionDigits: digits ?? 2 });
    }
  };
  const exact = make();
  const whole = make(0);
  return (n: number) => (Number.isInteger(n) ? whole : exact).format(n);
}

/** Money in per day from the first payment to today (or the last payment), empty days included. */
function byDay(rows: DashboardData["contributions"]) {
  const sums = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const cur = sums.get(r.paid_on) ?? { amount: 0, count: 0 };
    sums.set(r.paid_on, { amount: cur.amount + r.amount, count: cur.count + 1 });
  }
  const keys = [...sums.keys()].sort();
  if (!keys.length) return [];
  const first = new Date(`${keys[0]}T00:00:00Z`).getTime();
  const lastKey = keys[keys.length - 1];
  const todayKey = new Date().toISOString().slice(0, 10);
  const last = new Date(`${todayKey > lastKey ? todayKey : lastKey}T00:00:00Z`).getTime();
  // Long collections would make hair-thin bars: show the latest 45 days.
  const start = Math.max(first, last - 44 * DAY);
  const out: { day: string; amount: number; count: number }[] = [];
  for (let t = start; t <= last; t += DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    out.push({ day, ...(sums.get(day) ?? { amount: 0, count: 0 }) });
  }
  return out;
}

function Card({ title, subtitle, children, className = "", action }: { title: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-[#eadfc8] bg-white p-5 shadow-[0_1px_0_#eadfc8] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold leading-tight text-ink">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, note, tone = "ink", children }: { label: string; value: string; note?: string; tone?: "ink" | "forest" | "gold"; children?: ReactNode }) {
  const color = tone === "forest" ? FOREST : tone === "gold" ? GOLD : undefined;
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-[#eadfc8] bg-white px-4 py-3.5">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 truncate font-display text-xl font-bold sm:text-2xl tabular-nums text-ink" style={color ? { color } : undefined}>
        {value}
      </p>
      {note ? <p className="truncate text-[11px] text-ink-soft" title={note}>{note}</p> : null}
      {children}
    </div>
  );
}

export function Dashboard({ code, ownerKey, currency, data }: { code: string; ownerKey: string; currency: string; data: DashboardData }) {
  const fmt = useMemo(() => formatter(currency), [currency]);
  const headers = useMemo(() => ({ "x-collection": code, "x-owner-key": ownerKey }), [code, ownerKey]);
  const { summary: s, contributions, pledges, payouts } = data;

  const days = useMemo(() => byDay(contributions), [contributions]);
  const channels = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of contributions) m.set(c.channel, (m.get(c.channel) ?? 0) + c.amount);
    return [...m].map(([channel, amount]) => ({ channel, amount })).sort((a, b) => b.amount - a.amount);
  }, [contributions]);
  const top = useMemo(() => {
    const m = new Map<string, { amount: number; count: number }>();
    for (const c of contributions) {
      const cur = m.get(c.contributor) ?? { amount: 0, count: 0 };
      m.set(c.contributor, { amount: cur.amount + c.amount, count: cur.count + 1 });
    }
    return [...m].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [contributions]);

  const nudge = useCallback(async (): Promise<NudgeResult> => {
    const res = await fetch("/api/dashboard/action", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ action: "remind_pledgers" }),
    });
    return res.json();
  }, [headers]);

  const funded = s.target > 0 ? Math.round((s.raised / s.target) * 100) : 0;
  const lastWeek = days.slice(-7).reduce((sum, d) => sum + d.amount, 0);
  const contributors = new Set(contributions.map((c) => c.contributor)).size;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-5 pb-24 sm:px-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Raised" value={fmt(s.raised)} tone="forest" note={days.length ? `${fmt(lastWeek)} in the last 7 days` : "Nothing yet"}>
          <Sparkline values={days.map((d) => d.amount)} />
        </Kpi>
        <Kpi label="Of target" value={`${funded}%`} note={s.target > 0 ? `Goal ${fmt(s.target)}` : "No target set"} />
        <Kpi label="Balance to pay out" value={fmt(s.balance)} tone="gold" note="Held safely until you pay out" />
        <Kpi label="Paid out" value={fmt(s.paid_out)} note={`${payouts.length} payout${payouts.length === 1 ? "" : "s"}`} />
        <Kpi label="Open pledges" value={fmt(s.open_pledges)} note={`${s.open_pledge_count} still to come`} />
        <Kpi label="Contributions" value={String(contributions.length)} note={`from ${contributors} ${contributors === 1 ? "person" : "people"}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card title="Progress to target" className="lg:col-span-3">
          <div className="grid flex-1 place-items-center">
            <ProgressRing raised={s.raised} target={s.target} fmt={fmt} />
          </div>
        </Card>
        <Card title="Money in, by day" subtitle="Confirmed contributions per day · hover a bar for details" className="lg:col-span-6">
          <DailyColumns days={days} fmt={fmt} />
        </Card>
        <Card title="By channel" subtitle="WhatsApp chat vs. web checkout" className="lg:col-span-3">
          <ChannelDonut parts={channels} fmt={fmt} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card title="Contributions" subtitle="Every confirmed payment, with its provider reference" className="lg:col-span-8">
          <Ledger
            rows={contributions}
            fmt={fmt}
            filename={`${code}-contributions.csv`}
            empty="No confirmed payments yet. Share your link to get the first one."
            defaultSort={{ key: "paid_on", dir: "desc" }}
            columns={[
              { key: "contributor", label: "Contributor", kind: "text" },
              { key: "amount", label: "Amount", kind: "money" },
              { key: "paid_on", label: "Paid on", kind: "date" },
              { key: "channel", label: "Channel", kind: "pill" },
              { key: "message", label: "Message", kind: "text", wide: true },
              { key: "provider_ref", label: "Provider ref", kind: "text", wide: true },
            ]}
          />
        </Card>
        <Card title="Top contributors" className="lg:col-span-4">
          <TopBars rows={top} fmt={fmt} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card title="Pledge scoreboard" subtitle="Promises kept, and who still has to pay" className="lg:col-span-5">
          <PledgeScoreboard pledges={pledges} fmt={fmt} onNudge={nudge} />
        </Card>
        <Card title="Payouts · transparency ledger" subtitle="Broadcast to every contributor and shown on the public page" className="lg:col-span-7">
          <Ledger
            rows={payouts}
            fmt={fmt}
            filename={`${code}-payouts.csv`}
            empty="No payouts yet. You pay out from WhatsApp with a one-time CONFIRM code."
            defaultSort={{ key: "sent_on", dir: "desc" }}
            columns={[
              { key: "recipient", label: "Recipient", kind: "text" },
              { key: "amount", label: "Amount", kind: "money" },
              { key: "purpose", label: "Purpose", kind: "text", wide: true },
              { key: "status", label: "Status", kind: "pill" },
              { key: "sent_on", label: "Sent on", kind: "date" },
            ]}
          />
        </Card>
      </div>

      <TreasurerChat headers={headers} />
    </div>
  );
}
