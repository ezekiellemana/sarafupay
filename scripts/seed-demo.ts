/**
 * Seeds a realistic demo collection (no PayPal calls) for local UI work and the demo video.
 * Run: npm run seed   (uses DATABASE_URL if set, else local PGlite)
 */
import * as core from "../lib/services/core";
import { getDb, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { dashboardUrl, collectionUrl } from "../lib/services/links";

async function main() {
  const db = await getDb();
  const owner = await core.getOrCreateUser("sim:255700000101", "sim");
  await core.updateUser(owner.id, { name: "Enzo" });
  const col = await core.createCollection({
    ownerId: owner.id,
    title: "Harusi ya Neema & Baraka",
    purpose: "Venue, catering and the choir for Neema and Baraka's wedding. Asanteni!",
    category: "wedding",
    targetCents: 3_000_000_00,
    currency: "TZS",
    deadline: "2026-12-20",
  });
  // Mobile money contributions in TZS, settled through the real Snippe path (fees computed, no network).
  const people = [
    ["Amina", 50_000, "sim", "Hongera sana!"], ["John", 20_000, "web", ""], ["Fatuma", 100_000, "sim", "Mungu awabariki"],
    ["Baraka's uncle", 300_000, "sim", ""], ["Grace", 15_000, "web", "🎉"], ["Juma", 50_000, "sim", ""],
    ["Halima", 60_000, "sim", "Karibu familia"], ["Peter", 30_000, "sim", ""], ["Kelvin", 25_000, "web", ""],
    ["Rehema", 120_000, "sim", "Furaha tele"], ["Daudi", 45_000, "sim", ""], ["Zuhura", 200_000, "web", "Hongereni!"],
  ] as const;
  let day = 0;
  for (const [name, tzs, ch, msg] of people) {
    const u = await core.getOrCreateUser(`sim:2557${String(10000000 + day * 7919)}`, "sim");
    await core.updateUser(u.id, { name });
    const c = await core.createContribution({ collection: col, contributorId: u.id, displayName: name, amountCents: tzs * 100, source: ch, message: msg || undefined });
    await core.applySnippePayment({ contributionId: c.id, status: "completed", amountTzs: tzs });
    const paidAt = new Date(Date.now() - (12 - day) * 86400000 * 1.5);
    await db.update(schema.contributions).set({ paidAt, providerRef: `SNP${String(day).padStart(6, "0")}` }).where(eq(schema.contributions.id, c.id));
    day++;
  }
  // Pledges relative to today: one kept, one past its date and two upcoming.
  const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const pledges = [
    ["Selemani", 50_000, inDays(-3), "open"],
    ["Agnes", 30_000, inDays(4), "open"],
    ["Musa", 100_000, inDays(18), "open"],
    ["Zawadi", 40_000, inDays(-6), "fulfilled"],
  ] as const;
  for (const [name, tzs, due, status] of pledges) {
    const u = await core.getOrCreateUser(`sim:2556${String(20000000 + tzs)}`, "sim");
    await core.updateUser(u.id, { name });
    const pl = await core.createPledge({ collection: col, user: u, displayName: name, amountCents: tzs * 100, dueDate: due });
    if (status !== "open") await db.update(schema.pledges).set({ status }).where(eq(schema.pledges.id, pl.id));
  }
  const p = await core.proposePayout({
    collection: col,
    requester: owner,
    destination: { method: "mobile_money", phone: "255712345678", name: "Mama Lishe Catering" },
    amountCents: 400_000_00,
    note: "catering deposit",
  });
  await db.update(schema.payouts).set({ status: "success", executedAt: new Date(), providerRef: "SNPPAYOUT01" }).where(eq(schema.payouts.id, p.id));
  const fresh = (await core.findCollection(col.code))!;
  console.log("Seeded", col.code);
  console.log("Public:", collectionUrl(col.code));
  console.log("Dashboard:", dashboardUrl(fresh));
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
