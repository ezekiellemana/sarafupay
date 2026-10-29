import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Logo, Progress, SandboxBadge } from "@/components/brand";
import { ownerCollection } from "@/lib/dashboard/auth";
import { collectionStats, listContributions, listPayouts, listPledges } from "@/lib/services/core";
import { money } from "@/lib/format";
import { collectionUrl } from "@/lib/services/links";
import { Dashboard, type DashboardData } from "./dashboard";
import { CopyLink } from "./copy-link";
import { offlineSummary } from "@/lib/services/trust";
import { actionsFor } from "@/lib/services/agent-log";
import { chainFor, verifyChain, type EvidenceBody } from "@/lib/services/evidence";

export const metadata = { title: "SarafuPay — treasurer dashboard", robots: { index: false } };

export default async function DashboardPage({ params, searchParams }: PageProps<"/d/[code]">) {
  await connection();
  const { code } = await params;
  const { key } = await searchParams;
  const col = await ownerCollection(code, typeof key === "string" ? key : null);
  if (!col) notFound();
  const [stats, paid, pledges, payouts, outside, actions, evidence, chainCheck] = await Promise.all([
    collectionStats(col),
    listContributions(col.id, "paid"),
    listPledges(col.id),
    listPayouts(col.id),
    offlineSummary(col.id),
    actionsFor(col.code),
    chainFor(col.id),
    verifyChain(col.id),
  ]);
  const data: DashboardData = {
    contributions: paid.map((c) => ({
      contributor: c.displayName,
      amount: c.amountCents / 100,
      channel: c.source === "sim" ? "chat" : c.source,
      paid_on: (c.paidAt ?? c.createdAt).toISOString().slice(0, 10),
      message: c.message ?? "",
      provider_ref: c.provider === "snippe" ? (c.providerRef ?? "") : (c.paypalCaptureId ?? ""),
    })),
    pledges: pledges.map((p) => ({
      pledger: p.displayName,
      amount: p.amountCents / 100,
      due: p.dueDate ?? "",
      status: p.status,
      reminded: p.remindedAt ? "yes" : "no",
    })),
    payouts: payouts
      .filter((p) => p.status !== "cancelled" && p.status !== "awaiting_confirmation")
      .map((p) => ({
        recipient: p.recipientName ?? p.recipientEmail ?? p.recipientPhone ?? "recipient",
        amount: p.amountCents / 100,
        purpose: p.note ?? "",
        status: p.status,
        sent_on: (p.executedAt ?? p.createdAt).toISOString().slice(0, 10),
      })),
    summary: {
      target: col.targetCents / 100,
      raised: stats.raisedCents / 100,
      balance: stats.availableCents / 100,
      paid_out: stats.paidOutCents / 100,
      open_pledges: stats.openPledgeCents / 100,
      open_pledge_count: stats.openPledgeCount,
    },
  };
  return (
    <div className="min-h-dvh bg-paper">
      <div className="kanga" />
      <header className="border-b border-line bg-[#fffaf0]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Logo />
          <div className="hidden h-9 w-px bg-line md:block" />
          <div className="min-w-0 flex-1 basis-64">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h1 className="truncate font-display text-xl font-semibold leading-tight">{col.title}</h1>
              <span className="rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft">{col.code}</span>
              {col.status !== "active" ? <span className="text-xs font-semibold text-terracotta">closed</span> : null}
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="max-w-xs flex-1">
                <Progress percent={stats.percent} />
              </div>
              <p className="shrink-0 text-xs text-ink-soft">
                <strong className="text-ink">{stats.percent}%</strong> of {money(col.targetCents, col.currency)}
                {col.deadline ? <> · closes {col.deadline}</> : null}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-forest px-4 py-1.5 text-paper">
            <p className="text-[10px] uppercase tracking-widest opacity-75">Balance to pay out</p>
            <p className="font-display text-lg font-semibold leading-tight">{money(stats.availableCents, col.currency)}</p>
          </div>
          <div className="flex items-center gap-2">
            <SandboxBadge />
            <CopyLink url={collectionUrl(col.code)} />
            <a href={collectionUrl(col.code)} className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper" target="_blank" rel="noreferrer">
              Public page ↗
            </a>
          </div>
        </div>
      </header>
      {/* Trust Copilot + autopilot at a glance */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line bg-paper px-5 py-2 text-xs">
        <span className={`shrink-0 rounded-full px-3 py-1 ${col.autopilot === "on" ? "bg-forest text-paper" : "bg-paper-2 text-ink-soft"}`}>
          🤖 Autopilot {col.autopilot === "on" ? "on" : "off"}
        </span>
        <span className="shrink-0 rounded-full bg-paper-2 px-3 py-1 text-ink-soft" title="Money you recorded yourself (cash, your own mobile money). Shown for transparency; not in the balance.">
          💵 Outside SarafuPay: {outside.confirmed.length ? outside.confirmed.map((c) => money(c.totalCents, c.currency)).join(" + ") : "none"}
        </span>
        {outside.flagged.length ? (
          <span className="shrink-0 rounded-full bg-terracotta/10 px-3 py-1 font-semibold text-terracotta" title={outside.flagged.map((f) => `${f.name} ${f.amount}: ${f.check}${f.note ? ` – ${f.note}` : ""}`).join("\n")}>
            🔎 {outside.flagged.length} to review
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-forest/10 px-3 py-1 text-forest">🔎 All records check out</span>
        )}
        {evidence.length ? (
          <span
            className={`shrink-0 rounded-full px-3 py-1 ${chainCheck.ok ? "bg-forest/10 text-forest" : "bg-terracotta/10 font-semibold text-terracotta"}`}
            title="Every Trust Copilot decision is a signed, hash-chained evidence card."
          >
            🧾 {evidence.length} evidence card{evidence.length === 1 ? "" : "s"} · {chainCheck.ok ? "chain verified" : `chain broken at #${chainCheck.brokenAt}`}
          </span>
        ) : null}
        {outside.claimsWaiting ? (
          <span className="shrink-0 rounded-full bg-marigold/30 px-3 py-1 font-semibold text-ink">📸 {outside.claimsWaiting} waiting for you</span>
        ) : null}
      </div>
      {evidence.length ? (
        <details className="group border-b border-line bg-paper text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-2 text-ink-soft">
            <span className="transition-transform group-open:rotate-90" aria-hidden>▸</span>
            Evidence cards · {evidence.length}
          </summary>
          <ol className="max-h-64 space-y-1.5 overflow-y-auto px-5 pb-3">
            {[...evidence].reverse().map((c) => {
              const b = JSON.parse(c.body) as EvidenceBody;
              return (
                <li key={c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="font-mono text-[11px] text-ink-soft">#{c.seq}</span>
                  <span className={`rounded px-1.5 font-mono text-[11px] ${b.verdict === "ok" ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"}`}>{b.action}</span>
                  <span className="min-w-0 flex-1 text-ink">
                    {b.claim.payer} · {money(Math.round(b.claim.amount * 100), b.claim.currency)} · {b.verdict}
                    {b.crops.length ? ` · ${b.crops.length} receipt crop${b.crops.length === 1 ? "" : "s"}` : ""}
                  </span>
                  <a href={`/proof/${c.id}`} target="_blank" rel="noreferrer" className="underline">
                    proof ↗
                  </a>
                </li>
              );
            })}
          </ol>
        </details>
      ) : null}
      {actions.length ? (
        <details className="group border-b border-line bg-paper text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-2 text-ink-soft">
            <span className="transition-transform group-open:rotate-90" aria-hidden>▸</span>
            Agent activity · {actions.length} recent action{actions.length === 1 ? "" : "s"}
          </summary>
          <ol className="max-h-64 space-y-1.5 overflow-y-auto px-5 pb-3">
            {actions.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-mono text-[11px] text-ink-soft">{a.createdAt.toISOString().slice(5, 16).replace("T", " ")}</span>
                <span className={`rounded px-1.5 font-mono text-[11px] ${a.ok === "yes" ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"}`}>{a.tool}</span>
                <span className="min-w-0 basis-full break-words text-ink sm:basis-auto sm:flex-1">{a.result}</span>
                {a.model ? <span className="hidden font-mono text-[10px] text-ink-soft sm:inline">{a.model}</span> : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      <main>
        <Dashboard code={col.code} ownerKey={col.ownerKey} currency={col.currency} data={data} />
      </main>
    </div>
  );
}
