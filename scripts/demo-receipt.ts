/**
 * Sends a receipt photo to the agent as the demo organiser, the way WhatsApp would, and prints the
 * agent's reply and the evidence card it made. Uses the real models configured in the environment.
 * Run after `npm run seed`:  npm run demo:receipt -- path/to/receipt.jpg ["caption"]
 */
import { readFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";
import * as core from "../lib/services/core";
import { getDb, schema } from "../lib/db";
import { handleIncoming } from "../lib/agent/engine";
import { chainFor, proofUrl } from "../lib/services/evidence";

async function main() {
  const [file, caption = "Juma amenilipa kupitia wakala wa M-Pesa, hii ndiyo risiti"] = process.argv.slice(2);
  if (!file) throw new Error("usage: demo-receipt <photo> [caption]");
  const db = await getDb();
  const OWNER = "sim:255700000101";
  const owner = await core.getOrCreateUser(OWNER, "sim");
  const [col] = await core.listOwnedCollections(owner.id);
  if (!col) throw new Error("no demo collection: run npm run seed first");
  await core.updateUser(owner.id, { activeCollectionId: col.id });
  // Juma promised 20,000 earlier; the receipt should close that pledge.
  if (!(await core.listPledges(col.id)).some((p) => p.displayName === "Juma Hamisi")) {
    const juma = await core.getOrCreateUser("sim:255754000321", "sim", "Juma Hamisi");
    await core.createPledge({ collection: col, user: juma, displayName: "Juma Hamisi", amountCents: 20_000_00, dueDate: new Date().toISOString().slice(0, 10) });
  }
  const before = (await chainFor(col.id)).length;
  const mimeType = /\.png$/i.test(file) ? "image/png" : "image/jpeg";
  await handleIncoming({ phone: OWNER, channel: "sim", text: caption, image: { data: new Uint8Array(readFileSync(file)), mimeType } });
  const log = await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, OWNER)).orderBy(asc(schema.chatLog.id));
  console.log("\nAgent replied:\n" + (log.at(-1)?.text ?? "(nothing)"));
  const cards = (await chainFor(col.id)).slice(before);
  for (const c of cards) console.log("\nEvidence card:", proofUrl(c.id), "\n" + JSON.stringify(JSON.parse(c.body), null, 2));
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
