import "server-only";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Collection, Contribution, OfflineRecord, Pledge, User } from "../db/schema";
import { money, newId } from "../format";
import { sendTo } from "../channels/messaging";
import { getOrderSummary } from "../paypal/orders";
import * as snippe from "../snippe/client";
import { langOf, t, type Lang } from "../i18n";
import { payUrl } from "./links";
import { applyCapture, applySnippePayment, createContribution, getUser, settleOrder, withReminderTemplate } from "./core";

const { contributions, pledges, offlineRecords, processedEvents, reminderDrafts } = schema;

/**
 * Organiser copilot: "nani bado hajalipa?" / "why is Juma's payment pending?".
 *
 * For each person it walks the ledger (pledges, pay links, contributions, money recorded outside
 * SarafuPay) and the provider webhook log, asks Snippe or PayPal for the live status of anything
 * still pending, and names what is going on. When a nudge would help, it drafts a reminder in the
 * payer's language. Drafts are only sent by sendReminderDrafts, after the organiser says yes.
 */

export type Diagnosis =
  | "paid"
  | "recovered_now"
  | "offline_waiting"
  | "offline_flagged"
  | "waiting_on_payer"
  | "link_not_opened"
  | "failed"
  | "pledged_not_started"
  | "not_found";

export type Case = {
  name: string;
  diagnosis: Diagnosis;
  /** Plain-English facts for the agent to explain in the organiser's language. */
  why: string;
  timeline: { at: string; what: string }[];
  draft?: { id: string; to: string; language: Lang; preview: string };
  /** Why there is no draft when one would have helped. */
  no_draft_reason?: string;
};

/** Provider status lookups, swappable in tests. */
export type InvestigateDeps = {
  snippeSession: (ref: string) => Promise<{ status: string; amountTzs?: number }>;
  paypalOrder: typeof getOrderSummary;
};
let deps: InvestigateDeps = { snippeSession: (ref) => snippe.getPayment(ref), paypalOrder: (id) => getOrderSummary(id) };
export function __setInvestigateDepsForTests(d: Partial<InvestigateDeps>) {
  deps = { ...deps, ...d };
}

const NEEDS_REMINDER: Diagnosis[] = ["waiting_on_payer", "link_not_opened", "failed", "pledged_not_started"];
const MAX_PEOPLE = 8;

function when(d: Date | null | undefined): string {
  if (!d) return "";
  // Organisers are in East Africa: show their clock.
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Dar_es_Salaam", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function fold(s: string): string[] {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** "Juma" finds "Juma Hassan"; "mama neema" finds "Mama Neema". */
export function nameMatches(query: string, displayName: string): boolean {
  const q = fold(query);
  const n = fold(displayName);
  return q.length > 0 && q.every((w) => n.some((x) => x.startsWith(w)));
}

type Person = {
  key: string;
  name: string;
  userId?: string;
  pledges: Pledge[];
  contributions: Contribution[];
  offline: OfflineRecord[];
};

function groupPeople(ps: Pledge[], cs: Contribution[], os: OfflineRecord[]): Person[] {
  const people = new Map<string, Person>();
  const byName = (n: string) => `name:${fold(n).join(" ")}`;
  const get = (userId: string | null | undefined, name: string) => {
    const key = userId ?? byName(name);
    let p = people.get(key);
    if (!p) {
      p = { key, name, userId: userId ?? undefined, pledges: [], contributions: [], offline: [] };
      people.set(key, p);
    }
    if (p.name === "Anonymous" && name !== "Anonymous") p.name = name;
    return p;
  };
  for (const p of ps) get(p.userId, p.displayName).pledges.push(p);
  for (const c of cs) get(c.contributorId, c.displayName).contributions.push(c);
  // Outside payments are recorded by name (often by the organiser), so they join that name's person.
  for (const o of os) {
    const match = [...people.values()].find((p) => nameMatches(o.displayName, p.name));
    (match ?? get(null, o.displayName)).offline.push(o);
  }
  return [...people.values()];
}

/** Still owes something, or has a payment the organiser should know about. */
function outstanding(p: Person): boolean {
  if (p.pledges.some((x) => x.status === "open")) return true;
  if (p.offline.some((o) => o.status === "claimed" || (o.status !== "rejected" && o.checkStatus !== "ok"))) return true;
  const paid = p.contributions.some((c) => c.status === "paid");
  return !paid && p.contributions.some((c) => c.status === "pending" || c.status === "failed");
}

export async function investigate(col: Collection, organiser: User, name?: string): Promise<{ checked: number; cases: Case[] }> {
  const db = await getDb();
  const [ps, cs, os] = await Promise.all([
    db.select().from(pledges).where(eq(pledges.collectionId, col.id)),
    db.select().from(contributions).where(eq(contributions.collectionId, col.id)).orderBy(desc(contributions.createdAt)),
    db.select().from(offlineRecords).where(eq(offlineRecords.collectionId, col.id)),
  ]);
  let people = groupPeople(ps, cs, os);
  if (name) people = people.filter((p) => nameMatches(name, p.name));
  else people = people.filter(outstanding);
  if (name && !people.length) {
    return { checked: 0, cases: [{ name, diagnosis: "not_found", why: `No pledge, pay link or payment for anyone called "${name}" in ${col.code}.`, timeline: [] }] };
  }
  const cases: Case[] = [];
  for (const p of people.slice(0, MAX_PEOPLE)) cases.push(await investigatePerson(col, organiser, p));
  return { checked: people.length, cases };
}

async function investigatePerson(col: Collection, organiser: User, p: Person): Promise<Case> {
  const db = await getDb();
  const timeline: { at: Date; what: string }[] = [];
  const amt = (cents: number) => money(cents, col.currency);

  for (const pl of p.pledges) {
    timeline.push({ at: pl.createdAt, what: `Pledged ${amt(pl.amountCents)}${pl.dueDate ? ` (due ${pl.dueDate})` : ""}` });
    if (pl.remindedAt) timeline.push({ at: pl.remindedAt, what: "Reminder sent on WhatsApp" });
  }
  for (const o of p.offline) {
    const by = o.recordedBy === col.ownerId ? "organiser" : "the payer (claim)";
    timeline.push({
      at: o.createdAt,
      what: `${amt(o.amountCents)} ${o.method.replace("_", " ")} paid outside SarafuPay, recorded by ${by} (${o.id}; status ${o.status}, check ${o.checkStatus}${o.checkNote ? `: ${o.checkNote}` : ""})`,
    });
  }

  // Ask the provider about anything still pending: its webhook may never have reached us.
  const live = new Map<string, string>();
  let recovered: Contribution | undefined;
  for (const c of p.contributions.filter((c) => c.status === "pending").slice(0, 3)) {
    try {
      if (c.provider === "snippe" && c.providerRef) {
        const s = await deps.snippeSession(c.providerRef);
        live.set(c.id, `Snippe says ${s.status}`);
        const after = await applySnippePayment({ contributionId: c.id, status: s.status, amountTzs: s.amountTzs });
        if (after) Object.assign(c, after);
      } else if (c.provider === "paypal" && c.paypalOrderId) {
        const o = await deps.paypalOrder(c.paypalOrderId);
        live.set(c.id, `PayPal says ${o.status}`);
        const after =
          o.status === "COMPLETED"
            ? await applyCapture({ orderId: c.paypalOrderId, status: o.status, captureId: o.captureId, customId: o.customId ?? c.id, payerEmail: o.payerEmail, settled: o.settled })
            : o.status === "APPROVED"
              ? await settleOrder(c.paypalOrderId)
              : undefined;
        if (after) Object.assign(c, after);
      }
      if (c.status === "paid") recovered = c;
    } catch {
      live.set(c.id, `couldn't reach ${c.provider === "snippe" ? "Snippe" : "PayPal"} just now`);
    }
  }

  const ids = p.contributions.map((c) => c.id);
  const refs = p.contributions.flatMap((c) => [c.providerRef, c.paypalOrderId]).filter((r): r is string => Boolean(r));
  const events = ids.length
    ? await db
        .select()
        .from(processedEvents)
        .where(or(inArray(processedEvents.contributionId, ids), refs.length ? inArray(processedEvents.ref, refs) : undefined))
    : [];
  for (const c of p.contributions) {
    const via = c.provider === "snippe" ? "mobile money (Snippe)" : "card/PayPal";
    timeline.push({ at: c.createdAt, what: `Pay link created for ${amt(c.amountCents)} by ${via}` });
    if (c.providerRef || c.paypalOrderId) timeline.push({ at: c.createdAt, what: `Checkout started at ${c.provider === "snippe" ? "Snippe" : "PayPal"} (${c.providerRef ?? c.paypalOrderId})` });
    for (const e of events.filter((e) => e.contributionId === c.id || e.ref === c.providerRef || e.ref === c.paypalOrderId)) {
      timeline.push({ at: e.createdAt, what: `${e.provider === "snippe" ? "Snippe" : "PayPal"} webhook: ${e.kind}${e.status ? ` (${e.status})` : ""}` });
    }
    if (c.paidAt) timeline.push({ at: c.paidAt, what: `Recorded as paid in the ledger; receipt sent` });
    if (live.has(c.id)) timeline.push({ at: new Date(), what: `Checked just now: ${live.get(c.id)}` });
  }
  timeline.sort((a, b) => a.at.getTime() - b.at.getTime());

  // Diagnose, most decisive fact first.
  const openPledge = p.pledges.find((x) => x.status === "open");
  const paid = p.contributions.find((c) => c.status === "paid");
  const latest = p.contributions[0];
  const claim = p.offline.find((o) => o.status === "claimed");
  const flagged = p.offline.find((o) => o.status !== "rejected" && o.checkStatus !== "ok");
  const today = new Date().toISOString().slice(0, 10);
  let diagnosis: Diagnosis;
  let why: string;
  if (recovered) {
    diagnosis = "recovered_now";
    why = `${p.name} did pay ${amt(recovered.amountCents)}: the provider confirms it, but its webhook never reached SarafuPay. It is now recorded and the receipt has gone out.`;
  } else if (paid && !openPledge) {
    const seen = events.some((e) => e.contributionId === paid.id || e.ref === paid.providerRef || e.ref === paid.paypalOrderId);
    diagnosis = "paid";
    why = `${p.name} has paid ${amt(paid.amountCents)} by ${paid.provider === "snippe" ? "mobile money" : "card/PayPal"} on ${when(paid.paidAt)}${paid.providerRef || paid.paypalCaptureId ? ` (ref ${paid.providerRef ?? paid.paypalCaptureId})` : ""}.${seen ? "" : " No provider webhook is on file for it; the safety-net check or the return page recorded it."}`;
  } else if (flagged) {
    diagnosis = "offline_flagged";
    why = `A payment of ${amt(flagged.amountCents)} recorded outside SarafuPay did not pass the checks (${flagged.checkStatus}${flagged.checkNote ? `: ${flagged.checkNote}` : ""}). The organiser should look at its evidence card before counting it (${flagged.id}).`;
  } else if (claim) {
    diagnosis = "offline_waiting";
    why = `${p.name} says they paid ${amt(claim.amountCents)} by ${claim.method.replace("_", " ")} outside SarafuPay. It is waiting for the organiser to confirm or reject it (${claim.id}).`;
  } else if (latest?.status === "pending" && (latest.providerRef || latest.paypalOrderId)) {
    diagnosis = "waiting_on_payer";
    why =
      latest.provider === "snippe"
        ? `${p.name} started a mobile money payment of ${amt(latest.amountCents)} on ${when(latest.createdAt)}, but has not approved it on their phone yet (no PIN entered). ${live.get(latest.id) ?? "Snippe has not confirmed it"}; no webhook has said it completed.`
        : `${p.name} opened PayPal checkout for ${amt(latest.amountCents)} on ${when(latest.createdAt)} but did not finish approving it. ${live.get(latest.id) ?? ""}`.trim();
  } else if (latest?.status === "failed" && !paid) {
    const last = events.filter((e) => e.contributionId === latest.id || e.ref === latest.providerRef).at(-1);
    diagnosis = "failed";
    why = `${p.name}'s last payment attempt (${amt(latest.amountCents)}, ${when(latest.createdAt)}) ${last?.status ? `ended as "${last.status}"` : "did not go through"}. Nothing was collected, so they need to try again.`;
  } else if (latest?.status === "pending") {
    diagnosis = "link_not_opened";
    why = `A pay link for ${amt(latest.amountCents)} was made on ${when(latest.createdAt)}, but ${p.name} never started paying with it.`;
  } else if (openPledge) {
    const overdue = openPledge.dueDate && openPledge.dueDate < today;
    diagnosis = "pledged_not_started";
    why = `${p.name} pledged ${amt(openPledge.amountCents)}${openPledge.dueDate ? ` due ${openPledge.dueDate}${overdue ? " (overdue)" : ""}` : ""} and has not started a payment yet.${openPledge.remindedAt ? ` Last reminded ${when(openPledge.remindedAt)}.` : " Never reminded."}`;
  } else {
    diagnosis = "not_found";
    why = `Nothing outstanding for ${p.name}.`;
  }

  const out: Case = { name: p.name, diagnosis, why, timeline: timeline.map((x) => ({ at: when(x.at), what: x.what })) };
  if (NEEDS_REMINDER.includes(diagnosis)) {
    const u = p.userId ? await getUser(p.userId) : undefined;
    if (!u) {
      out.no_draft_reason = `${p.name} has never chatted with SarafuPay, so we can't message them. The organiser can forward a pay link personally.`;
    } else {
      const amountCents = openPledge?.amountCents ?? latest!.amountCents;
      const L = await langOf(u.phone);
      const text = reminderText(L, diagnosis, p.name, money(amountCents, col.currency), col.title, openPledge?.dueDate);
      await db.delete(reminderDrafts).where(and(eq(reminderDrafts.collectionId, col.id), eq(reminderDrafts.userId, u.id), eq(reminderDrafts.status, "draft")));
      const [d] = await db
        .insert(reminderDrafts)
        .values({ id: newId("rmd"), collectionId: col.id, createdBy: organiser.id, userId: u.id, pledgeId: openPledge?.id ?? null, displayName: p.name, amountCents, text })
        .returning();
      out.draft = { id: d!.id, to: p.name, language: L, preview: `${text}\n${t(L, "[kiungo kipya cha kulipia]", "[fresh pay link]")}` };
    }
  }
  return out;
}

function reminderText(L: Lang, d: Diagnosis, name: string, amt: string, title: string, due?: string | null): string {
  if (d === "waiting_on_payer")
    return t(
      L,
      `👋 Habari ${name}, tuliona ulianza kulipa ${amt} kwa *${title}*, lakini bado hatujapokea uthibitisho. Kama bado hujamaliza, unaweza kulipa hapa kwa usalama:`,
      `👋 Hi ${name}, we saw you started paying ${amt} to *${title}*, but it hasn't been confirmed yet. If you haven't finished, you can pay securely here:`,
    );
  if (d === "failed")
    return t(
      L,
      `👋 Habari ${name}, malipo yako ya ${amt} kwa *${title}* hayakukamilika, kwa hiyo hakuna pesa iliyopokelewa. Unaweza kujaribu tena hapa:`,
      `👋 Hi ${name}, your payment of ${amt} to *${title}* didn't go through, so nothing was collected. You can try again here:`,
    );
  return t(
    L,
    `👋 Habari ${name}, kumbusho la kirafiki kuhusu ahadi yako ya ${amt} kwa *${title}*${due ? ` (tarehe ${due})` : ""}. Lipa hapa kwa usalama:`,
    `👋 Hi ${name}, a friendly reminder about your pledge of ${amt} to *${title}*${due ? ` (due ${due})` : ""}. Pay securely here:`,
  );
}

/**
 * Sends drafts the organiser approved. Each draft goes once, to the person it was written for,
 * with a fresh pay link. Drafts expire after 24 hours, so an old "yes" can't send a stale message.
 */
export async function sendReminderDrafts(
  col: Collection,
  draftIds: string[],
  editedText?: string,
): Promise<{ sent: string[]; unreachable: { name: string; reason: string; pay_link: string }[]; not_found: string[] }> {
  const db = await getDb();
  const rows = draftIds.length ? await db.select().from(reminderDrafts).where(inArray(reminderDrafts.id, draftIds)) : [];
  const fresh = rows.filter((r) => r.collectionId === col.id && r.status === "draft" && Date.now() - r.createdAt.getTime() < 24 * 60 * 60_000);
  const result = { sent: [] as string[], unreachable: [] as { name: string; reason: string; pay_link: string }[], not_found: draftIds.filter((id) => !fresh.some((r) => r.id === id)) };
  for (const r of fresh) {
    // Claim the draft first, so a double "yes" can't send it twice.
    const [claimed] = await db
      .update(reminderDrafts)
      .set({ status: "sent", sentAt: new Date() })
      .where(and(eq(reminderDrafts.id, r.id), eq(reminderDrafts.status, "draft")))
      .returning();
    if (!claimed) continue;
    const u = await getUser(r.userId);
    if (!u) continue;
    const ctb = await createContribution({ collection: col, contributorId: u.id, displayName: r.displayName, amountCents: r.amountCents, source: u.channel === "sim" ? "sim" : "whatsapp" });
    const L = await langOf(u.phone);
    const body = (fresh.length === 1 && editedText?.trim()) || r.text;
    const sent = await sendTo(u.phone, `${body}\n${payUrl(ctb.id)}`);
    const pledge = r.pledgeId ? (await db.select().from(pledges).where(eq(pledges.id, r.pledgeId)))[0] : undefined;
    const delivered = await withReminderTemplate(sent, u.phone, L, [r.displayName, money(r.amountCents, col.currency), col.title, pledge?.dueDate ?? t(L, "haijawekwa", "not set")], ctb.id);
    if (delivered.ok) {
      if (r.pledgeId) await db.update(pledges).set({ remindedAt: new Date() }).where(eq(pledges.id, r.pledgeId));
      result.sent.push(r.displayName);
    } else {
      await db.update(reminderDrafts).set({ status: "unreachable" }).where(eq(reminderDrafts.id, r.id));
      result.unreachable.push({
        name: r.displayName,
        reason: !sent.ok && sent.reason === "outside_24h" ? "has not messaged SarafuPay in the last 24 hours (WhatsApp rule)" : "WhatsApp did not accept the message",
        pay_link: payUrl(ctb.id),
      });
    }
  }
  return result;
}
