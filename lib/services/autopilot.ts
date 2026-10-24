import "server-only";
import { generateText } from "ai";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Collection } from "../db/schema";
import { money } from "../format";
import { sendTo } from "../channels/messaging";
import { langOf, t } from "../i18n";
import { withModelFallback } from "../agent/models";
import { aiConfigured } from "../env";
import { collectionStats, remindPledgers, statusLine } from "./core";
import { offlineSummary } from "./trust";
import { collectionUrl, dashboardUrl } from "./links";

/**
 * Treasurer autopilot. When an organiser switches it on, the scheduled job (every 15 min) acts
 * for them, within strict limits:
 * - reminds pledgers whose due date is tomorrow or past (at most every 3 days per pledge);
 * - sends the organiser a weekly report written by the model from the ledger's facts;
 * - sends everyone who gave a weekly progress update (totals only) when something changed;
 * - once the deadline passes, tells the organiser where things stand and what to do next.
 * It never moves money: a payout still needs the organiser's own CONFIRM code.
 */

const DAY = 24 * 60 * 60_000;
const { collections, contributions } = schema;

export type AutopilotReport = {
  collections: number;
  reminded: number;
  reports: number;
  deadlineNotes: number;
  /** Contributors who got the weekly progress update. */
  updated: number;
  errors: string[];
};

const BROADCAST_CAP = 60; // per collection per run, keeps the job inside its time limit

/**
 * Weekly progress update to everyone who gave. Totals only: who gave what stays private to the
 * organiser. Sent only when something changed since the last update. WhatsApp refuses free text
 * to people who haven't written in 24h; they're skipped (they still see the public page).
 */
export async function broadcastProgress(col: Collection, now = new Date()): Promise<number> {
  const db = await getDb();
  const since = col.autopilotBroadcastAt ?? col.createdAt;
  const fresh = await db
    .select({ id: contributions.id })
    .from(contributions)
    .where(and(eq(contributions.collectionId, col.id), eq(contributions.status, "paid"), gt(contributions.paidAt, since)));
  const payoutsSince = await db
    .select({ id: schema.payouts.id })
    .from(schema.payouts)
    .where(and(eq(schema.payouts.collectionId, col.id), eq(schema.payouts.status, "success"), gt(schema.payouts.executedAt, since)));
  if (!fresh.length && !payoutsSince.length) return 0;
  const givers = await db
    .selectDistinct({ id: contributions.contributorId })
    .from(contributions)
    .where(and(eq(contributions.collectionId, col.id), eq(contributions.status, "paid")));
  const s = await collectionStats(col);
  let sent = 0;
  let spaced = 0;
  for (const g of givers.slice(0, BROADCAST_CAP)) {
    if (!g.id || g.id === col.ownerId) continue;
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, g.id));
    if (!u) continue;
    if (u.channel !== "sim" && spaced++ > 0) await new Promise((r) => setTimeout(r, 1100));
    const L = await langOf(u.phone);
    const r = await sendTo(
      u.phone,
      t(
        L,
        `💚 Habari ${u.name ?? ""}! Taarifa ya *${col.title}*:\n${statusLine(col, s, "sw")}${payoutsSince.length ? `\n📤 Malipo ${payoutsSince.length} yametoka wiki hii, yote yameripotiwa.` : ""}\nAsante kwa mchango wako 🙏 ${collectionUrl(col.code)}`,
        `💚 Hi ${u.name ?? ""}! Update on *${col.title}*:\n${statusLine(col, s, "en")}${payoutsSince.length ? `\n📤 ${payoutsSince.length} payout${payoutsSince.length === 1 ? "" : "s"} went out this week, all reported.` : ""}\nThank you for giving 🙏 ${collectionUrl(col.code)}`,
      ).replace(/ {2,}/g, " ").replace(" !", "!"),
    );
    if (r.ok) sent++;
  }
  await db.update(collections).set({ autopilotBroadcastAt: now }).where(eq(collections.id, col.id));
  return sent;
}

/** Facts the weekly report is written from. Everything the model says must come from here. */
export async function reportFacts(col: Collection, since: Date | null) {
  const db = await getDb();
  const s = await collectionStats(col);
  const fresh = await db
    .select()
    .from(contributions)
    .where(and(eq(contributions.collectionId, col.id), eq(contributions.status, "paid"), gt(contributions.paidAt, since ?? new Date(0))));
  const plg = await db.select().from(schema.pledges).where(and(eq(schema.pledges.collectionId, col.id), eq(schema.pledges.status, "open")));
  const off = await offlineSummary(col.id);
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = col.deadline ? Math.round((Date.parse(col.deadline) - Date.parse(today)) / DAY) : null;
  return {
    title: col.title,
    code: col.code,
    progress: statusLine(col, s),
    target: money(col.targetCents, col.currency),
    raised: money(s.raisedCents, col.currency),
    available_to_withdraw: s.balances.map((b) => money(b.availableCents, b.currency)).join(" + "),
    new_since_last_report: { count: fresh.length, names: fresh.slice(0, 10).map((c) => c.displayName), total: fresh.length ? money(fresh.reduce((n, c) => n + (c.currency === col.currency ? c.amountCents : 0), 0), col.currency) : money(0, col.currency) },
    open_pledges: plg.map((p) => ({ name: p.displayName, amount: money(p.amountCents, col.currency), due: p.dueDate, overdue: Boolean(p.dueDate && p.dueDate < today) })),
    recorded_outside_sarafupay: off.confirmed.map((c) => `${money(c.totalCents, c.currency)} (${c.count})`).join(", ") || "none",
    trust_flags: off.flagged,
    claims_waiting_for_you: off.claimsWaiting,
    deadline: col.deadline,
    days_left: daysLeft,
    dashboard: dashboardUrl(col),
  };
}

/** Writes the organiser's report with the model; falls back to a plain summary if no model answers. */
export async function composeReport(col: Collection, facts: Awaited<ReturnType<typeof reportFacts>>, lang: "sw" | "en"): Promise<string> {
  const plain = t(
    lang,
    `📊 *${facts.title}* (${facts.code})\n${facts.progress}\nWapya: ${facts.new_since_last_report.count} · Ahadi wazi: ${facts.open_pledges.length}${facts.trust_flags.length ? ` · ⚠️ ${facts.trust_flags.length} za kukagua` : ""}\n${facts.dashboard}`,
    `📊 *${facts.title}* (${facts.code})\n${facts.progress}\nNew: ${facts.new_since_last_report.count} · Open pledges: ${facts.open_pledges.length}${facts.trust_flags.length ? ` · ⚠️ ${facts.trust_flags.length} to review` : ""}\n${facts.dashboard}`,
  );
  if (!aiConfigured()) return plain;
  try {
    const { text } = await withModelFallback((m) =>
      generateText({
        model: m.model,
        maxOutputTokens: 700,
        maxRetries: 1,
        providerOptions: m.fast,
        system: `You are SarafuPay's treasurer autopilot writing a short WhatsApp update to the organiser of a group collection. Write in ${lang === "sw" ? "Swahili" : "English"}. Use ONLY the facts given; never invent names, amounts or dates. Under 110 words. Start with "📊 *${facts.title}*". Then progress, who is new, who still owes (overdue first), and any trust flags in plain words. End with at most 2 concrete next steps the organiser can ask you for (e.g. "remind pledgers", "prepare payout", "close the collection"), and the dashboard link. Single asterisks for bold, no headings, no tables. Never say money was sent; payouts need the organiser's CONFIRM code.`,
        prompt: JSON.stringify(facts),
      }),
    );
    return text.trim() || plain;
  } catch (e) {
    console.warn("[autopilot] report model failed, sending plain summary", e instanceof Error ? e.message : e);
    return plain;
  }
}

export async function sendReportNow(col: Collection): Promise<string> {
  const db = await getDb();
  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, col.ownerId));
  if (!owner) return "owner not found";
  const L = await langOf(owner.phone);
  const text = await composeReport(col, await reportFacts(col, col.autopilotReportAt), L);
  const sent = await sendTo(owner.phone, text);
  if (sent.ok) await db.update(collections).set({ autopilotReportAt: new Date() }).where(eq(collections.id, col.id));
  return text;
}

export async function runAutopilot(now = new Date()): Promise<AutopilotReport> {
  const db = await getDb();
  const out: AutopilotReport = { collections: 0, reminded: 0, reports: 0, deadlineNotes: 0, updated: 0, errors: [] };
  const list = await db
    .select()
    .from(collections)
    .where(and(eq(collections.autopilot, "on"), eq(collections.status, "active")));
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + DAY).toISOString().slice(0, 10);
  for (const col of list) {
    out.collections++;
    try {
      // 1. Due-date reminders, spaced out so nobody is nagged.
      const r = await remindPledgers(
        col,
        (p) => Boolean(p.dueDate && p.dueDate <= tomorrow) && (!p.remindedAt || now.getTime() - p.remindedAt.getTime() > 3 * DAY),
      );
      out.reminded += r.reminded.length;

      // 2. Weekly report.
      if (!col.autopilotReportAt || now.getTime() - col.autopilotReportAt.getTime() >= 7 * DAY) {
        await sendReportNow(col);
        out.reports++;
      }

      // 2b. Weekly progress update to contributors.
      if (!col.autopilotBroadcastAt || now.getTime() - col.autopilotBroadcastAt.getTime() >= 7 * DAY) {
        out.updated += await broadcastProgress(col, now);
      }

      // 3. Deadline passed: one note with where things stand.
      if (col.deadline && col.deadline < today && !col.autopilotDeadlineAt) {
        const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, col.ownerId));
        if (owner) {
          const L = await langOf(owner.phone);
          const s = await collectionStats(col);
          const reached = s.raisedCents >= col.targetCents;
          await sendTo(
            owner.phone,
            t(
              L,
              `⏰ Tarehe ya mwisho ya *${col.title}* imepita.\n${statusLine(col, s, L)}\n${reached ? "🎉 Lengo limefikiwa!" : "Lengo bado halijafikiwa."} Unaweza kuniambia "ongeza muda", "funga mchango" au "toa pesa" (utapata msimbo wa kuthibitisha).`,
              `⏰ The deadline for *${col.title}* has passed.\n${statusLine(col, s, L)}\n${reached ? "🎉 Target reached!" : "The target isn't reached yet."} You can tell me "extend the deadline", "close the collection" or "withdraw" (you'll get a code to confirm).`,
            ),
          );
          await db.update(collections).set({ autopilotDeadlineAt: now }).where(eq(collections.id, col.id));
          out.deadlineNotes++;
        }
      }
    } catch (e) {
      out.errors.push(`${col.code}: ${e instanceof Error ? e.message : String(e)}`.slice(0, 200));
    }
  }
  return out;
}
