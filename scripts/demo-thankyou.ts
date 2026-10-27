/**
 * Thank-you video demo: two people pay into a collection, the organiser asks to thank them, and the
 * videos are made with the real models (Muse Image, Muse Wonder when enabled, Seamless voice on
 * META_VOICE_URL) and saved to OUT_DIR (default ./thank-you-videos).
 * Run:  PGLITE_DIR=memory npm run demo:thankyou
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import * as core from "../lib/services/core";
import { getDb, schema } from "../lib/db";
import { handleIncoming } from "../lib/agent/engine";
import { logInbound } from "../lib/channels/messaging";
import { getMedia } from "../lib/services/media";
import { __waitForThankYous } from "../lib/services/thankyou";

async function main() {
  const out = process.env.OUT_DIR ?? "thank-you-videos";
  const db = await getDb();
  const OWNER = "sim:255700000201";
  const owner = await core.getOrCreateUser(OWNER, "sim");
  await core.updateUser(owner.id, { name: "Esther" });
  const col = await core.createCollection({ ownerId: owner.id, title: "Harusi ya Neema", category: "wedding", targetCents: 2_000_000_00 });
  await core.updateUser(owner.id, { activeCollectionId: col.id });
  await logInbound(OWNER, "Habari, naomba msaada na mchango wangu");
  for (const [name, phone, amount, hello] of [
    ["Asha Mohamed", "sim:255700002001", 20_000, "Habari, nimechangia"],
    ["John Smith", "sim:255700002002", 50_000, "Hello, I just contributed"],
  ] as const) {
    const u = await core.getOrCreateUser(phone, "sim");
    await core.updateUser(u.id, { name });
    await logInbound(phone, hello);
    const c = await core.createContribution({ collection: col, contributorId: u.id, displayName: name, amountCents: amount * 100, source: "sim" });
    await db.update(schema.contributions).set({ providerRef: `sess_${u.id.slice(-6)}` }).where(eq(schema.contributions.id, c.id));
    await core.applySnippePayment({ contributionId: c.id, status: "completed" });
  }
  const ask = process.argv[2] ?? "Watumie asante wote waliolipa";
  await handleIncoming({ phone: OWNER, channel: "sim", text: ask });
  const started = Date.now();
  await __waitForThankYous();
  console.log(`videos done in ${Math.round((Date.now() - started) / 1000)} s`);
  mkdirSync(out, { recursive: true });
  for (const phone of [OWNER, "sim:255700002001", "sim:255700002002"]) {
    const log = await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, phone)).orderBy(asc(schema.chatLog.id));
    console.log(`\n📱 ${phone}`);
    for (const m of log) {
      console.log(`${m.direction === "in" ? "🧑" : "🤖"} ${m.text}`);
      const id = /🎬 \S+\/(img_[a-f0-9]{16})/.exec(m.text)?.[1];
      if (id && phone !== OWNER) writeFileSync(`${out}/${phone.slice(4)}.mp4`, Buffer.from((await getMedia(id))!.dataB64, "base64"));
    }
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
