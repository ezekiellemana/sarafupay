/**
 * Organiser copilot demo: sets up a collection where four people are in four different states,
 * then asks the agent (real models from the environment) the organiser's questions in Swahili and
 * prints the conversation. Snippe's live status is simulated: Asha's payment completed but its
 * webhook was "lost", Juma's is still waiting for his PIN.
 * Run:  npm run demo:copilot  (uses PGLITE_DIR, so set PGLITE_DIR=memory for a throwaway run)
 */
import { asc, eq } from "drizzle-orm";
import * as core from "../lib/services/core";
import { getDb, schema } from "../lib/db";
import { handleIncoming } from "../lib/agent/engine";
import { logInbound } from "../lib/channels/messaging";
import { __setInvestigateDepsForTests } from "../lib/services/investigate";

async function main() {
  const questions = process.argv.slice(2);
  const db = await getDb();
  const OWNER = "sim:255700000101";
  const owner = await core.getOrCreateUser(OWNER, "sim");
  await core.updateUser(owner.id, { name: "Esther" });
  const col = await core.createCollection({ ownerId: owner.id, title: "Mchango wa Harusi ya Neema", category: "wedding", targetCents: 2_000_000_00 });
  await core.updateUser(owner.id, { activeCollectionId: col.id });

  const person = async (name: string, phone: string, pledge: number) => {
    const u = await core.getOrCreateUser(phone, "sim");
    await core.updateUser(u.id, { name });
    await logInbound(phone, "Habari, nitachangia");
    const user = (await core.getUser(u.id))!;
    await core.createPledge({ collection: col, user, displayName: name, amountCents: pledge * 100, dueDate: "2026-10-25" });
    return user;
  };
  const started = async (u: { id: string; name: string | null }, ref: string, amount: number) => {
    const c = await core.createContribution({ collection: col, contributorId: u.id, displayName: u.name!, amountCents: amount * 100, source: "sim" });
    await db.update(schema.contributions).set({ providerRef: ref }).where(eq(schema.contributions.id, c.id));
    return c;
  };
  const juma = await person("Juma Hassan", "sim:255700001001", 50_000);
  const asha = await person("Asha Mohamed", "sim:255700001002", 20_000);
  await person("Baraka John", "sim:255700001003", 30_000);
  const zuhura = await person("Zuhura Ali", "sim:255700001004", 40_000);
  await started(juma, "sess_JUMA", 50_000);
  await started(asha, "sess_ASHA", 20_000);
  const z = await started(zuhura, "sess_ZUH", 40_000);
  await core.applySnippePayment({ contributionId: z.id, status: "expired" });
  await db.insert(schema.processedEvents).values({ id: "snippe:demo_zuh", provider: "snippe", kind: "payment.expired", contributionId: z.id, ref: "sess_ZUH", status: "expired" });
  __setInvestigateDepsForTests({ snippeSession: async (ref) => (ref === "sess_ASHA" ? { status: "completed", amountTzs: 20_000 } : { status: "pending" }) });

  const asks = questions.length ? questions : ["Nani bado hajalipa?", "Kwa nini malipo ya Juma bado yanasubiri?", "Ndiyo, mtumie Juma"];
  for (const q of asks) {
    const before = (await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, OWNER))).length;
    await handleIncoming({ phone: OWNER, channel: "sim", text: q });
    const log = await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, OWNER)).orderBy(asc(schema.chatLog.id));
    console.log(`\n🧑 ${q}`);
    for (const m of log.slice(before).filter((m) => m.direction === "out")) console.log(`🤖 ${m.text}`);
  }
  const checks = await db.select().from(schema.agentActions).where(eq(schema.agentActions.tool, "verify_claims"));
  console.log(`\n🔎 Claims checks:\n${checks.map((c) => `${c.ok === "yes" ? "✓" : "⚠️"} ${c.result}`).join("\n")}`);
  const jumaLog = await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, juma.phone)).orderBy(asc(schema.chatLog.id));
  console.log(`\n📱 Juma's chat:\n${jumaLog.filter((m) => m.direction === "out").map((m) => m.text).join("\n---\n")}`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
