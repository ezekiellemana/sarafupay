import "server-only";
import { timingSafeEqual } from "node:crypto";
import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { env } from "../env";

/** Constant-time check of the ?key= on admin pages. No ADMIN_KEY set = admin disabled. */
export function isAdmin(key: unknown): boolean {
  const want = env.adminKey();
  if (!want || typeof key !== "string" || !key) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type RevenueRow = { currency: string; kind: "payments" | "payouts"; count: number; grossCents: number; providerCents: number; sarafuCents: number };

/** SarafuPay's earnings and provider costs, per currency, from settled payments and completed payouts. */
export async function revenue(): Promise<RevenueRow[]> {
  const db = await getDb();
  const c = schema.contributions;
  const p = schema.payouts;
  const pay = await db
    .select({
      currency: c.currency,
      count: sql<number>`count(*)::int`,
      gross: sql<number>`coalesce(sum(${c.amountCents}), 0)::bigint`,
      provider: sql<number>`coalesce(sum(${c.providerFeeCents}), 0)::bigint`,
      sarafu: sql<number>`coalesce(sum(${c.sarafuFeeCents}), 0)::bigint`,
    })
    .from(c)
    .where(sql`${c.status} = 'paid'`)
    .groupBy(c.currency);
  const out = await db
    .select({
      currency: p.currency,
      count: sql<number>`count(*)::int`,
      gross: sql<number>`coalesce(sum(${p.amountCents}), 0)::bigint`,
      provider: sql<number>`coalesce(sum(${p.providerFeeCents}), 0)::bigint`,
      sarafu: sql<number>`coalesce(sum(${p.sarafuFeeCents}), 0)::bigint`,
    })
    .from(p)
    .where(sql`${p.status} = 'success'`)
    .groupBy(p.currency);
  const row = (kind: RevenueRow["kind"]) => (r: (typeof pay)[number]): RevenueRow => ({
    currency: r.currency,
    kind,
    count: Number(r.count),
    grossCents: Number(r.gross),
    providerCents: Number(r.provider),
    sarafuCents: Number(r.sarafu),
  });
  return [...pay.map(row("payments")), ...out.map(row("payouts"))];
}

export async function recentActivity(limit = 15) {
  const db = await getDb();
  const [contribs, pays] = await Promise.all([
    db.select().from(schema.contributions).orderBy(desc(schema.contributions.createdAt)).limit(limit),
    db.select().from(schema.payouts).orderBy(desc(schema.payouts.createdAt)).limit(limit),
  ]);
  return { contribs, pays };
}
