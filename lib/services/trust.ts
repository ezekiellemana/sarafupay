import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Collection, OfflineRecord, User } from "../db/schema";
import { money, newId } from "../format";
import { sendTo } from "../channels/messaging";
import { langOf, t } from "../i18n";

/**
 * Trust Copilot: money that reached the organiser outside SarafuPay (cash at the event, a
 * relative's own M-Pesa, a bank deposit), logged from a receipt photo, a voice note or text.
 *
 * These records never touch `contributions`, so they can't inflate the withdrawable balance;
 * they exist so the group's report shows *all* the money, with every record checked:
 * - the same transaction reference twice, or the same photo twice → duplicate
 * - a reference SarafuPay already recorded as a paid contribution → duplicate (counted twice)
 * - an amount that differs from the person's open pledge → mismatch (partial or over)
 * - a currency other than the collection's → review
 */

const { offlineRecords, contributions, pledges, collections } = schema;

export type OfflineInput = {
  collection: Collection;
  by: User;
  displayName: string;
  amountCents: number;
  currency: string;
  method: "cash" | "mobile_money" | "bank" | "other";
  reference?: string | null;
  receivedOn?: string | null;
  evidence: "photo" | "voice" | "text";
  imageHash?: string | null;
};

type Check = { status: "ok" | "duplicate" | "mismatch" | "review"; notes: string[]; pledgeId?: string; fulfilsPledge?: boolean };

const normRef = (r?: string | null) => (r ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "") || null;

async function runChecks(i: OfflineInput): Promise<Check> {
  const db = await getDb();
  const notes: string[] = [];
  let status: Check["status"] = "ok";
  const others = await db
    .select()
    .from(offlineRecords)
    .where(and(eq(offlineRecords.collectionId, i.collection.id), ne(offlineRecords.status, "rejected")));

  const ref = normRef(i.reference);
  if (ref) {
    const same = others.find((o) => normRef(o.reference) === ref);
    if (same) {
      status = "duplicate";
      notes.push(`same reference ${i.reference} as ${same.displayName}'s ${money(same.amountCents, same.currency)} record (${same.id})`);
    }
    const paid = await db
      .select({ id: contributions.id, name: contributions.displayName, ref: contributions.providerRef, cap: contributions.paypalCaptureId })
      .from(contributions)
      .where(and(eq(contributions.collectionId, i.collection.id), eq(contributions.status, "paid")));
    const hit = paid.find((p) => normRef(p.ref) === ref || normRef(p.cap) === ref);
    if (hit) {
      status = "duplicate";
      notes.push(`SarafuPay already received this payment from ${hit.name}; recording it again would count it twice`);
    }
  }
  if (i.imageHash) {
    const samePhoto = others.find((o) => o.imageHash === i.imageHash);
    if (samePhoto) {
      status = "duplicate";
      notes.push(`this exact photo was already used for ${samePhoto.displayName}'s record (${samePhoto.id})`);
    }
  }
  if (i.currency !== i.collection.currency) {
    if (status === "ok") status = "review";
    notes.push(`currency ${i.currency} differs from the collection's ${i.collection.currency}`);
  }

  // Match an open pledge by name.
  const open = await db
    .select()
    .from(pledges)
    .where(and(eq(pledges.collectionId, i.collection.id), eq(pledges.status, "open")));
  const name = i.displayName.trim().toLowerCase();
  const pledge = open.find((p) => p.displayName.trim().toLowerCase() === name) ?? open.find((p) => p.displayName.toLowerCase().includes(name) || name.includes(p.displayName.toLowerCase()));
  let fulfilsPledge = false;
  if (pledge && i.currency === i.collection.currency) {
    if (i.amountCents === pledge.amountCents) {
      fulfilsPledge = true;
      notes.push(`matches ${pledge.displayName}'s pledge exactly`);
    } else {
      if (status === "ok") status = "mismatch";
      notes.push(
        i.amountCents < pledge.amountCents
          ? `partial: pledged ${money(pledge.amountCents, i.collection.currency)}, ${money(pledge.amountCents - i.amountCents, i.collection.currency)} still open`
          : `more than the pledge of ${money(pledge.amountCents, i.collection.currency)}`,
      );
    }
  }
  return { status, notes, pledgeId: pledge?.id, fulfilsPledge };
}

/**
 * Logs money received outside SarafuPay. The owner's records are confirmed at once; anyone else's
 * become a claim the owner is asked to confirm on WhatsApp.
 */
export async function recordOffline(i: OfflineInput): Promise<{ record: OfflineRecord; summary: string }> {
  const db = await getDb();
  const isOwner = i.collection.ownerId === i.by.id;
  const check = await runChecks(i);
  const [record] = await db
    .insert(offlineRecords)
    .values({
      id: newId("off"),
      collectionId: i.collection.id,
      recordedBy: i.by.id,
      displayName: i.displayName.trim().slice(0, 80),
      amountCents: i.amountCents,
      currency: i.currency,
      method: i.method,
      reference: i.reference?.trim() || null,
      receivedOn: i.receivedOn ?? null,
      evidence: i.evidence,
      imageHash: i.imageHash ?? null,
      status: isOwner ? "confirmed" : "claimed",
      checkStatus: check.status,
      checkNote: check.notes.join("; ") || null,
      pledgeId: check.pledgeId ?? null,
    })
    .returning();

  // A clean, owner-confirmed record that pays a pledge in full closes it.
  if (isOwner && check.status === "ok" && check.fulfilsPledge && check.pledgeId) {
    await db.update(pledges).set({ status: "fulfilled" }).where(eq(pledges.id, check.pledgeId));
  }

  if (!isOwner) {
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, i.collection.ownerId));
    if (owner) {
      const L = await langOf(owner.phone);
      await sendTo(
        owner.phone,
        t(
          L,
          `📸 *${record.displayName}* anasema amelipa *${money(record.amountCents, record.currency)}* kwa *${i.collection.title}* nje ya SarafuPay (${record.method}${record.reference ? `, kumb. ${record.reference}` : ""}).${record.checkNote ? `\n🔎 ${record.checkNote}` : ""}\nNiambie "thibitisha ${record.id}" au "kataa ${record.id}".`,
          `📸 *${record.displayName}* says they paid *${money(record.amountCents, record.currency)}* to *${i.collection.title}* outside SarafuPay (${record.method}${record.reference ? `, ref ${record.reference}` : ""}).${record.checkNote ? `\n🔎 ${record.checkNote}` : ""}\nTell me "confirm ${record.id}" or "reject ${record.id}".`,
        ),
      );
    }
  }

  const summary = `${isOwner ? "Recorded" : "Sent to the organiser to confirm"}: ${record.displayName} ${money(record.amountCents, record.currency)} (${record.method}). Check: ${check.status}${check.notes.length ? ` – ${check.notes.join("; ")}` : ""}.`;
  return { record, summary };
}

/** Owner confirms or rejects a contributor's claim (or any record). */
export async function resolveOffline(owner: User, recordId: string, action: "confirm" | "reject"): Promise<string> {
  const db = await getDb();
  const [r] = await db.select().from(offlineRecords).where(eq(offlineRecords.id, recordId));
  if (!r) return `No record ${recordId}.`;
  const [col] = await db.select().from(collections).where(eq(collections.id, r.collectionId));
  if (!col || col.ownerId !== owner.id) return "Only the collection owner can do this.";
  await db.update(offlineRecords).set({ status: action === "confirm" ? "confirmed" : "rejected" }).where(eq(offlineRecords.id, r.id));
  if (action === "confirm" && r.pledgeId && r.checkStatus === "ok") {
    const [p] = await db.select().from(pledges).where(eq(pledges.id, r.pledgeId));
    if (p && p.status === "open" && p.amountCents === r.amountCents) await db.update(pledges).set({ status: "fulfilled" }).where(eq(pledges.id, p.id));
  }
  return `${action === "confirm" ? "Confirmed" : "Rejected"} ${r.displayName}'s ${money(r.amountCents, r.currency)} (${r.id}).`;
}

export type OfflineSummary = {
  confirmed: { currency: string; totalCents: number; count: number }[];
  claimsWaiting: number;
  flagged: { id: string; name: string; amount: string; check: string; note: string | null }[];
  records: OfflineRecord[];
};

export async function offlineSummary(collectionId: string): Promise<OfflineSummary> {
  const db = await getDb();
  const rows = await db.select().from(offlineRecords).where(eq(offlineRecords.collectionId, collectionId));
  const totals = new Map<string, { totalCents: number; count: number }>();
  for (const r of rows) {
    if (r.status !== "confirmed" || r.checkStatus === "duplicate") continue;
    const tt = totals.get(r.currency) ?? { totalCents: 0, count: 0 };
    tt.totalCents += r.amountCents;
    tt.count++;
    totals.set(r.currency, tt);
  }
  return {
    confirmed: [...totals.entries()].map(([currency, v]) => ({ currency, ...v })),
    claimsWaiting: rows.filter((r) => r.status === "claimed").length,
    flagged: rows
      .filter((r) => r.status !== "rejected" && r.checkStatus !== "ok")
      .map((r) => ({ id: r.id, name: r.displayName, amount: money(r.amountCents, r.currency), check: r.checkStatus, note: r.checkNote })),
    records: rows,
  };
}
