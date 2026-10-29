"use client";

/**
 * The organiser's treasurer dashboard. Ordered by what an organiser asks first: how much is in,
 * is anything waiting on me, who paid, who still has to, and where the money went.
 */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChannelSplit, DailyColumns, TopBars } from "./charts";
import { Ledger } from "./ledger";
import { PledgeScoreboard, type NudgeResult, type PledgeRow } from "./pledge-scoreboard";
import { TreasurerChat } from "./treasurer-chat";

export type DashboardData = {
  title: string;
  deadline: string | null;
  closed: boolean;
  /** Things only the organiser can act on, counted on the server. */
  attention: { receiptsWaiting: number; recordsToReview: number };
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

function Card({ id, title, subtitle, action, children, className = "" }: { id?: string; title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`min-w-0 scroll-mt-20 rounded-3xl border border-[#eadfc8] bg-white p-4 sm:p-6 ${className}`}>
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

function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="inline-flex shrink-0 rounded-full bg-paper p-0.5 text-xs font-semibold">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3 py-1.5 transition-colors ${value === o.id ? "bg-forest text-paper" : "text-ink-soft hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59`).getTime();
  return Math.ceil((end - Date.now()) / DAY);
}

export function Dashboard({ code, ownerKey, currency, data, trust }: { code: string; ownerKey: string; currency: string; data: DashboardData; trust: ReactNode }) {
  const fmt = useMemo(() => formatter(currency), [currency]);
  const headers = useMemo(() => ({ "x-collection": code, "x-owner-key": ownerKey }), [code, ownerKey]);
  const { summary: s, contributions, pledges, payouts, attention } = data;
  const [view, setView] = useState<"payments" | "top">("payments");

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
    return [...m].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [contributions]);

  const nudge = useCallback(async (): Promise<NudgeResult> => {
    const res = await fetch("/api/dashboard/action", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ action: "remind_pledgers" }),
    });
    return res.json();
  }, [headers]);

  const pct = s.target > 0 ? Math.round((s.raised / s.target) * 100) : 0;
  const lastWeek = days.slice(-7).reduce((sum, d) => sum + d.amount, 0);
  const people = new Set(contributions.map((c) => c.contributor)).size;
  const left = daysLeft(data.deadline);
  const today = new Date().toISOString().slice(0, 10);
  const late = pledges.filter((p) => p.status === "open" && p.due && p.due < today).length;

  const todo = [
    late ? { key: "late", text: `${late} pledge${late === 1 ? " is" : "s are"} past the promised date`, href: "#pledges", cta: "Send a nudge" } : null,
    attention.receiptsWaiting
      ? { key: "receipts", text: `${attention.receiptsWaiting} payment photo${attention.receiptsWaiting === 1 ? "" : "s"} waiting for your OK`, href: "#trust", cta: "Approve in WhatsApp" }
      : null,
    attention.recordsToReview
      ? { key: "review", text: `${attention.recordsToReview} record${attention.recordsToReview === 1 ? "" : "s"} the Trust Copilot wants you to check`, href: "#trust", cta: "Review" }
      : null,
  ].filter(Boolean) as { key: string; text: string; href: string; cta: string }[];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4 pb-28 sm:space-y-5 sm:px-6 sm:py-6">
      {/* Summary: the one number that matters, then what you can do with it. */}
      <section className="overflow-hidden rounded-3xl bg-forest text-paper">
        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-end">
          <div className="min-w-0">
            <p className="text-sm text-paper/70">Raised so far</p>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{fmt(s.raised)}</p>
            <p className="mt-2 text-sm text-paper/80">
              {s.target > 0 ? (
                <>
                  <strong className="text-marigold">{pct}%</strong> of {fmt(s.target)}
                  {s.target > s.raised ? <> · {fmt(s.target - s.raised)} to go</> : <> · target reached 🎉</>}
                </>
              ) : (
                "No target set"
              )}
            </p>
            {s.target > 0 ? (
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-paper/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to target">
                <div className="h-full rounded-full bg-marigold transition-[width] duration-700" style={{ width: `${Math.min(Math.max(pct, 2), 100)}%` }} />
              </div>
            ) : null}
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper/70">
              <span>
                {contributions.length} payment{contributions.length === 1 ? "" : "s"} from {people} {people === 1 ? "person" : "people"}
              </span>
              {lastWeek ? <span>+{fmt(lastWeek)} this week</span> : null}
              {data.closed ? <span className="font-semibold text-marigold">Closed</span> : left !== null ? <span>{left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : "Deadline passed"}</span> : null}
            </p>
          </div>
          <div className="rounded-2xl bg-paper px-5 py-4 text-ink md:min-w-64">
            <p className="text-xs text-ink-soft">Ready to pay out</p>
            <p className="mt-0.5 font-display text-3xl font-bold tabular-nums text-[#a06b00]">{fmt(s.balance)}</p>
            <p className="mt-1 text-[11px] leading-snug text-ink-soft">Pay out from WhatsApp. You confirm every payout with a one-time code.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-paper/10 text-sm">
          <div className="border-r border-paper/10 px-5 py-3.5 sm:px-7">
            <p className="text-xs text-paper/60">Paid out</p>
            <p className="mt-0.5 font-semibold tabular-nums">{fmt(s.paid_out)}</p>
          </div>
          <a href="#pledges" className="block px-5 py-3.5 hover:bg-paper/5 sm:px-7">
            <p className="text-xs text-paper/60">Still promised</p>
            <p className="mt-0.5 font-semibold tabular-nums">
              {fmt(s.open_pledges)}{" "}
              <span className="block text-xs font-normal text-paper/60 sm:inline">
                <span className="hidden sm:inline">· </span>
                {s.open_pledge_count} {s.open_pledge_count === 1 ? "person" : "people"}
              </span>
            </p>
          </a>
        </div>
      </section>

      {todo.length ? (
        <section aria-label="Needs you" className="rounded-3xl border border-marigold/50 bg-[#fdf3dc] p-2">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-[#8a5a00]">Needs you</p>
          <ul>
            {todo.map((t) => (
              <li key={t.key}>
                <a href={t.href} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm hover:bg-white/60">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-hidden />
                  <span className="min-w-0 flex-1">{t.text}</span>
                  <span className="shrink-0 text-xs font-semibold text-forest">{t.cta} ›</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <Card title="Money in" subtitle="Confirmed payments per day" className="lg:col-span-3">
          <DailyColumns days={days} fmt={fmt} />
          {channels.length ? (
            <div className="mt-5 border-t border-[#eadfc8] pt-4">
              <ChannelSplit parts={channels} fmt={fmt} />
            </div>
          ) : null}
        </Card>
        <Card id="pledges" title="Pledges" subtitle="Promises kept, and who still has to pay" className="lg:col-span-2">
          <PledgeScoreboard pledges={pledges} fmt={fmt} onNudge={nudge} />
        </Card>
      </div>

      <Card
        title={view === "payments" ? "Payments" : "Top givers"}
        subtitle={view === "payments" ? "Every confirmed payment, newest first" : "All payments by the same person added up"}
        action={
          <Tabs
            value={view}
            onChange={setView}
            options={[
              { id: "payments", label: "All" },
              { id: "top", label: "Top" },
            ]}
          />
        }
      >
        {view === "payments" ? (
          <Ledger
            rows={contributions}
            fmt={fmt}
            filename={`${code}-contributions.csv`}
            empty="No confirmed payments yet. Share your link to get the first one."
            defaultSort={{ key: "paid_on", dir: "desc" }}
            columns={[
              { key: "contributor", label: "Name", kind: "text" },
              { key: "amount", label: "Amount", kind: "money" },
              { key: "paid_on", label: "Date", kind: "date" },
              { key: "channel", label: "Via", kind: "pill" },
              { key: "message", label: "Message", kind: "text" },
              { key: "provider_ref", label: "Reference", kind: "text" },
            ]}
          />
        ) : (
          <TopBars rows={top} fmt={fmt} />
        )}
      </Card>

      <Card title="Payouts" subtitle="Where the money went. Every contributor sees this on the public page">
        <Ledger
          rows={payouts}
          fmt={fmt}
          filename={`${code}-payouts.csv`}
          empty="No payouts yet. You pay out from WhatsApp with a one-time CONFIRM code."
          defaultSort={{ key: "sent_on", dir: "desc" }}
          columns={[
            { key: "recipient", label: "To", kind: "text" },
            { key: "amount", label: "Amount", kind: "money" },
            { key: "purpose", label: "For", kind: "text" },
            { key: "status", label: "Status", kind: "pill" },
            { key: "sent_on", label: "Date", kind: "date" },
          ]}
        />
      </Card>

      <Card id="trust" title="Trust & records" subtitle="Checks the Trust Copilot runs on every payment">
        {trust}
      </Card>

      <TreasurerChat headers={headers} />
    </div>
  );
}
