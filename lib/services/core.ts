import "server-only";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Collection, Contribution, Payout, User } from "../db/schema";
import { money, newId, pct, progressBar, randomDigits, slugCode } from "../format";
import { sendTo } from "../channels/messaging";
import { sendWhatsAppTemplate, type SendResult } from "../channels/whatsapp";
import { env } from "../env";
import { captureOrder, createContributionOrder } from "../paypal/orders";
import { getPayoutBatch, sendPayout } from "../paypal/payouts";
import { PayPalApiError } from "../paypal/client";
import * as snippe from "../snippe/client";
import { dashboardUrl, payUrl } from "./links";
import { langOf, t, type Lang } from "../i18n";
import { payoutRail, quotePayment, quotePayout, railCurrency, type PayoutMethod, type Quote, type Rail } from "../pricing";
import { getRates } from "./settings";
import { isPaypalCurrency, minPayCents, SETTLE_CURRENCY, type Settlement } from "../currency";

const { users, collections, contributions, pledges, payouts } = schema;

// ---------- users ----------

export async function getOrCreateUser(phone: string, channel: "whatsapp" | "sim", profileName?: string): Promise<User> {
  const db = await getDb();
  const [existing] = await db.select().from(users).where(eq(users.phone, phone));
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({ id: newId("usr"), phone, channel, name: null })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db.select().from(users).where(eq(users.phone, phone));
  void profileName;
  return again!;
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u;
}

export async function updateUser(id: string, patch: Partial<Pick<User, "name" | "paypalEmail" | "activeCollectionId" | "replyVoice">>) {
  const db = await getDb();
  const [u] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  if (patch.name) {
    // Someone who pledged or started paying before telling us their name shows up by name from now on.
    await db
      .update(pledges)
      .set({ displayName: patch.name })
      .where(and(eq(pledges.userId, id), eq(pledges.status, "open"), eq(pledges.displayName, "Anonymous")));
    await db
      .update(contributions)
      .set({ displayName: patch.name })
      .where(and(eq(contributions.contributorId, id), eq(contributions.status, "pending"), eq(contributions.displayName, "Anonymous")));
  }
  return u;
}

// ---------- collections ----------

export async function findCollection(code: string): Promise<Collection | undefined> {
  const db = await getDb();
  const [c] = await db
    .select()
    .from(collections)
    .where(eq(sql`upper(${collections.code})`, code.trim().toUpperCase()));
  return c;
}

export async function getCollectionById(id: string): Promise<Collection | undefined> {
  const db = await getDb();
  const [c] = await db.select().from(collections).where(eq(collections.id, id));
  return c;
}

export async function listOwnedCollections(ownerId: string): Promise<Collection[]> {
  const db = await getDb();
  return db.select().from(collections).where(eq(collections.ownerId, ownerId)).orderBy(desc(collections.createdAt));
}

export async function createCollection(input: {
  ownerId: string;
  title: string;
  purpose?: string;
  category?: string;
  targetCents: number;
  currency?: string;
  deadline?: string;
  payoutEmail?: string;
}): Promise<Collection> {
  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const [c] = await db
      .insert(collections)
      .values({
        id: newId("col"),
        code: slugCode(input.title),
        ownerId: input.ownerId,
        title: input.title.trim().slice(0, 120),
        purpose: input.purpose?.trim().slice(0, 500) || null,
        category: input.category ?? "other",
        targetCents: input.targetCents,
        currency: (input.currency ?? "TZS").toUpperCase(),
        deadline: input.deadline || null,
        payoutEmail: input.payoutEmail || null,
        ownerKey: crypto.randomUUID().replace(/-/g, ""),
      })
      .onConflictDoNothing()
      .returning();
    if (c) return c;
  }
  throw new Error("Could not allocate a collection code");
}

export async function updateCollection(
  id: string,
  patch: Partial<Pick<Collection, "title" | "purpose" | "targetCents" | "deadline" | "payoutEmail" | "status" | "autopilot">>,
) {
  const db = await getDb();
  const [c] = await db.update(collections).set(patch).where(eq(collections.id, id)).returning();
  return c;
}

/** Balance on one rail (TZS via Snippe, USD via PayPal). Never converted into each other. */
export type RailBalance = {
  currency: string;
  /** What contributors paid (gross). */
  raisedCents: number;
  /** What reached the balance after provider and SarafuPay fees. */
  netCents: number;
  paidCount: number;
  paidOutCents: number;
  inFlightCents: number;
  availableCents: number;
};

export type CollectionStats = {
  /** Totals in the collection's own currency (progress towards the target uses these). */
  raisedCents: number;
  paidCount: number;
  pendingCount: number;
  paidOutCents: number;
  inFlightCents: number;
  availableCents: number;
  openPledgeCents: number;
  openPledgeCount: number;
  percent: number;
  /** One entry per currency that has money in it, main currency first. */
  balances: RailBalance[];
};

export async function collectionStats(c: Collection): Promise<CollectionStats> {
  const db = await getDb();
  const contrib = await db
    .select({
      currency: contributions.currency,
      raised: sql<number>`coalesce(sum(case when ${contributions.status} = 'paid' then ${contributions.amountCents} else 0 end), 0)::bigint`,
      net: sql<number>`coalesce(sum(case when ${contributions.status} = 'paid' then coalesce(${contributions.netCents}, ${contributions.amountCents}) else 0 end), 0)::bigint`,
      paid: sql<number>`count(*) filter (where ${contributions.status} = 'paid')::int`,
      pending: sql<number>`count(*) filter (where ${contributions.status} = 'pending')::int`,
    })
    .from(contributions)
    .where(eq(contributions.collectionId, c.id))
    .groupBy(contributions.currency);
  const po = await db
    .select({
      currency: payouts.currency,
      done: sql<number>`coalesce(sum(case when ${payouts.status} = 'success' then ${payouts.amountCents} else 0 end), 0)::bigint`,
      flight: sql<number>`coalesce(sum(case when ${payouts.status} = 'processing' then ${payouts.amountCents} else 0 end), 0)::bigint`,
    })
    .from(payouts)
    .where(eq(payouts.collectionId, c.id))
    .groupBy(payouts.currency);
  const [pl] = await db
    .select({
      cents: sql<number>`coalesce(sum(${pledges.amountCents}), 0)::bigint`,
      n: sql<number>`count(*)::int`,
    })
    .from(pledges)
    .where(and(eq(pledges.collectionId, c.id), eq(pledges.status, "open")));
  const currencies = new Set<string>([c.currency, ...contrib.map((r) => r.currency), ...po.map((r) => r.currency)]);
  const balances: RailBalance[] = [...currencies].map((cur) => {
    const k = contrib.find((r) => r.currency === cur);
    const p = po.find((r) => r.currency === cur);
    const net = Number(k?.net ?? 0);
    const paidOut = Number(p?.done ?? 0);
    const inFlight = Number(p?.flight ?? 0);
    return {
      currency: cur,
      raisedCents: Number(k?.raised ?? 0),
      netCents: net,
      paidCount: Number(k?.paid ?? 0),
      paidOutCents: paidOut,
      inFlightCents: inFlight,
      availableCents: net - paidOut - inFlight,
    };
  });
  const main = balances.find((b) => b.currency === c.currency)!;
  const others = balances.filter((b) => b.currency !== c.currency && (b.raisedCents || b.paidOutCents || b.inFlightCents));
  return {
    raisedCents: main.raisedCents,
    paidCount: balances.reduce((n, b) => n + b.paidCount, 0),
    pendingCount: contrib.reduce((n, r) => n + Number(r.pending ?? 0), 0),
    paidOutCents: main.paidOutCents,
    inFlightCents: main.inFlightCents,
    availableCents: main.availableCents,
    openPledgeCents: Number(pl?.cents ?? 0),
    openPledgeCount: Number(pl?.n ?? 0),
    percent: pct(main.raisedCents, c.targetCents),
    balances: [main, ...others],
  };
}

/** Balance on the rail a payout method uses. */
export function balanceFor(stats: CollectionStats, currency: string): RailBalance {
  return (
    stats.balances.find((b) => b.currency === currency) ?? {
      currency,
      raisedCents: 0,
      netCents: 0,
      paidCount: 0,
      paidOutCents: 0,
      inFlightCents: 0,
      availableCents: 0,
    }
  );
}

export function statusLine(c: Collection, s: CollectionStats, lang: Lang = "en"): string {
  const raised = money(s.raisedCents, c.currency);
  const target = money(c.targetCents, c.currency);
  const extra = s.balances
    .filter((b) => b.currency !== c.currency && b.raisedCents > 0)
    .map((b) => t(lang, ` + ${money(b.raisedCents, b.currency)} kwa kadi/PayPal`, ` + ${money(b.raisedCents, b.currency)} by card/PayPal`))
    .join("");
  return `${progressBar(s.raisedCents, c.targetCents)} ${s.percent}% · ${t(
    lang,
    `${raised} kati ya ${target}${extra} kutoka kwa wachangiaji ${s.paidCount}`,
    `${raised} of ${target}${extra} from ${s.paidCount} contributor${s.paidCount === 1 ? "" : "s"}`,
  )}`;
}

export async function listContributions(collectionId: string, status?: string) {
  const db = await getDb();
  return db
    .select()
    .from(contributions)
    .where(status ? and(eq(contributions.collectionId, collectionId), eq(contributions.status, status)) : eq(contributions.collectionId, collectionId))
    .orderBy(desc(contributions.createdAt));
}

export type Supporter = { id: string; name: string; message: string | null; paidAt: Date };

/**
 * Public, paginated supporters list. Only first names, messages and times leave the server.
 * `q` matches names (substring) or a payer's PayPal email — but email only as an exact,
 * case-insensitive match, so the public page can't be used to harvest or guess emails.
 */
export async function searchSupporters(
  collectionId: string,
  opts: { q?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: Supporter[]; total: number; page: number; pages: number; byEmail: boolean }> {
  const db = await getDb();
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 8));
  const q = (opts.q ?? "").trim().slice(0, 120);
  const byEmail = q.includes("@");
  const base = and(eq(contributions.collectionId, collectionId), eq(contributions.status, "paid"));
  const where = !q
    ? base
    : byEmail
      ? and(base, sql`lower(${contributions.payerEmail}) = ${q.toLowerCase()}`)
      : and(base, sql`${contributions.displayName} ilike ${"%" + q.replace(/[\\%_]/g, (m) => "\\" + m) + "%"}`);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(contributions).where(where);
  const total = Number(n ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pages, Math.max(1, Math.floor(opts.page ?? 1)));
  const rows = await db
    .select({
      id: contributions.id,
      name: contributions.displayName,
      message: contributions.message,
      paidAt: sql<Date>`coalesce(${contributions.paidAt}, ${contributions.createdAt})`,
    })
    .from(contributions)
    .where(where)
    .orderBy(desc(sql`coalesce(${contributions.paidAt}, ${contributions.createdAt})`))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    items: rows.map((r) => ({
      id: r.id,
      name: firstName(r.name),
      message: r.message?.trim() || null,
      paidAt: new Date(r.paidAt),
    })),
    total,
    page,
    pages,
    byEmail,
  };
}

/** "Mary (London)" → "Mary", "baraka's uncle" → "Baraka's". Public pages show first names only. */
export function firstName(name: string): string {
  const w = name.trim().split(/\s+/)[0] ?? "";
  return w ? w[0].toUpperCase() + w.slice(1) : "Anonymous";
}

export async function listPledges(collectionId: string) {
  const db = await getDb();
  return db.select().from(pledges).where(eq(pledges.collectionId, collectionId)).orderBy(asc(pledges.createdAt));
}

export async function listPayouts(collectionId: string) {
  const db = await getDb();
  return db.select().from(payouts).where(eq(payouts.collectionId, collectionId)).orderBy(desc(payouts.createdAt));
}

// ---------- contributions ----------

/** Per-payment limits on each rail (provider minimums; maximums guard against typos). */
export const RAIL_LIMITS: Record<Rail, { minCents: number; maxCents: number }> = {
  snippe: { minCents: 500_00, maxCents: 5_000_000_00 }, // TZS 500 (Snippe minimum) – TZS 5,000,000
  paypal: { minCents: 1_00, maxCents: 10_000_00 }, // $1 – $10,000
};

export function checkRailAmount(rail: Rail, amountCents: number) {
  const lim = RAIL_LIMITS[rail];
  const cur = railCurrency(rail);
  if (!Number.isFinite(amountCents) || amountCents < lim.minCents) throw new Error(`Minimum is ${money(lim.minCents, cur)}`);
  if (amountCents > lim.maxCents) throw new Error(`Maximum single payment is ${money(lim.maxCents, cur)}`);
}

/** The rail a contribution in this currency uses: TZS → Snippe mobile money, anything else → PayPal. */
export const railForCurrency = (currency: string): Rail => (currency.toUpperCase() === "TZS" ? "snippe" : "paypal");

export async function createContribution(input: {
  collection: Collection;
  contributorId?: string | null;
  displayName: string;
  amountCents: number;
  source: "whatsapp" | "sim" | "web";
  message?: string;
  /** Defaults to the rail of the collection's currency. */
  provider?: Rail;
  payerPhone?: string;
  /**
   * The currency the payer pays in (card/PayPal only; mobile money is TZS). amountCents is in this
   * currency. Non-USD card payments settle in USD at capture, when PayPal reports the converted amount.
   */
  payCurrency?: string;
}): Promise<Contribution> {
  if (input.collection.status !== "active") throw new Error("This collection is closed");
  const rail = input.provider ?? railForCurrency(input.collection.currency);
  const settleCur = SETTLE_CURRENCY[rail];
  const payCur = (input.payCurrency ?? settleCur).toUpperCase();
  if (rail === "snippe" && payCur !== "TZS") throw new Error("Mobile money is paid in TZS");
  if (rail === "paypal" && !isPaypalCurrency(payCur)) throw new Error(`Card payments in ${payCur} are not supported`);
  const converted = payCur !== settleCur;
  if (converted) {
    if (!Number.isFinite(input.amountCents) || input.amountCents < minPayCents(payCur)) throw new Error(`Minimum is ${money(minPayCents(payCur), payCur)}`);
  } else {
    checkRailAmount(rail, input.amountCents);
  }
  const db = await getDb();
  const [row] = await db
    .insert(contributions)
    .values({
      id: newId("ctb"),
      collectionId: input.collection.id,
      contributorId: input.contributorId ?? null,
      displayName: input.displayName.trim().slice(0, 80) || "Anonymous",
      // Settlement amount; for a converted card payment it is filled in from the capture.
      amountCents: converted ? 0 : input.amountCents,
      currency: railCurrency(rail),
      payCurrency: converted ? payCur : null,
      payAmountCents: converted ? input.amountCents : null,
      provider: rail,
      payerPhone: input.payerPhone ? snippe.normalizeTzPhone(input.payerPhone) : null,
      source: input.source,
      message: input.message?.slice(0, 280) || null,
    })
    .returning();
  return row!;
}

export async function getContribution(id: string) {
  const db = await getDb();
  const [c] = await db.select().from(contributions).where(eq(contributions.id, id));
  return c;
}

/**
 * Where to send the payer for a contribution. PayPal: its checkout (the order is created once, on
 * click). Mobile money has no hosted page: our own page asks for the number and sends the PIN
 * prompt straight to the phone (startMobilePayment).
 */
export async function startCheckout(contributionId: string): Promise<string> {
  const db = await getDb();
  const ctb = await getContribution(contributionId);
  if (!ctb) throw new Error("Unknown payment link");
  if (ctb.status !== "pending") throw new Error("This payment link has already been used");
  const col = await getCollectionById(ctb.collectionId);
  if (!col || col.status !== "active") throw new Error("This collection is closed");
  if (ctb.provider === "snippe") return `/pay/${ctb.id}/mobile`;
  const order = await createContributionOrder({
    contributionId: ctb.id,
    amountCents: ctb.payAmountCents ?? ctb.amountCents,
    currency: ctb.payCurrency ?? ctb.currency,
    collectionTitle: col.title,
    collectionCode: col.code,
  });
  await db.update(contributions).set({ paypalOrderId: order.orderId }).where(eq(contributions.id, ctb.id));
  return order.approveUrl;
}

/**
 * Sends the PIN prompt for a mobile money contribution straight to `phone` (USSD push). Asking
 * again for the same number re-sends the prompt of the same payment; a new number starts a new one.
 */
export async function startMobilePayment(contributionId: string, phoneRaw: string): Promise<Contribution> {
  const db = await getDb();
  const ctb = await getContribution(contributionId);
  if (!ctb || ctb.provider !== "snippe") throw new Error("Unknown payment link");
  if (ctb.status !== "pending") throw new Error("This payment link has already been used");
  const col = await getCollectionById(ctb.collectionId);
  if (!col || col.status !== "active") throw new Error("This collection is closed");
  const phone = snippe.normalizeTzPhone(phoneRaw);
  if (ctb.providerRef) {
    // Never start a second payment while the first may already have gone through.
    const prev = await snippe.getPayment(ctb.providerRef).catch(() => null);
    if (prev?.status === "completed") return (await applySnippePayment({ contributionId: ctb.id, status: "completed", amountTzs: prev.amountTzs })) ?? ctb;
    if (prev?.status === "pending" && ctb.payerPhone === phone) {
      const again = await snippe.repush(ctb.providerRef).then(
        () => true,
        () => false,
      );
      if (again) return ctb;
    }
  }
  const pay = await snippe.requestPayment({
    contributionId: ctb.id,
    idempotencyKey: `${ctb.id}-${Date.now().toString(36)}`,
    amountTzs: Math.round(ctb.amountCents / 100),
    phone,
    customerName: ctb.displayName,
    customerEmail: ctb.payerEmail ?? undefined,
    webhookUrl: `${env.appUrl()}/api/snippe/webhook`,
  });
  const [row] = await db.update(contributions).set({ providerRef: pay.reference, payerPhone: phone }).where(eq(contributions.id, ctb.id)).returning();
  return row!;
}

/**
 * Marks a pending contribution paid and fixes its fees (provider fee as really charged when the
 * provider reports it, SarafuPay's percentage from the current rates). Idempotent: only the first
 * call settles and notifies.
 */
async function settleContribution(
  key: ReturnType<typeof eq>,
  patch: Partial<typeof contributions.$inferInsert>,
  actualProviderFeeCents?: number,
): Promise<Contribution | undefined> {
  const db = await getDb();
  const [cur] = await db.select().from(contributions).where(key);
  if (!cur) return undefined;
  if (cur.status !== "pending") return cur;
  const rates = await getRates();
  const rail = (cur.provider as Rail) ?? "paypal";
  const amount = patch.amountCents ?? cur.amountCents;
  const q: Quote = quotePayment(rates, rail, amount, actualProviderFeeCents);
  const [updated] = await db
    .update(contributions)
    .set({
      ...patch,
      status: "paid",
      paidAt: new Date(),
      providerFeeCents: q.providerFeeCents,
      sarafuFeeCents: q.sarafuFeeCents,
      netCents: q.netCents,
      rateJson: JSON.stringify(q.rate),
    })
    .where(and(eq(contributions.id, cur.id), eq(contributions.status, "pending")))
    .returning();
  if (updated) await onContributionPaid(updated);
  const [c] = await db.select().from(contributions).where(eq(contributions.id, cur.id));
  return c;
}

/** Captures an approved PayPal order and settles the matching contribution. Idempotent. */
export async function settleOrder(orderId: string): Promise<Contribution | undefined> {
  const result = await captureOrder(orderId);
  return applyCapture({ orderId, status: result.status, captureId: result.captureId, customId: result.customId, payerEmail: result.payerEmail, settled: result.settled });
}

export async function applyCapture(input: {
  orderId?: string;
  status: string;
  captureId?: string;
  customId?: string;
  payerEmail?: string;
  /** The capture's value in the account currency (see paypalSettlement). */
  settled?: Settlement;
}): Promise<Contribution | undefined> {
  const { orderId, status, captureId, customId, payerEmail, settled } = input;
  const db = await getDb();
  const key = customId
    ? eq(contributions.id, customId)
    : orderId
      ? eq(contributions.paypalOrderId, orderId)
      : undefined;
  if (!key) return undefined;
  if (status !== "COMPLETED") {
    const [c] = await db.select().from(contributions).where(key);
    return c;
  }
  const [cur] = await db.select().from(contributions).where(key);
  if (!cur || cur.status !== "pending") return cur;
  // The balance is kept in USD. A capture still in another currency means the account is holding it
  // in that currency (Payment Receiving Preferences not set to convert): leave it pending, loudly.
  if (settled && settled.currency !== cur.currency) {
    console.error(`[paypal] capture ${captureId} for ${cur.id} settled in ${settled.currency}, expected ${cur.currency}. Set PayPal receiving preferences to convert to ${cur.currency}.`);
    return cur;
  }
  if (!settled && cur.payCurrency) {
    console.error(`[paypal] capture ${captureId} for ${cur.id} has no settlement breakdown yet; leaving it pending.`);
    return cur;
  }
  return settleContribution(
    key,
    {
      paypalCaptureId: captureId ?? null,
      payerEmail: payerEmail ?? null,
      ...(orderId ? { paypalOrderId: orderId } : {}),
      ...(settled ? { amountCents: settled.grossCents, fxRate: settled.fxRate ?? null } : {}),
    },
    settled?.feeCents,
  );
}

/**
 * Settles a Snippe mobile money payment. Called from the verified webhook and from the
 * return page / reconcile job (which re-check the session with Snippe first).
 */
export async function applySnippePayment(input: {
  contributionId?: string;
  sessionReference?: string;
  paymentReference?: string;
  status: string;
  amountTzs?: number;
  feeTzs?: number;
  payerPhone?: string;
}): Promise<Contribution | undefined> {
  const db = await getDb();
  const key = input.contributionId
    ? eq(contributions.id, input.contributionId)
    : input.sessionReference
      ? eq(contributions.providerRef, input.sessionReference)
      : undefined;
  if (!key) return undefined;
  const [cur] = await db.select().from(contributions).where(key);
  if (!cur || cur.provider !== "snippe") return cur;
  const st = input.status.toLowerCase();
  if (st === "failed" || st === "expired" || st === "voided" || st === "cancelled") {
    if (cur.status === "pending") await db.update(contributions).set({ status: "failed" }).where(and(eq(contributions.id, cur.id), eq(contributions.status, "pending")));
    const [c] = await db.select().from(contributions).where(eq(contributions.id, cur.id));
    return c;
  }
  if (st !== "completed") return cur;
  // A "completed" can arrive after an "expired"/"failed" we recorded (out-of-order delivery).
  // Snippe's word that money was collected wins: reopen and settle it.
  if (cur.status === "failed") {
    await db.update(contributions).set({ status: "pending" }).where(and(eq(contributions.id, cur.id), eq(contributions.status, "failed")));
    cur.status = "pending";
  }
  // Snippe collects exactly the session amount; a different amount means something is off. Refuse it.
  if (input.amountTzs !== undefined && Math.round(cur.amountCents / 100) !== Math.round(input.amountTzs)) {
    console.error(`[snippe] amount mismatch on ${cur.id}: expected ${cur.amountCents / 100}, got ${input.amountTzs}`);
    return cur;
  }
  let phone: string | null = cur.payerPhone;
  try {
    if (input.payerPhone) phone = snippe.normalizeTzPhone(input.payerPhone);
  } catch {
    /* keep what we had */
  }
  return settleContribution(
    eq(contributions.id, cur.id),
    { payerPhone: phone },
    input.feeTzs !== undefined ? Math.round(input.feeTzs * 100) : undefined,
  );
}

/** Waiting page / reconcile: ask Snippe for the payment status and settle if paid. */
export async function checkSnippeContribution(contributionId: string): Promise<Contribution | undefined> {
  const ctb = await getContribution(contributionId);
  if (!ctb || ctb.provider !== "snippe" || ctb.status !== "pending" || !ctb.providerRef) return ctb;
  const s = await snippe.getPayment(ctb.providerRef);
  return applySnippePayment({ contributionId: ctb.id, status: s.status, amountTzs: s.amountTzs });
}

/** What a contribution was worth: "TZS 50,000", or "€20.00 ($22.23)" for a converted card payment. */
export function paidLabel(ctb: Contribution): string {
  const settled = money(ctb.amountCents, ctb.currency);
  return ctb.payCurrency && ctb.payAmountCents != null ? `${money(ctb.payAmountCents, ctb.payCurrency)} (${settled})` : settled;
}

/** "mobile money via Snippe", "PayPal" — how a contribution was paid, for receipts. */
export function paidVia(ctb: Contribution): string {
  return ctb.provider === "snippe" ? "mobile money via Snippe" : "PayPal";
}

async function onContributionPaid(ctb: Contribution) {
  const col = await getCollectionById(ctb.collectionId);
  if (!col) return;
  const db = await getDb();
  // Fulfil this person's open pledges.
  if (ctb.contributorId) {
    await db
      .update(pledges)
      .set({ status: "fulfilled" })
      .where(and(eq(pledges.collectionId, col.id), eq(pledges.userId, ctb.contributorId), eq(pledges.status, "open")));
  }
  const stats = await collectionStats(col);
  const owner = await getUser(col.ownerId);
  // A card payment in another currency reads "€20.00 ($22.23)": what they paid, then what it added.
  const amount = paidLabel(ctb);
  if (ctb.contributorId) {
    const contributor = await getUser(ctb.contributorId);
    if (contributor) {
      const L = await langOf(contributor.phone);
      const ref = ctb.provider === "snippe" ? ctb.providerRef : (ctb.paypalCaptureId ?? ctb.paypalOrderId);
      const via = ctb.provider === "snippe" ? "Snippe" : "PayPal";
      await sendTo(
        contributor.phone,
        t(
          L,
          `✅ *Malipo yamepokelewa* — asante, ${ctb.displayName}!\n${amount} kwa *${col.title}* (${col.code}).\nKumbukumbu ya ${via}: ${ref}\n\n${statusLine(col, stats, L)}`,
          `✅ *Payment received* — thank you, ${ctb.displayName}!\n${amount} to *${col.title}* (${col.code}).\n${via} ref: ${ref}\n\n${statusLine(col, stats, L)}`,
        ),
      );
    }
  }
  if (owner && owner.id !== ctb.contributorId) {
    const L = await langOf(owner.phone);
    const note = ctb.message ? `\n“${ctb.message}”` : "";
    await sendTo(
      owner.phone,
      t(
        L,
        `💰 *${ctb.displayName}* amechangia ${amount} kwa *${col.code}*${note}\nBaada ya ada: ${money(ctb.netCents ?? ctb.amountCents, ctb.currency)} imeingia kwenye salio.\n${statusLine(col, stats, L)}`,
        `💰 *${ctb.displayName}* contributed ${amount} to *${col.code}*${note}\nAfter fees, ${money(ctb.netCents ?? ctb.amountCents, ctb.currency)} reached the balance.\n${statusLine(col, stats, L)}`,
      ),
    );
  }
  if (owner && ctb.currency === col.currency && stats.raisedCents >= col.targetCents && stats.raisedCents - ctb.amountCents < col.targetCents) {
    const L = await langOf(owner.phone);
    const target = money(col.targetCents, col.currency);
    await sendTo(owner.phone, t(L, `🎉 *${col.title}* imefikia lengo lake la ${target}!`, `🎉 *${col.title}* just reached its target of ${target}!`));
  }
}

// ---------- pledges ----------

const ANON = "Anonymous";
/** A repeat of the same promise (same person, collection and amount) within this window updates it instead. */
const PLEDGE_DEDUP_MS = 30 * 60_000;

export async function createPledge(input: {
  collection: Collection;
  user: User;
  displayName: string;
  amountCents: number;
  dueDate?: string;
}) {
  const db = await getDb();
  // The model sometimes records the same promise twice, e.g. once before and once after the
  // person tells us their name. Treat that as an update, and never notify the organiser twice.
  const [dup] = await db
    .select()
    .from(pledges)
    .where(
      and(
        eq(pledges.collectionId, input.collection.id),
        eq(pledges.userId, input.user.id),
        eq(pledges.amountCents, input.amountCents),
        eq(pledges.status, "open"),
        gt(pledges.createdAt, new Date(Date.now() - PLEDGE_DEDUP_MS)),
      ),
    )
    .orderBy(desc(pledges.createdAt))
    .limit(1);
  if (dup) {
    const patch: Partial<typeof pledges.$inferInsert> = {};
    if (input.displayName && input.displayName !== ANON && input.displayName !== dup.displayName) patch.displayName = input.displayName;
    if (input.dueDate && input.dueDate !== dup.dueDate) patch.dueDate = input.dueDate;
    if (!Object.keys(patch).length) return dup;
    const [u] = await db.update(pledges).set(patch).where(eq(pledges.id, dup.id)).returning();
    return u!;
  }
  const [p] = await db
    .insert(pledges)
    .values({
      id: newId("plg"),
      collectionId: input.collection.id,
      userId: input.user.id,
      displayName: input.displayName,
      amountCents: input.amountCents,
      dueDate: input.dueDate || null,
    })
    .returning();
  const owner = await getUser(input.collection.ownerId);
  if (owner && owner.id !== input.user.id) {
    const L = await langOf(owner.phone);
    const amt = money(input.amountCents, input.collection.currency);
    const due = input.dueDate ? t(L, ` (kufikia ${input.dueDate})`, ` (by ${input.dueDate})`) : "";
    await sendTo(
      owner.phone,
      t(L, `🤞 *${input.displayName}* ameahidi ${amt} kwa *${input.collection.code}*${due}.`, `🤞 *${input.displayName}* pledged ${amt} to *${input.collection.code}*${due}.`),
    );
  }
  return p!;
}

/**
 * Sends a personal WhatsApp reminder with a fresh pay link to each open pledger.
 * A pledge is marked reminded only when WhatsApp accepted the message; pledgers we
 * could not reach (usually: no message from them in 24h, so Meta refuses free text)
 * come back in `unreachable` with their pay link, for the organiser to forward.
 * Sends are spaced ~1s apart to stay inside per-number throughput limits.
 */
export async function remindPledgers(col: Collection, only?: (p: typeof pledges.$inferSelect) => boolean): Promise<{
  reminded: string[];
  skipped: string[];
  unreachable: { name: string; reason: string; pay_link: string }[];
}> {
  const db = await getDb();
  const open = await db
    .select()
    .from(pledges)
    .where(and(eq(pledges.collectionId, col.id), eq(pledges.status, "open")));
  const reminded: string[] = [];
  const skipped: string[] = [];
  const unreachable: { name: string; reason: string; pay_link: string }[] = [];
  let sentToWhatsApp = 0;
  for (const p of only ? open.filter(only) : open) {
    const u = p.userId ? await getUser(p.userId) : undefined;
    if (!u) {
      skipped.push(p.displayName);
      continue;
    }
    const ctb = await createContribution({
      collection: col,
      contributorId: u.id,
      displayName: p.displayName,
      amountCents: p.amountCents,
      source: u.channel === "sim" ? "sim" : "whatsapp",
    });
    const L = await langOf(u.phone);
    const amt = money(p.amountCents, col.currency);
    if (u.channel !== "sim" && sentToWhatsApp++ > 0) await new Promise((r) => setTimeout(r, 1100));
    const sent = await sendTo(
      u.phone,
      t(
        L,
        `👋 Habari ${p.displayName}, kumbusho la kirafiki kuhusu ahadi yako ya ${amt} kwa *${col.title}*${p.dueDate ? ` (tarehe ${p.dueDate})` : ""}.\nLipa hapa kwa usalama: ${payUrl(ctb.id)}`,
        `👋 Hi ${p.displayName}, a friendly reminder about your pledge of ${amt} to *${col.title}*${p.dueDate ? ` (due ${p.dueDate})` : ""}.\nPay securely here: ${payUrl(ctb.id)}`,
      ),
    );
    const delivered = await withReminderTemplate(sent, u.phone, L, [p.displayName, amt, col.title, p.dueDate ?? t(L, "haijawekwa", "not set")], ctb.id);
    if (delivered.ok) {
      await db.update(pledges).set({ remindedAt: new Date() }).where(eq(pledges.id, p.id));
      reminded.push(p.displayName);
    } else {
      unreachable.push({
        name: p.displayName,
        reason: !sent.ok && sent.reason === "outside_24h" ? "has not messaged SarafuPay in the last 24 hours (WhatsApp rule)" : "WhatsApp did not accept the message",
        pay_link: payUrl(ctb.id),
      });
    }
  }
  return { reminded, skipped, unreachable };
}

/**
 * Outside WhatsApp's 24h window free text is refused; an approved reminder template still gets
 * through. `params` fill the template: name, amount, collection title, due date.
 */
export async function withReminderTemplate(sent: SendResult, phone: string, L: Lang, params: string[], contributionId: string): Promise<SendResult> {
  const tpl = env.waReminderTemplate();
  if (!sent.ok && sent.reason === "outside_24h" && tpl && tpl !== "off") {
    return sendWhatsAppTemplate(phone, tpl, L === "sw" ? "sw" : "en", params, contributionId);
  }
  return sent;
}

// ---------- payouts ----------

export type PayoutDestination =
  | { method: "mobile_money"; phone: string; name: string }
  | { method: "bank"; bank: string; account: string; name: string }
  | { method: "paypal"; email: string; name?: string };

/** "Name · mobile money 0712***678" style label for messages; never the full account number. */
export function destinationLabel(p: Payout): string {
  const mask = (v: string) => (v.length > 6 ? `${v.slice(0, 4)}***${v.slice(-3)}` : v);
  if (p.method === "mobile_money") return `${p.recipientName ?? ""} · mobile money ${mask(p.recipientPhone ?? "")}`.trim();
  if (p.method === "bank") return `${p.recipientName ?? ""} · ${p.recipientBank} ${mask(p.recipientAccount ?? "")}`.trim();
  return `${p.recipientName ? p.recipientName + " · " : ""}PayPal ${p.recipientEmail}`;
}

/** Fees for a withdrawal, before it is created (the bot shows this to the organiser). */
export async function quoteWithdrawal(method: PayoutMethod, amountCents: number): Promise<Quote> {
  return quotePayout(await getRates(), method, amountCents);
}

export async function proposePayout(input: {
  collection: Collection;
  requester: User;
  destination: PayoutDestination;
  amountCents: number;
  note?: string;
}): Promise<Payout & { quote: Quote }> {
  const col = input.collection;
  if (col.ownerId !== input.requester.id) throw new Error("Only the collection owner can request payouts");
  const d = input.destination;
  const rail = payoutRail(d.method);
  const currency = railCurrency(rail);
  const stats = await collectionStats(col);
  const bal = balanceFor(stats, currency);
  if (input.amountCents > bal.availableCents) {
    throw new Error(`Insufficient balance: available ${money(bal.availableCents, currency)}`);
  }
  const q = quotePayout(await getRates(), d.method, input.amountCents);
  if (q.netCents <= 0) throw new Error(`That amount is too small: fees would be ${money(q.providerFeeCents + q.sarafuFeeCents, currency)}`);
  // Validate destination details now, so CONFIRM never fails on a typo.
  let phone: string | null = null;
  let bank: string | null = null;
  if (d.method === "mobile_money") phone = snippe.normalizeTzPhone(d.phone);
  if (d.method === "bank") {
    bank = snippe.bankCode(d.bank) ?? null;
    if (!bank) throw new Error(`Unknown bank "${d.bank}". Examples: CRDB, NMB, NBC, ABSA, Equity, Stanbic`);
    if (!/^[0-9A-Za-z-]{6,30}$/.test(d.account.replace(/\s/g, ""))) throw new Error("That account number doesn't look right");
  }
  const db = await getDb();
  // Only one pending confirmation per collection at a time.
  await db
    .update(payouts)
    .set({ status: "cancelled" })
    .where(and(eq(payouts.collectionId, col.id), eq(payouts.status, "awaiting_confirmation")));
  const [p] = await db
    .insert(payouts)
    .values({
      id: newId("pay"),
      collectionId: col.id,
      requestedBy: input.requester.id,
      method: d.method,
      provider: rail,
      recipientEmail: d.method === "paypal" ? d.email.trim().toLowerCase() : null,
      recipientPhone: phone,
      recipientBank: bank,
      recipientAccount: d.method === "bank" ? d.account.replace(/\s/g, "") : null,
      recipientName: d.name?.trim().slice(0, 120) || null,
      amountCents: input.amountCents,
      currency,
      providerFeeCents: q.providerFeeCents,
      sarafuFeeCents: q.sarafuFeeCents,
      netCents: q.netCents,
      rateJson: JSON.stringify(q.rate),
      note: input.note?.trim().slice(0, 300) || null,
      confirmCode: randomDigits(6),
    })
    .returning();
  return { ...p!, quote: q };
}

/**
 * Executes a payout ONLY when the owner's own phone sends "CONFIRM <code>".
 * This path never goes through the LLM.
 */
export async function confirmPayoutByCode(user: User, code: string): Promise<string> {
  const db = await getDb();
  const L = await langOf(user.phone);
  const owned = await listOwnedCollections(user.id);
  if (!owned.length) return t(L, "Huna mchango wowote, kwa hiyo hakuna cha kuthibitisha.", "You don't have any collections, so there is nothing to confirm.");
  const [p] = await db
    .select()
    .from(payouts)
    .where(
      and(
        inArray(payouts.collectionId, owned.map((c) => c.id)),
        eq(payouts.confirmCode, code),
        eq(payouts.status, "awaiting_confirmation"),
      ),
    );
  if (!p) return t(L, "❌ Msimbo huo haulingani na malipo yoyote yanayosubiri. Niombe niandae malipo upya.", "❌ That confirmation code doesn't match any pending payout. Ask me to prepare the payout again.");
  if (Date.now() - new Date(p.createdAt).getTime() > 15 * 60_000) {
    await db.update(payouts).set({ status: "cancelled" }).where(eq(payouts.id, p.id));
    return t(L, "⌛ Ombi hilo la malipo limeisha muda (dakika 15). Niombe niliandae tena.", "⌛ That payout request expired (15 minutes). Ask me to prepare it again.");
  }
  const col = owned.find((c) => c.id === p.collectionId)!;
  const bal = balanceFor(await collectionStats(col), p.currency);
  if (p.amountCents > bal.availableCents) {
    await db.update(payouts).set({ status: "cancelled" }).where(eq(payouts.id, p.id));
    return t(L, `❌ Salio limebadilika — sasa kuna ${money(bal.availableCents, p.currency)} tu.`, `❌ Balance changed — only ${money(bal.availableCents, p.currency)} is available now.`);
  }
  const [locked] = await db
    .update(payouts)
    .set({ status: "processing", executedAt: new Date() })
    .where(and(eq(payouts.id, p.id), eq(payouts.status, "awaiting_confirmation")))
    .returning();
  if (!locked) return t(L, "Malipo haya tayari yanashughulikiwa.", "This payout is already being processed.");
  const net = p.netCents ?? p.amountCents;
  const who = destinationLabel(p);
  const sent = money(net, p.currency);
  const via = p.provider === "snippe" ? "Snippe" : "PayPal";
  try {
    const ref = await submitPayout({ ...p, status: "processing" }, col);
    return t(
      L,
      `🚀 Malipo yametumwa kupitia ${via}: ${sent} → ${who}.\nKumbukumbu ${ref}. Nitathibitisha yakikamilika na kutuma taarifa ya uwazi kwa wachangiaji.`,
      `🚀 Payout sent via ${via}: ${sent} → ${who}.\nRef ${ref}. I'll confirm when it completes and post a transparency update to contributors.`,
    );
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    if (!definitelyRejected(e)) {
      // The provider may have sent the money even though we got no clear answer. Never mark this
      // failed (that would free the balance for a second payout). Keep it processing; the
      // reconcile job re-submits with the same idempotency key, which returns the original result.
      await db.update(payouts).set({ failureReason: `unconfirmed: ${reason}`.slice(0, 500) }).where(eq(payouts.id, p.id));
      schedulePayoutRefresh(p.id);
      return t(
        L,
        `⏳ ${via} haijajibu bado kuhusu malipo ya ${sent} → ${who}. Salio limeshikiliwa na nitathibitisha ndani ya dakika chache. Usiyatume tena.`,
        `⏳ ${via} hasn't answered yet about the ${sent} payout → ${who}. The balance is held and I'll confirm within a few minutes. Please don't send it again.`,
      );
    }
    await db.update(payouts).set({ status: "failed", failureReason: reason.slice(0, 500) }).where(eq(payouts.id, p.id));
    return t(L, `❌ ${via} imekataa malipo: ${reason.slice(0, 200)}. Hakuna pesa iliyohamishwa.`, `❌ ${via} rejected the payout: ${reason.slice(0, 200)}. No money moved.`);
  }
}

/** True only when the provider clearly refused the request (4xx other than timeout/rate limit). */
function definitelyRejected(e: unknown): boolean {
  // "Duplicate" means an earlier attempt with this id went through: never treat that as a refusal.
  if (e instanceof Error && /duplicate/i.test(e.message)) return false;
  const status = e instanceof snippe.SnippeError ? e.status : e instanceof PayPalApiError ? e.status : undefined;
  return status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

/**
 * Sends a processing payout to its provider and stores the provider reference. Idempotent:
 * the payout id is the idempotency key on both Snippe and PayPal, so re-submitting the same
 * payout returns the original result instead of paying twice.
 */
async function submitPayout(p: Payout, col: Collection): Promise<string> {
  const db = await getDb();
  const net = p.netCents ?? p.amountCents;
  if (p.provider === "snippe") {
    const res = await snippe.sendPayout({
      payoutId: p.id,
      amountTzs: Math.round(net / 100),
      recipientName: p.recipientName ?? col.title,
      narration: p.note ?? `SarafuPay payout: ${col.title} (${col.code})`,
      webhookUrl: `${env.appUrl()}/api/snippe/webhook`,
      to:
        p.method === "bank"
          ? { channel: "bank", bank: p.recipientBank!, account: p.recipientAccount! }
          : { channel: "mobile", phone: p.recipientPhone! },
    });
    await db.update(payouts).set({ providerRef: res.reference, failureReason: null }).where(eq(payouts.id, p.id));
    if (res.status === "completed") await finalizePayout({ ...p, providerRef: res.reference }, "success");
    else schedulePayoutRefresh(p.id);
    return res.reference;
  }
  const res = await sendPayout({
    payoutId: p.id,
    amountCents: net,
    currency: p.currency,
    recipientEmail: p.recipientEmail!,
    subject: `Payment from "${col.title}" via SarafuPay`,
    note: p.note ?? `Payout from ${col.title} (${col.code})`,
  });
  await db.update(payouts).set({ paypalBatchId: res.batchId, failureReason: null }).where(eq(payouts.id, p.id));
  schedulePayoutRefresh(p.id);
  return res.batchId;
}

export async function cancelPayoutByCode(user: User, code: string): Promise<string> {
  const db = await getDb();
  const L = await langOf(user.phone);
  const owned = await listOwnedCollections(user.id);
  if (!owned.length) return t(L, "Hakuna cha kughairi.", "Nothing to cancel.");
  const rows = await db
    .update(payouts)
    .set({ status: "cancelled" })
    .where(
      and(
        inArray(payouts.collectionId, owned.map((c) => c.id)),
        eq(payouts.confirmCode, code),
        eq(payouts.status, "awaiting_confirmation"),
      ),
    )
    .returning();
  return rows.length
    ? t(L, "👍 Malipo yameghairiwa. Hakuna pesa iliyohamishwa.", "👍 Payout cancelled. No money moved.")
    : t(L, "Hakuna malipo yanayosubiri yenye msimbo huo.", "No pending payout with that code.");
}

function schedulePayoutRefresh(payoutId: string) {
  for (const delay of [8_000, 30_000, 120_000]) {
    setTimeout(() => void refreshPayout(payoutId).catch((e) => console.error("[payout refresh]", e)), delay);
  }
}

const FINAL_OK = new Set(["SUCCESS"]);
const FINAL_BAD = new Set(["FAILED", "RETURNED", "BLOCKED", "REFUNDED", "REVERSED", "DENIED"]);

/** Pulls payout status from the provider and finalises it (also called from webhooks and reconcile). */
export async function refreshPayout(payoutId: string): Promise<Payout | undefined> {
  const db = await getDb();
  const [p] = await db.select().from(payouts).where(eq(payouts.id, payoutId));
  if (!p || p.status !== "processing") return p;
  if ((p.provider === "snippe" && !p.providerRef) || (p.provider !== "snippe" && !p.paypalBatchId)) {
    // Sent but unanswered: re-submit with the same idempotency key to learn what happened.
    const col = await getCollectionById(p.collectionId);
    if (!col) return p;
    try {
      await submitPayout(p, col);
    } catch (e) {
      if (definitelyRejected(e)) return finalizePayout(p, "failed", undefined, e instanceof Error ? e.message : String(e));
      throw e;
    }
    const [again] = await db.select().from(payouts).where(eq(payouts.id, p.id));
    return again;
  }
  if (p.provider === "snippe") {
    const st = await snippe.getPayout(p.providerRef!);
    return applySnippePayout(p, st.status, st.feeTzs, st.failureReason);
  }
  const state = await getPayoutBatch(p.paypalBatchId!);
  const s = (state.itemStatus ?? "").toUpperCase();
  if (FINAL_OK.has(s)) return finalizePayout(p, "success", state.itemId);
  if (FINAL_BAD.has(s)) return finalizePayout(p, "failed", state.itemId, state.error ?? s);
  // UNCLAIMED: in sandbox this happens when the email has no account — funds are held, treat as failed for clarity.
  if (s === "UNCLAIMED") return finalizePayout(p, "failed", state.itemId, "Recipient email has no PayPal account (unclaimed)");
  return p;
}

/** Snippe payout status → our status. Records the fee Snippe really charged. */
export async function applySnippePayout(p: Payout, status: string, feeTzs?: number, reason?: string): Promise<Payout | undefined> {
  const db = await getDb();
  if (feeTzs !== undefined && p.providerFeeCents !== Math.round(feeTzs * 100)) {
    // The organiser was quoted Snippe's published fee; keep the quote, but log any difference for the admin.
    console.warn(`[snippe] payout ${p.id}: quoted fee ${p.providerFeeCents! / 100}, Snippe charged ${feeTzs}`);
  }
  const s = status.toLowerCase();
  if (s === "completed") return finalizePayout(p, "success");
  if (s === "failed" || s === "reversed") return finalizePayout(p, "failed", undefined, reason ?? `Snippe status: ${s}`);
  const [cur] = await db.select().from(payouts).where(eq(payouts.id, p.id));
  return cur;
}

export async function finalizePayout(p: Payout, status: "success" | "failed", itemId?: string, reason?: string) {
  const db = await getDb();
  const [done] = await db
    .update(payouts)
    .set({ status, paypalItemId: itemId ?? p.paypalItemId, failureReason: reason?.slice(0, 500) ?? null })
    .where(and(eq(payouts.id, p.id), eq(payouts.status, "processing")))
    .returning();
  if (!done) return p;
  const col = await getCollectionById(p.collectionId);
  const owner = col ? await getUser(col.ownerId) : undefined;
  if (!col) return done;
  if (status === "failed") {
    if (owner) {
      const L = await langOf(owner.phone);
      const amt = money(p.amountCents, p.currency);
      await sendTo(
        owner.phone,
        t(L, `⚠️ Malipo ya ${amt} kwenda ${destinationLabel(p)} yameshindwa: ${reason}. Pesa imerudi kwenye salio la mchango.`, `⚠️ Payout of ${amt} to ${destinationLabel(p)} failed: ${reason}. The money is back in the collection balance.`),
      );
    }
    return done;
  }
  const stats = await collectionStats(col);
  const rb = balanceFor(stats, p.currency);
  const amt = money(p.amountCents, p.currency);
  const received = money(p.netCents ?? p.amountCents, p.currency);
  const fees = money((p.providerFeeCents ?? 0) + (p.sarafuFeeCents ?? 0), p.currency);
  const who = p.recipientName ?? (p.method === "paypal" ? p.recipientEmail : "the organiser");
  const raised = money(rb.raisedCents, p.currency);
  const paid = money(rb.paidOutCents, p.currency);
  const bal = money(rb.availableCents, p.currency);
  const via = p.provider === "snippe" ? "Snippe" : "PayPal";
  const ref = p.provider === "snippe" ? done.providerRef : (done.paypalItemId ?? done.paypalBatchId);
  const update = (L: Lang) =>
    t(
      L,
      `🧾 *Taarifa ya uwazi — ${col.title}*\n${amt} imetolewa kwa *${who}*${p.note ? ` kwa ajili ya ${p.note}` : ""} (amepokea ${received}, ada ${fees}).\nZilizochangwa ${raised} · Zilizotolewa ${paid} · Salio ${bal}\nKumbukumbu ya ${via}: ${ref}`,
      `🧾 *Transparency update — ${col.title}*\n${amt} was withdrawn for *${who}*${p.note ? ` for ${p.note}` : ""} (received ${received}, fees ${fees}).\nRaised ${raised} · Withdrawn ${paid} · Balance ${bal}\n${via} ref: ${ref}`,
    );
  if (owner) await sendTo(owner.phone, update(await langOf(owner.phone)));
  // Broadcast to every distinct contributor reachable in chat.
  const contributorIds = await db
    .selectDistinct({ id: contributions.contributorId })
    .from(contributions)
    .where(and(eq(contributions.collectionId, col.id), eq(contributions.status, "paid")));
  for (const { id } of contributorIds) {
    if (!id || id === owner?.id) continue;
    const u = await getUser(id);
    if (u) await sendTo(u.phone, update(await langOf(u.phone)));
  }
  return done;
}

export { dashboardUrl };

/** PayPal invoice for a pledge was paid (webhook): record it as a contribution. */
export async function settlePledgeInvoice(invoiceId: string, invoiceNumber?: string): Promise<void> {
  const db = await getDb();
  const [p] = await db.select().from(pledges).where(eq(pledges.invoiceId, invoiceId));
  if (!p || p.status !== "open") return;
  const [claimed] = await db
    .update(pledges)
    .set({ status: "fulfilled" })
    .where(and(eq(pledges.id, p.id), eq(pledges.status, "open")))
    .returning();
  if (!claimed) return;
  const col = await getCollectionById(p.collectionId);
  if (!col) return;
  const [ctb] = await db
    .insert(contributions)
    .values({
      id: newId("ctb"),
      collectionId: col.id,
      contributorId: p.userId,
      displayName: p.displayName,
      amountCents: p.amountCents,
      currency: col.currency,
      source: "web",
      message: `Paid PayPal invoice ${invoiceNumber ?? invoiceId}`,
      status: "paid",
      paidAt: new Date(),
      paypalOrderId: invoiceId,
    })
    .returning();
  if (ctb) await onContributionPaid(ctb);
}
