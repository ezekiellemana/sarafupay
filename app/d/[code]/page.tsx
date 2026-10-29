import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CoinMark, SandboxBadge } from "@/components/brand";
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
    title: col.title,
    deadline: col.deadline ?? null,
    closed: col.status !== "active",
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
    attention: { receiptsWaiting: outside.claimsWaiting, recordsToReview: outside.flagged.length },
  };
  const publicUrl = collectionUrl(col.code);
  const outsideTotal = outside.confirmed.length ? outside.confirmed.map((c) => money(c.totalCents, c.currency)).join(" + ") : null;

  const trust = (
    <div className="space-y-4 text-sm">
      <ul className="grid gap-2 sm:grid-cols-2">
        <TrustRow ok={col.autopilot === "on"} neutral={col.autopilot !== "on"} label={`Autopilot ${col.autopilot === "on" ? "on" : "off"}`} note={col.autopilot === "on" ? "Daily reports and reminders go out for you" : "Turn it on in WhatsApp to send daily reports and reminders for you"} />
        <TrustRow
          ok={!outside.flagged.length}
          label={outside.flagged.length ? `${outside.flagged.length} record${outside.flagged.length === 1 ? "" : "s"} to review` : "All records check out"}
          note={outside.flagged.length ? outside.flagged.map((f) => `${f.name} ${f.amount}`).join(", ") : "Trust Copilot found nothing odd"}
        />
        <TrustRow ok label={outsideTotal ? `Outside SarafuPay: ${outsideTotal}` : "Nothing recorded outside SarafuPay"} note="Cash or your own mobile money. Shown, not in the balance" />
        {evidence.length ? (
          <TrustRow
            ok={chainCheck.ok}
            label={`${evidence.length} evidence card${evidence.length === 1 ? "" : "s"} · ${chainCheck.ok ? "chain verified" : `chain broken at #${chainCheck.brokenAt}`}`}
            note="Each Trust Copilot decision is signed and hash-chained"
          />
        ) : null}
      </ul>
      {evidence.length ? (
        <details className="group rounded-xl border border-[#eadfc8]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold">
            Evidence cards
            <span className="text-ink-soft transition-transform group-open:rotate-90" aria-hidden>›</span>
          </summary>
          <ol className="max-h-72 divide-y divide-[#eadfc8] overflow-y-auto border-t border-[#eadfc8]">
            {[...evidence].reverse().map((c) => {
              const b = JSON.parse(c.body) as EvidenceBody;
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[11px] text-ink-soft">#{c.seq}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {b.claim.payer} · {money(Math.round(b.claim.amount * 100), b.claim.currency)}
                    <span className={`ml-2 text-xs font-semibold ${b.verdict === "ok" ? "text-forest" : "text-terracotta"}`}>{b.verdict}</span>
                  </span>
                  <a href={`/proof/${c.id}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-forest underline underline-offset-2">
                    Proof
                  </a>
                </li>
              );
            })}
          </ol>
        </details>
      ) : null}
      {actions.length ? (
        <details className="group rounded-xl border border-[#eadfc8]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold">
            What the assistant did · {actions.length}
            <span className="text-ink-soft transition-transform group-open:rotate-90" aria-hidden>›</span>
          </summary>
          <ol className="max-h-72 divide-y divide-[#eadfc8] overflow-y-auto border-t border-[#eadfc8]">
            {actions.map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`h-1.5 w-1.5 rounded-full ${a.ok === "yes" ? "bg-forest" : "bg-terracotta"}`} />
                  <span className="font-mono text-ink-soft">{a.tool}</span>
                  <span className="ml-auto text-ink-soft">{a.createdAt.toISOString().slice(5, 16).replace("T", " ")}</span>
                </div>
                <p className="mt-0.5 break-words text-ink">{a.result}</p>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper">
      <div className="kanga" />
      <header className="sticky top-0 z-20 border-b border-line/70 bg-[#fffaf0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" aria-label="SarafuPay home" className="shrink-0">
            <CoinMark size={30} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-semibold leading-tight sm:text-lg">{col.title}</h1>
            <p className="truncate text-[11px] text-ink-soft">
              Treasurer dashboard · <span className="font-mono">{col.code}</span>
              {col.status !== "active" ? <span className="ml-1 font-semibold text-terracotta">· closed</span> : null}
            </p>
          </div>
          <div className="hidden lg:block">
            <SandboxBadge />
          </div>
          <CopyLink url={publicUrl} />
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the public page"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-sm font-medium text-paper sm:px-4"
          >
            <span aria-hidden>↗</span>
            <span className="hidden sm:inline">Public page</span>
          </a>
        </div>
      </header>
      <div className="lg:hidden">
        <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 [&:empty]:hidden">
          <SandboxBadge />
        </div>
      </div>
      <main>
        <Dashboard code={col.code} ownerKey={col.ownerKey} currency={col.currency} data={data} trust={trust} />
      </main>
    </div>
  );
}

function TrustRow({ ok, label, note, neutral = false }: { ok: boolean; label: string; note: string; neutral?: boolean }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-paper/60 px-3.5 py-3">
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${neutral ? "bg-ink-soft/40" : ok ? "bg-forest" : "bg-terracotta"}`} aria-hidden />
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block text-xs text-ink-soft">{note}</span>
      </span>
    </li>
  );
}
