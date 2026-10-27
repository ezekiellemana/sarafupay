/**
 * End-to-end flow test with a scripted mock LLM, in-memory Postgres (PGlite)
 * and a stubbed PayPal REST API. Run: npm test
 */
import assert from "node:assert/strict";
import { MockLanguageModelV4 } from "ai/test";

process.env.PGLITE_DIR = "memory";
// Real model keys in the shell (a dev box, a cloud session) must not leak into the offline run.
for (const k of ["MODEL_API_KEY", "META_MODEL_API_KEY", "META_OPEN_API_KEY", "META_OPEN_BASE_URL", "META_OPEN_MODEL", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "EVIDENCE_SIGNING_KEY"]) delete process.env[k];
process.env.PAYPAL_CLIENT_ID = "test-id";
process.env.PAYPAL_SECRET = "test-secret";
process.env.APP_URL = "https://sarafupay.test";
process.env.WHATSAPP_ACCESS_TOKEN = "test-wa";
process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
process.env.SNIPPE_API_KEY = "snp_test";
process.env.SNIPPE_WEBHOOK_SECRET = "whsec_test";

type Step = { tool?: [string, Record<string, unknown>]; text?: string };
const script: Step[] = [];
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const model = new MockLanguageModelV4({
  doGenerate: async () => {
    const step = script.shift() ?? { text: "ok" };
    if (step.tool) {
      return {
        content: [{ type: "tool-call", toolCallId: `call_${Math.random()}`, toolName: step.tool[0], input: JSON.stringify(step.tool[1]) }],
        finishReason: { unified: "tool-calls", raw: "tool_calls" },
        usage,
        warnings: [],
      };
    }
    return { content: [{ type: "text", text: step.text ?? "" }], finishReason: { unified: "stop", raw: "stop" }, usage, warnings: [] };
  },
});

// --- PayPal REST stub (OAuth + Payouts) ---
const realFetch = globalThis.fetch;
const payoutCalls: unknown[] = [];
const reconcileOrders: Record<string, string> = {}; // PayPal order id -> contribution id
const captureCalls: string[] = [];
const snippeCalls: { url: string; body: Record<string, unknown> | undefined }[] = [];
let snippeSendFailsOnce = false;
let templateApproved = false; // flips mid-test to simulate Meta approving the reminder template
const templateCalls: { to: string; template: { name: string; language: { code: string }; components: { type: string; parameters: { text: string }[] }[] } }[] = [];
// Meta Model API stub; each Meta test sets its own handler.
const metaCalls: { url: string; init?: RequestInit }[] = [];
let metaHandler: (url: string, init?: RequestInit) => Response | Promise<Response> = () => new Response("no meta handler", { status: 500 });
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.startsWith("https://api.meta.ai/")) {
    metaCalls.push({ url, init });
    return metaHandler(url, init);
  }
  if (url.includes("api-m.sandbox.paypal.com")) {
    if (url.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "tok", expires_in: 3600 });
    if (url.endsWith("/v1/payments/payouts") && init?.method === "POST") {
      payoutCalls.push(JSON.parse(String(init.body)));
      return Response.json({ batch_header: { payout_batch_id: "BATCH1", batch_status: "PENDING" } }, { status: 201 });
    }
    if (url.includes("/v1/payments/payouts/BATCH1"))
      return Response.json({ batch_header: { payout_batch_id: "BATCH1", batch_status: "SUCCESS" }, items: [{ payout_item_id: "ITEM1", transaction_status: "SUCCESS" }] });
    throw new Error(`unexpected PayPal call ${url}`);
  }
  if (url.startsWith("https://api.snippe.sh")) {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    snippeCalls.push({ url, body });
    if (url.endsWith("/api/v1/sessions") && init?.method === "POST")
      return Response.json({ code: 201, data: { reference: "sess_T1", status: "pending", checkout_url: "https://snippe.me/checkout/T1", amount: body.amount } }, { status: 201 });
    if (url.includes("/api/v1/sessions/sess_T1")) return Response.json({ code: 200, data: { reference: "sess_T1", status: "pending" } });
    if (url.endsWith("/v1/payouts/send") && snippeSendFailsOnce) {
      snippeSendFailsOnce = false;
      return Response.json({ message: "upstream timeout" }, { status: 504 });
    }
    if (url.endsWith("/v1/payouts/send"))
      return Response.json({ status: "success", code: 201, data: { reference: "po_T1", status: "pending", fees: { value: 1500, currency: "TZS" } } }, { status: 201 });
    throw new Error(`unexpected Snippe call ${url}`);
  }
  if (url.includes("graph.facebook.com")) {
    const msg = init?.body ? JSON.parse(String(init.body)) : {};
    if (msg.type === "template") {
      templateCalls.push(msg);
      return templateApproved
        ? Response.json({ messages: [{ id: "wamid.T1" }] })
        : Response.json({ error: { code: 132001, message: "Template name does not exist in the translation" } }, { status: 404 });
    }
    // Simulate Meta refusing free-form text outside the 24h customer-service window.
    return Response.json({ error: { code: 131047, message: "Re-engagement message" } }, { status: 400 });
  }
  return realFetch(input, init);
}) as typeof fetch;

async function main() {
  const { handleIncoming, __setModelForTests } = await import("../lib/agent/engine");
  const core = await import("../lib/services/core");
  const { getDb, schema } = await import("../lib/db");
  const { eq, asc } = await import("drizzle-orm");
  __setModelForTests(model);
  const db = await getDb();
  const inbox = async (phone: string) =>
    (await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, phone)).orderBy(asc(schema.chatLog.id)))
      .filter((r) => r.direction === "out")
      .map((r) => r.text);
  const say = (phone: string, text: string) => handleIncoming({ phone, channel: "sim", text });

  const OWNER = "sim:255700000101";
  const AMINA = "sim:255700000202";
  const JOHN = "sim:447700900303";

  // 1. Owner onboarding in chat
  script.push({ tool: ["update_my_profile", { name: "Enzo" }] }, { text: "Karibu Enzo!" });
  await say(OWNER, "Hi, I'm Enzo");
  script.push(
    { tool: ["create_collection", { title: "Neema Wedding", purpose: "Help Neema & Baraka", category: "wedding", target_amount: 500, currency: "USD", deadline: "2026-12-20" }] },
    { text: "Your collection is live!" },
  );
  await say(OWNER, "Create a collection for Neema's wedding, $500 by 20 Dec");
  const [col] = await db.select().from(schema.collections);
  assert.ok(col, "collection created");
  assert.match(col.code, /^NEEMAWED\d\d$/);
  console.log("✓ collection created", col.code);

  // 1b. Language: share-card commands carry the organiser's language for +255 newcomers
  const { langOf } = await import("../lib/i18n");
  const { logInbound } = await import("../lib/channels/messaging");
  await logInbound("255700000505", "Contribute NEEMAWED11");
  assert.equal(await langOf("255700000505"), "en", "English share card -> English for a +255 newcomer");
  await logInbound("255700000606", "Changia NEEMAWED11");
  assert.equal(await langOf("255700000606"), "sw", "Swahili share card -> Swahili");
  await logInbound("255700000505", "Habari, nataka kuchangia");
  assert.equal(await langOf("255700000505"), "sw", "a real Swahili message overrides the card hint");
  assert.ok((await import("../lib/services/links")).shareMessage(col, "Enzo", "sw").includes("Changia%20"), "Swahili card pre-fills Changia");
  console.log("✓ language follows the share card, then the user's own words");

  // 1c. Simulator sessions are private: same persona, different browsers -> different phones
  const { personaPhone, isPersona } = await import("../lib/sim");
  const a = personaPhone("a".repeat(32), "organiser");
  assert.equal(a, personaPhone("a".repeat(32), "organiser"), "stable within a session");
  assert.notEqual(a, personaPhone("b".repeat(32), "organiser"), "different between sessions");
  assert.match(a, /^2557\d{8}$/);
  assert.match(personaPhone("a".repeat(32), "john"), /^4477\d{8}$/);
  assert.ok(isPersona("p-ab12cd") && !isPersona("../x") && !isPersona("255700000101; drop"), "persona ids are validated");
  console.log("✓ simulator sessions get private, stable test numbers");

  // 2. Contributor: open + payment link
  script.push({ tool: ["open_collection", { code: col.code }] }, { tool: ["create_payment_link", { code: col.code, amount: 40, display_name: "Amina" }] }, { text: "Here is your link" });
  await say(AMINA, `Habari, nataka kuchangia ${col.code}`);
  const [ctb] = await db.select().from(schema.contributions);
  assert.equal(ctb.amountCents, 4000);
  assert.equal(ctb.provider, "paypal", "USD collection defaults to card/PayPal");
  assert.equal(ctb.status, "pending");
  console.log("✓ payment link created", ctb.id);

  // 3. PayPal capture -> receipts
  const cap1 = { orderId: "ORDER1", status: "COMPLETED", captureId: "CAPTURE1", customId: ctb.id, payerEmail: "amina@example.com", settled: { grossCents: 4000, feeCents: 226, currency: "USD" } }; // PayPal fee $2.26
  await core.applyCapture(cap1);
  await core.applyCapture(cap1); // idempotent
  const [settled] = await db.select().from(schema.contributions).where(eq(schema.contributions.id, ctb.id));
  assert.equal(settled.providerFeeCents, 226, "PayPal's real fee is recorded");
  assert.equal(settled.sarafuFeeCents, 120, "SarafuPay 3% of $40");
  assert.equal(settled.netCents, 3654, "$40 - $2.26 - $1.20");
  const aminaMsgs = await inbox(AMINA);
  assert.equal(aminaMsgs.filter((m) => /Payment received|Malipo yamepokelewa/.test(m)).length, 1, "exactly one receipt");
  const ownerMsgs = await inbox(OWNER);
  assert.ok(ownerMsgs.some((m) => m.includes("Amina") && m.includes("$40.00")), "owner alerted");
  assert.ok(aminaMsgs.some((m) => m.includes("Malipo yamepokelewa")), "Tanzanian contributor gets a Swahili receipt");
  console.log("✓ capture settled once, receipt + owner alert sent");

  // 3b. Card payment in another currency: paid in EUR, settled in USD from PayPal's conversion.
  {
    const fx = await core.createCollection({ ownerId: col.ownerId, title: "FX test", targetCents: 1000_00, currency: "USD" });
    const eur = await core.createContribution({ collection: fx, displayName: "Klaus", amountCents: 20_00, source: "web", provider: "paypal", payCurrency: "EUR" });
    assert.equal(eur.payCurrency, "EUR");
    assert.equal(eur.payAmountCents, 2000, "EUR 20.00 is what the payer pays");
    assert.equal(eur.amountCents, 0, "USD value unknown until capture");
    assert.equal(eur.currency, "USD");
    // A capture PayPal kept in EUR (receiving preferences not set to convert) must not be booked as USD.
    const held = await core.applyCapture({ orderId: "ORDER-EUR", status: "COMPLETED", captureId: "CAP-EUR", customId: eur.id, settled: { grossCents: 2000, feeCents: 100, currency: "EUR" } });
    assert.equal(held?.status, "pending", "unconverted capture stays pending");
    const { paypalSettlement } = await import("../lib/currency");
    const settledEur = paypalSettlement(
      { value: "20.00", currency_code: "EUR" },
      {
        gross_amount: { value: "20.00", currency_code: "EUR" },
        paypal_fee: { value: "1.04", currency_code: "EUR" },
        paypal_fee_in_receivable_currency: { value: "1.13", currency_code: "USD" },
        receivable_amount: { value: "21.10", currency_code: "USD" },
        exchange_rate: { source_currency: "EUR", target_currency: "USD", value: "1.1115" },
      },
    );
    const paid = await core.applyCapture({ orderId: "ORDER-EUR", status: "COMPLETED", captureId: "CAP-EUR", customId: eur.id, settled: settledEur });
    assert.equal(paid?.status, "paid");
    assert.equal(paid?.amountCents, 2223, "USD gross = receivable $21.10 + fee $1.13");
    assert.equal(paid?.providerFeeCents, 113, "PayPal fee in USD");
    assert.equal(paid?.sarafuFeeCents, 67, "SarafuPay 3% of $22.23");
    assert.equal(paid?.netCents, 2043);
    assert.equal(paid?.fxRate, "1.1115");
    assert.equal(paid?.payAmountCents, 2000, "original EUR amount kept for receipts");
    await assert.rejects(core.createContribution({ collection: fx, displayName: "X", amountCents: 50_00, source: "web", provider: "paypal", payCurrency: "BRL" }), /not supported/);
    await assert.rejects(core.createContribution({ collection: fx, displayName: "X", amountCents: 50_00, source: "web", provider: "paypal", payCurrency: "JPY" }), /Minimum/);
    console.log("✓ card payment in EUR settles in USD from PayPal's conversion; unconverted captures stay pending");
  }

  // 3b. Public supporters list: first names only, email search is exact-match only
  const byName = await core.searchSupporters(col.id, { q: "ami" });
  assert.deepEqual(byName.items.map((s) => s.name), ["Amina"]);
  assert.equal((await core.searchSupporters(col.id, { q: "AMINA@example.com" })).total, 1, "exact email finds own contribution");
  assert.equal((await core.searchSupporters(col.id, { q: "amina@exam" })).total, 0, "partial email never matches");
  assert.equal((await core.searchSupporters(col.id, { q: "%" })).total, 0, "LIKE wildcards are escaped");
  assert.ok(!JSON.stringify(byName).includes("@"), "no emails leave the server");
  console.log("✓ supporters search: names, exact email only, no leaks");

  // 4. Pledge by John, owner reminds
  await db.update(schema.users).set({ name: "John" }).where(eq(schema.users.phone, JOHN));
  script.push({ tool: ["update_my_profile", { name: "John" }] }, { tool: ["make_pledge", { code: col.code, amount: 25, due_date: "2026-11-30" }] }, { text: "Pledge saved" });
  await say(JOHN, `I'll give $25 to ${col.code} by end of November`);
  script.push({ tool: ["remind_pledgers", { code: col.code }] }, { text: "Reminded John" });
  await say(OWNER, "remind people who haven't paid");
  assert.ok((await inbox(JOHN)).some((m) => m.includes("friendly reminder") && m.includes("/pay/ctb_")), "John reminded with link");
  console.log("✓ pledge + reminder with pay link");

  // 4b. Reminder WhatsApp refuses (24h window) -> not marked reminded, link returned to organiser
  const GRACE = "255700000404"; // real WhatsApp number (not sim)
  const grace = await core.getOrCreateUser(GRACE, "whatsapp", "Grace");
  await core.createPledge({ collection: col, user: grace, displayName: "Grace", amountCents: 1500, dueDate: "2026-12-01" });
  const r = await core.remindPledgers(col);
  assert.ok(r.unreachable.some((u) => u.name === "Grace" && u.pay_link.includes("/pay/ctb_")), "Grace reported unreachable with link");
  assert.ok(!r.reminded.includes("Grace"), "Grace not counted as reminded");
  const [gp] = await db.select().from(schema.pledges).where(eq(schema.pledges.userId, grace.id));
  assert.equal(gp.remindedAt, null, "remindedAt stays empty when WhatsApp refused");
  console.log("✓ refused WhatsApp reminder is not marked as sent; organiser gets the pay link");

  // 4c. Once the reminder template is approved, people outside the 24h window still get reminded
  templateApproved = true;
  const r2 = await core.remindPledgers(col);
  assert.ok(r2.reminded.includes("Grace") && !r2.unreachable.some((u) => u.name === "Grace"), "Grace reminded via template");
  const tc = templateCalls.at(-1)!;
  assert.equal(tc.to, GRACE);
  assert.equal(tc.template.name, "pledge_reminder");
  assert.deepEqual(tc.template.components[0].parameters.map((p) => p.text), ["Grace", "$15.00", col.title, "2026-12-01"]);
  assert.match(tc.template.components[1].parameters[0].text, /^ctb_/, "pay button carries the contribution id");
  const [gp2] = await db.select().from(schema.pledges).where(eq(schema.pledges.userId, grace.id));
  assert.ok(gp2.remindedAt, "remindedAt set once the template is delivered");
  console.log("✓ outside 24h: approved template delivers the reminder with a PayPal pay button");

  // 4d. Same promise recorded twice (before and after the person gives their name) -> one pledge, one alert
  const BARAKA = "sim:255700000505";
  const baraka = await core.getOrCreateUser(BARAKA, "sim");
  const before = (await inbox(OWNER)).filter((m) => m.includes("$20.00")).length;
  await core.createPledge({ collection: col, user: baraka, displayName: "Anonymous", amountCents: 2000, dueDate: "2026-11-06" });
  await core.createPledge({ collection: col, user: baraka, displayName: "Baraka", amountCents: 2000, dueDate: "2026-11-06" });
  const bp = await db.select().from(schema.pledges).where(eq(schema.pledges.userId, baraka.id));
  assert.equal(bp.length, 1, "repeat of the same promise does not create a second pledge");
  assert.equal(bp[0].displayName, "Baraka", "repeat carries the name onto the existing pledge");
  assert.equal((await inbox(OWNER)).filter((m) => m.includes("$20.00")).length - before, 1, "organiser alerted once");
  // Giving a name later (update_my_profile) renames that person's anonymous open pledges
  const ZURI = "sim:255700000606";
  const zuri = await core.getOrCreateUser(ZURI, "sim");
  await core.createPledge({ collection: col, user: zuri, displayName: "Anonymous", amountCents: 2500 });
  await core.updateUser(zuri.id, { name: "Zuri" });
  const [zp] = await db.select().from(schema.pledges).where(eq(schema.pledges.userId, zuri.id));
  assert.equal(zp.displayName, "Zuri", "anonymous pledge takes the name given later");
  console.log("✓ a repeated pledge updates instead of duplicating; late names replace 'Anonymous'");

  // 5. Non-owner cannot pay out
  script.push({ tool: ["prepare_payout", { code: col.code, method: "paypal", paypal_email: "x@example.com", recipient_name: "John", amount: 10, purpose: "test" }] }, { text: "Sorry" });
  await say(JOHN, "pay me $10");
  assert.equal((await db.select().from(schema.payouts)).length, 0, "no payout for non-owner");
  console.log("✓ non-owner payout blocked");

  // 6. Owner over-balance payout blocked
  script.push({ tool: ["prepare_payout", { code: col.code, method: "paypal", paypal_email: "caterer@example.com", recipient_name: "Caterer", amount: 100, purpose: "catering" }] }, { text: "Insufficient" });
  await say(OWNER, "pay caterer $100");
  assert.equal((await db.select().from(schema.payouts)).length, 0, "no payout above balance");
  console.log("✓ over-balance payout blocked");

  // 7. Owner payout with CONFIRM code
  script.push({ tool: ["prepare_payout", { code: col.code, method: "paypal", paypal_email: "caterer@example.com", recipient_name: "Mama Lishe Catering", amount: 30, purpose: "catering deposit" }] }, { text: "Sent you the confirmation" });
  await say(OWNER, "pay Mama Lishe $30 for the catering deposit, caterer@example.com");
  const [pending] = await db.select().from(schema.payouts);
  assert.equal(pending.status, "awaiting_confirmation");
  assert.ok((await inbox(OWNER)).some((m) => m.includes(`CONFIRM ${pending.confirmCode}`)));
  await say(OWNER, "CONFIRM 000000"); // wrong code
  assert.equal(payoutCalls.length, 0);
  await say(OWNER, `CONFIRM ${pending.confirmCode}`);
  assert.equal(payoutCalls.length, 1, "PayPal payout called once");
  const sentItem = (payoutCalls[0] as { items: { amount: { value: string } }[] }).items[0];
  assert.equal(sentItem.amount.value, "29.40", "organiser receives $30 - PayPal $0.60 (no SarafuPay payout fee)");
  await say(OWNER, `CONFIRM ${pending.confirmCode}`); // replay
  assert.equal(payoutCalls.length, 1, "no double payout");
  const done = await core.refreshPayout(pending.id);
  assert.equal(done?.status, "success");
  assert.ok((await inbox(AMINA)).some((m) => /Transparency update|Taarifa ya uwazi/.test(m) && m.includes("Mama Lishe")), "contributors notified");
  const stats = await core.collectionStats(col);
  assert.equal(stats.availableCents, 3654 - 3000, "balance after fees minus the withdrawal");
  console.log("✓ payout confirmed by code, executed once, transparency broadcast; balance", stats.availableCents / 100);

  // 8. Non-owner report = totals only
  const { buildTools } = await import("../lib/agent/tools");
  const john = (await db.select().from(schema.users).where(eq(schema.users.phone, JOHN)))[0];
  const rep = (await (buildTools({ user: john, channel: "sim" }).collection_report as { execute: (i: unknown, o: unknown) => Promise<Record<string, unknown>> }).execute({ code: col.code }, {})) as Record<string, unknown>;
  assert.ok(!("contributions" in rep), "no names for non-owner");
  console.log("✓ privacy: non-owner sees totals only");

  // 9. Render Cron Job safety net: payments whose webhook never arrived still settle, exactly once.
  const { reconcile } = await import("../lib/services/reconcile");
  const late1 = await core.createContribution({ collection: col, contributorId: john.id, displayName: "John", amountCents: 2500, source: "sim" });
  const late2 = await core.createContribution({ collection: col, contributorId: john.id, displayName: "John", amountCents: 1500, source: "sim" });
  const fresh = await core.createContribution({ collection: col, contributorId: john.id, displayName: "John", amountCents: 700, source: "sim" });
  reconcileOrders["ORDER-COMPLETED"] = late1.id;
  reconcileOrders["ORDER-APPROVED"] = late2.id;
  reconcileOrders["ORDER-FRESH"] = fresh.id;
  const old = new Date(Date.now() - 20 * 60_000);
  await db.update(schema.contributions).set({ paypalOrderId: "ORDER-COMPLETED", createdAt: old }).where(eq(schema.contributions.id, late1.id));
  await db.update(schema.contributions).set({ paypalOrderId: "ORDER-APPROVED", createdAt: old }).where(eq(schema.contributions.id, late2.id));
  await db.update(schema.contributions).set({ paypalOrderId: "ORDER-FRESH" }).where(eq(schema.contributions.id, fresh.id)); // < 10 min: left to the webhook
  // Fake PayPal for the job: ORDER-COMPLETED was captured but its webhook was lost;
  // ORDER-APPROVED was approved but the buyer never came back to the return URL.
  const fakePaypal = {
    getOrder: async (id: string) => ({
      status: id === "ORDER-COMPLETED" ? "COMPLETED" : "APPROVED",
      captureId: id === "ORDER-COMPLETED" ? "CAP-LATE1" : undefined,
      customId: reconcileOrders[id],
      payerEmail: "john@example.com",
    }),
    settle: async (id: string) => {
      captureCalls.push(id);
      return core.applyCapture({ orderId: id, status: "COMPLETED", captureId: `CAP-${id}`, customId: reconcileOrders[id], payerEmail: "john@example.com" });
    },
  };
  const rc1 = await reconcile(fakePaypal);
  assert.equal(rc1.checkedOrders, 2, "only orders older than 10 minutes are checked");
  assert.equal(rc1.recoveredPayments, 2, "completed + approved orders both recovered");
  assert.deepEqual(captureCalls, ["ORDER-APPROVED"], "only the approved order is captured");
  assert.deepEqual(rc1.errors, []);
  const after = await db.select().from(schema.contributions).where(eq(schema.contributions.contributorId, john.id));
  assert.equal(after.find((c) => c.id === late1.id)?.status, "paid");
  assert.equal(after.find((c) => c.id === late2.id)?.status, "paid");
  assert.equal(after.find((c) => c.id === fresh.id)?.status, "pending");
  const rc2 = await reconcile(fakePaypal);
  assert.equal(rc2.recoveredPayments, 0, "second run is a no-op");
  assert.equal(captureCalls.length, 1, "no double capture");
  assert.equal((await inbox(JOHN)).filter((m) => /Payment received|Malipo yamepokelewa/.test(m)).length, 2, "one receipt per recovered payment");
  console.log("✓ reconcile cron recovers missed webhooks once, skips fresh orders");

  // 9b. An order PayPal no longer knows (expired, 404) is closed; a 503 is only a warning.
  const { ApiError } = await import("@paypal/paypal-server-sdk");
  const sdkError = (statusCode: number) =>
    new ApiError({ request: { method: "GET", url: "https://api-m.sandbox.paypal.com" }, response: { statusCode, headers: {}, body: "" } } as never, "");
  const gone = await core.createContribution({ collection: col, contributorId: john.id, displayName: "John", amountCents: 900, source: "sim" });
  const flaky = await core.createContribution({ collection: col, contributorId: john.id, displayName: "John", amountCents: 800, source: "sim" });
  await db.update(schema.contributions).set({ paypalOrderId: "ORDER-GONE", createdAt: old }).where(eq(schema.contributions.id, gone.id));
  await db.update(schema.contributions).set({ paypalOrderId: "ORDER-FLAKY", createdAt: old }).where(eq(schema.contributions.id, flaky.id));
  const rc3 = await reconcile({
    ...fakePaypal,
    getOrder: async (id: string) => {
      if (id === "ORDER-GONE") throw sdkError(404);
      if (id === "ORDER-FLAKY") throw sdkError(503);
      return fakePaypal.getOrder(id);
    },
  });
  assert.equal(rc3.closedOrders, 1, "expired order closed");
  assert.deepEqual(rc3.errors, [], "neither case fails the job");
  assert.equal(rc3.warnings.length, 1);
  assert.match(rc3.warnings[0], /ORDER-FLAKY: HTTP 503/, "warning carries the HTTP status");
  const after2 = await db.select().from(schema.contributions).where(eq(schema.contributions.contributorId, john.id));
  assert.equal(after2.find((c) => c.id === gone.id)?.status, "failed");
  assert.equal(after2.find((c) => c.id === flaky.id)?.status, "pending", "transient error: retried next run");
  console.log("✓ reconcile closes expired orders and treats PayPal hiccups as warnings");

  // 9c. Mobile money via Snippe: TZS collection, hosted checkout, signed webhook, payout to mobile money.
  const { createHmac } = await import("node:crypto");
  const owner = (await db.select().from(schema.users).where(eq(schema.users.phone, OWNER)))[0];
  const tzCol = await core.createCollection({ ownerId: owner.id, title: "Msiba wa Bibi", category: "funeral", targetCents: 2_000_000_00 });
  assert.equal(tzCol.currency, "TZS");
  await assert.rejects(core.createContribution({ collection: tzCol, displayName: "Too small", amountCents: 400_00, source: "web" }), /Minimum/);
  const mm = await core.createContribution({ collection: tzCol, displayName: "Halima", amountCents: 100_000_00, source: "web", payerPhone: "0712 345 678" });
  assert.equal(mm.provider, "snippe");
  assert.equal(mm.payerPhone, "255712345678");
  const checkout = await core.startCheckout(mm.id);
  assert.equal(checkout, "https://snippe.me/checkout/T1");
  const sess = snippeCalls.find((c) => c.url.endsWith("/api/v1/sessions"))!;
  assert.equal(sess.body?.amount, 100_000, "Snippe gets whole shillings");
  assert.deepEqual(sess.body?.metadata, { contribution_id: mm.id });
  // Webhook: unsigned is refused, signed settles once with Snippe's real fee.
  const { POST: snippeHook } = await import("../app/api/snippe/webhook/route");
  const evt = JSON.stringify({ id: "evt_1", type: "payment.completed", data: { reference: "pi_1", session_reference: "sess_T1", status: "completed", amount: { value: 100000, currency: "TZS" }, settlement: { fees: { value: 2500, currency: "TZS" } }, customer: { phone: "+255712345678" }, metadata: { contribution_id: mm.id } } });
  const bad = await snippeHook(new Request("https://x/api/snippe/webhook", { method: "POST", body: evt, headers: { "x-webhook-signature": "00", "x-webhook-timestamp": String(Math.floor(Date.now() / 1000)) } }));
  assert.equal(bad.status, 401, "bad signature refused");
  // Route handlers schedule work with after(); call the same settle path directly, as the handler does.
  const ts = String(Math.floor(Date.now() / 1000));
  const { verifyWebhook } = await import("../lib/snippe/client");
  assert.ok(verifyWebhook(evt, createHmac("sha256", "whsec_test").update(`${ts}.${evt}`).digest("hex"), ts), "valid signature accepted");
  assert.ok(!verifyWebhook(evt, createHmac("sha256", "whsec_test").update(`${ts}.${evt}`).digest("hex"), String(Number(ts) - 600)), "old timestamp refused");
  await core.applySnippePayment({ contributionId: mm.id, sessionReference: "sess_T1", status: "completed", amountTzs: 100_000, feeTzs: 2_500, payerPhone: "+255712345678" });
  await core.applySnippePayment({ contributionId: mm.id, sessionReference: "sess_T1", status: "completed", amountTzs: 100_000, feeTzs: 2_500 }); // replay
  const [mmPaid] = await db.select().from(schema.contributions).where(eq(schema.contributions.id, mm.id));
  assert.equal(mmPaid.status, "paid");
  assert.equal(mmPaid.netCents, 95_000_00, "TZS 100,000 - Snippe 2,500 - SarafuPay 2,500");
  // A wrong amount from Snippe is never accepted.
  const mm2 = await core.createContribution({ collection: tzCol, displayName: "Odd", amountCents: 20_000_00, source: "web" });
  await core.applySnippePayment({ contributionId: mm2.id, status: "completed", amountTzs: 2_000 });
  assert.equal((await core.getContribution(mm2.id))?.status, "pending", "amount mismatch is refused");
  const tzStats = await core.collectionStats(tzCol);
  assert.equal(tzStats.availableCents, 95_000_00);
  // Payout to mobile money: only Snippe's TZS 1,500, CONFIRM, Snippe gets the net amount.
  const prop = await core.proposePayout({ collection: tzCol, requester: owner, destination: { method: "mobile_money", phone: "0754 000 111", name: "Bibi's family" }, amountCents: 40_000_00, note: "funeral costs" });
  assert.equal(prop.quote.providerFeeCents, 1_500_00);
  assert.equal(prop.quote.sarafuFeeCents, 0);
  assert.equal(prop.quote.netCents, 38_500_00);
  await core.confirmPayoutByCode(owner, prop.confirmCode);
  const send = snippeCalls.find((c) => c.url.endsWith("/v1/payouts/send"))!;
  assert.equal(send.body?.amount, 38_500, "Snippe sends what the organiser receives");
  assert.equal(send.body?.recipient_phone, "255754000111");
  assert.equal(send.body?.channel, "mobile");
  const [poRow] = await db.select().from(schema.payouts).where(eq(schema.payouts.id, prop.id));
  await core.applySnippePayout(poRow, "completed", 1500);
  assert.equal((await core.collectionStats(tzCol)).availableCents, 55_000_00, "TZS 95,000 - 40,000 withdrawn");
  // Bank payout validation.
  await assert.rejects(
    core.proposePayout({ collection: tzCol, requester: owner, destination: { method: "bank", bank: "Imaginary", account: "0150000000", name: "X" }, amountCents: 10_000_00 }),
    /Unknown bank/,
  );
  const bankProp = await core.proposePayout({ collection: tzCol, requester: owner, destination: { method: "bank", bank: "crdb", account: "0150 1234 5678", name: "Bibi's family" }, amountCents: 10_000_00 });
  assert.equal(bankProp.recipientBank, "CRDB");
  // USD money can't leave through Snippe.
  await assert.rejects(
    core.proposePayout({ collection: tzCol, requester: owner, destination: { method: "paypal", email: "a@b.co" }, amountCents: 1_00 }),
    /Insufficient balance/,
  );
  console.log("✓ Snippe mobile money: checkout, signed webhook, fees, payout to mobile money, bank validation");

  // 9d. Provider timeout on a payout: balance stays held, nothing is marked failed, the retry
  // (same idempotency key) picks up the original result.
  const held = await core.proposePayout({ collection: tzCol, requester: owner, destination: { method: "mobile_money", phone: "0754000111", name: "Bibi's family" }, amountCents: 5_000_00 });
  snippeSendFailsOnce = true;
  const msg = await core.confirmPayoutByCode(owner, held.confirmCode);
  assert.match(msg, /hasn't answered|haijajibu/);
  const [heldRow] = await db.select().from(schema.payouts).where(eq(schema.payouts.id, held.id));
  assert.equal(heldRow.status, "processing", "uncertain payout is not marked failed");
  assert.equal(heldRow.providerRef, null);
  const balHeld = (await core.collectionStats(tzCol)).availableCents;
  await assert.rejects(
    core.proposePayout({ collection: tzCol, requester: owner, destination: { method: "mobile_money", phone: "0754000111", name: "X" }, amountCents: balHeld + 1_00 }),
    /Insufficient/,
    "held amount can't be withdrawn twice",
  );
  const sendsBefore = snippeCalls.filter((c) => c.url.endsWith("/v1/payouts/send")).length;
  await core.refreshPayout(held.id);
  const [recovered] = await db.select().from(schema.payouts).where(eq(schema.payouts.id, held.id));
  assert.equal(recovered.providerRef, "po_T1", "re-submission recovers the provider reference");
  const resent = snippeCalls.filter((c) => c.url.endsWith("/v1/payouts/send")).slice(sendsBefore);
  assert.equal(resent.length, 1);
  console.log("✓ payout timeout: balance held, idempotent re-submit recovers the reference");

  // 9e. Late "completed" after an "expired" webhook still records the money.
  const late = await core.createContribution({ collection: tzCol, displayName: "Late", amountCents: 3_000_00, source: "web" });
  await core.applySnippePayment({ contributionId: late.id, status: "expired" });
  assert.equal((await core.getContribution(late.id))?.status, "failed");
  await core.applySnippePayment({ contributionId: late.id, status: "completed", amountTzs: 3_000 });
  assert.equal((await core.getContribution(late.id))?.status, "paid", "completed wins over an earlier expired");
  console.log("✓ out-of-order Snippe webhooks: completed after expired is recorded");

  // 9f. Big TZS totals don't overflow (stored as bigint).
  const big = await core.createCollection({ ownerId: owner.id, title: "Harusi Kubwa", category: "wedding", targetCents: 80_000_000_00 });
  for (let i = 0; i < 6; i++) {
    const c = await core.createContribution({ collection: big, displayName: `Guest ${i}`, amountCents: 5_000_000_00, source: "web" });
    await core.applySnippePayment({ contributionId: c.id, status: "completed", amountTzs: 5_000_000 });
  }
  const bigStats = await core.collectionStats(big);
  assert.equal(bigStats.raisedCents, 30_000_000_00, "TZS 30M raised");
  assert.equal(bigStats.availableCents, 28_500_000_00, "TZS 28.5M after 5%");
  console.log("✓ TZS 30,000,000 collection: totals correct (no 32-bit overflow)");

  // 11. Meta Model API: Muse Spark is the primary brain, with fallback between models and providers.
  process.env.MODEL_API_KEY = "meta_test";
  const models = await import("../lib/agent/models");
  const { generateText } = await import("ai");
  assert.equal(models.primaryModel(), "meta:muse-spark-1.3");
  const chatBodies: Record<string, unknown>[] = [];
  metaHandler = (url, init) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    chatBodies.push(body);
    if (body.model === "muse-spark-1.3") return Response.json({ error: { message: "overloaded" } }, { status: 503 });
    return Response.json({
      id: "c1", object: "chat.completion", created: 1, model: body.model,
      choices: [{ index: 0, message: { role: "assistant", content: "Habari kutoka Muse" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 3, completion_tokens: 3, total_tokens: 6 },
    });
  };
  const viaMeta = await models.withModelFallback((m) => generateText({ model: m.model, prompt: "hi", maxRetries: 0, providerOptions: m.fast }));
  assert.equal(viaMeta.text, "Habari kutoka Muse");
  assert.deepEqual(chatBodies.map((b) => b.model), ["muse-spark-1.3", "muse-spark-1.2"], "503 on the primary falls back to the next Muse model");
  assert.equal(chatBodies[1].reasoning_effort, "low", "fast replies ask Muse Spark for low reasoning effort");
  assert.ok(metaCalls.every((c) => c.url === "https://api.meta.ai/v1/chat/completions" || !c.url.includes("chat")), "OpenAI-compatible endpoint");
  console.log("✓ Muse Spark via Meta Model API, falls back across models");

  // 11a. A Meta account problem (billing, bad key) skips the other Muse models and falls back to Gemini.
  process.env.GEMINI_API_KEY = "g_test";
  const tried: string[] = [];
  metaHandler = (_url, init) => {
    tried.push(JSON.parse(String(init?.body ?? "{}")).model);
    return Response.json({ error: { code: "billing_not_configured", message: "Billing verification failed.", type: "billing_error" } }, { status: 402 });
  };
  const fellBack = await models.withModelFallback(async (m) => {
    if (m.provider === "gemini") return `gemini:${m.id}`;
    return (await generateText({ model: m.model, prompt: "hi", maxRetries: 0 })).text;
  });
  assert.match(fellBack, /^gemini:/, "billing error on Meta falls back to Gemini");
  assert.deepEqual(tried, ["muse-spark-1.3"], "other Muse models are skipped after an account-level error");
  delete process.env.GEMINI_API_KEY;
  console.log("✓ Meta billing/auth error falls back to Gemini instead of failing the reply");

  // 11a2. Muse Spark Open on a partner host (Fireworks by default) sits between the Meta API and Gemini.
  process.env.META_OPEN_API_KEY = "fw_test";
  process.env.GEMINI_API_KEY = "g_test";
  assert.deepEqual(models.modelChain().map((m) => m.provider), ["meta", "meta", "meta-open", "gemini", "gemini", "gemini", "gemini"].slice(0, models.modelChain().length));
  const openBodies: Record<string, unknown>[] = [];
  const realFetch2 = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://api.fireworks.ai/inference/v1/chat/completions")) {
      const body = JSON.parse(String(init?.body));
      openBodies.push(body);
      return Response.json({ id: "f1", object: "chat.completion", created: 1, model: body.model, choices: [{ index: 0, message: { role: "assistant", content: "Habari kutoka Muse Spark Open" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
    }
    return realFetch2(input, init);
  }) as typeof fetch;
  const viaOpen = await models.withModelFallback((m) => (m.provider === "gemini" ? Promise.resolve({ text: "gemini" }) : generateText({ model: m.model, prompt: "hi", maxRetries: 0, providerOptions: m.fast })));
  assert.equal(viaOpen.text, "Habari kutoka Muse Spark Open", "Meta API billing error → Muse Spark Open answers");
  assert.equal(openBodies[0].model, "accounts/fireworks/models/muse-spark-open");
  globalThis.fetch = realFetch2;
  delete process.env.META_OPEN_API_KEY;
  delete process.env.GEMINI_API_KEY;
  console.log("✓ Muse Spark Open on Fireworks answers when the Meta Model API refuses");

  // 11b. Voice notes: WhatsApp Ogg/Opus → WAV → Muse Voice Transcribe → the agent reads the transcript.
  const { readFileSync } = await import("node:fs");
  const media = await import("../lib/agent/meta-media");
  const ogg = new Uint8Array(readFileSync(new URL("./fixtures/tone.ogg", import.meta.url)));
  const wav = await media.voiceToWav({ data: ogg, mimeType: "audio/ogg; codecs=opus" });
  const wv = new DataView(wav.buffer);
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), "RIFF");
  assert.equal(wv.getUint16(22, true), 1, "mono");
  assert.equal(wv.getUint32(24, true), 24000, "24 kHz");
  assert.ok(Math.abs((wav.length - 44) / 2 - 24000) < 2400, "≈1 s of audio");
  let asrRequest: Record<string, unknown> | undefined;
  metaHandler = async (url, init) => {
    assert.ok(url.endsWith("/v1/asr/transcribe"));
    const form = init?.body as FormData;
    asrRequest = JSON.parse(await (form.get("request") as Blob).text());
    assert.equal((form.get("audio") as Blob).type, "audio/wav");
    return Response.json({ sessionId: "s1", transcript: "I received twenty thousand shillings from Juma in cash", turns: [] });
  };
  const VOICE = "sim:447700900404";
  await logInbound(VOICE, "Hello there, I'm organising a fundraiser");
  script.push({ text: "Got it — shall I record TZS 20,000 cash from Juma?" });
  await handleIncoming({ phone: VOICE, channel: "sim", audio: { data: ogg, mimeType: "audio/ogg; codecs=opus" } });
  assert.equal(asrRequest?.model, "muse-voice-transcribe-1.0");
  assert.equal(asrRequest?.audioEncoding, "WAV");
  const voiceLog = (await db.select().from(schema.chatLog).where(eq(schema.chatLog.phone, VOICE)).orderBy(asc(schema.chatLog.id))).map((r) => r.text);
  assert.ok(voiceLog.includes("🎤 I received twenty thousand shillings from Juma in cash"), "transcript is what the agent sees and remembers");
  console.log("✓ voice note transcribed by Muse Voice Transcribe (Ogg/Opus decoded to WAV)");

  // 11c. Trust Copilot: a receipt photo is recorded once, checked against pledges, never counted twice.
  const trustCol = await core.createCollection({ ownerId: owner.id, title: "Harusi ya Neema & Baraka", category: "wedding", targetCents: 1_000_000_00 });
  const jumaUser = await core.getOrCreateUser("sim:255700000707", "sim", "Juma");
  await core.createPledge({ collection: trustCol, user: jumaUser, displayName: "Juma", amountCents: 20_000_00, dueDate: "2026-11-01" });
  const statsBefore = await core.collectionStats(trustCol);
  const photo = { data: new Uint8Array([0xff, 0xd8, 1, 2, 3, 4]), mimeType: "image/jpeg" };
  script.push(
    { tool: ["record_offline_payment", { code: trustCol.code, name: "Juma", amount: 20000, method: "mobile_money", reference: "QJ47XK2P1L", received_on: "2026-10-24" }] },
    { text: "Recorded Juma's TZS 20,000 ✅" },
  );
  await handleIncoming({ phone: OWNER, channel: "sim", text: "Juma paid me directly", image: photo });
  const trust = await import("../lib/services/trust");
  let off = await trust.offlineSummary(trustCol.id);
  assert.equal(off.records.length, 1);
  assert.equal(off.records[0].evidence, "photo");
  assert.equal(off.records[0].checkStatus, "ok");
  assert.equal((await core.listPledges(trustCol.id))[0].status, "fulfilled", "an exact match closes the pledge");
  const statsAfter = await core.collectionStats(trustCol);
  assert.equal(statsAfter.availableCents, statsBefore.availableCents, "outside money never enters the withdrawable balance");

  script.push(
    { tool: ["record_offline_payment", { code: trustCol.code, name: "Rehema", amount: 15000, method: "mobile_money", reference: "ZZ11" }] },
    { text: "That photo was already used." },
  );
  await handleIncoming({ phone: OWNER, channel: "sim", text: "and this one", image: photo });
  off = await trust.offlineSummary(trustCol.id);
  assert.equal(off.records[1].checkStatus, "duplicate", "the same photo can't back two payments");
  assert.match(off.records[1].checkNote ?? "", /exact photo/);
  const dupRef = await trust.recordOffline({ collection: trustCol, by: owner, displayName: "Juma", amountCents: 20_000_00, currency: "TZS", method: "mobile_money", reference: "qj47-xk2p-1l", evidence: "text" });
  assert.equal(dupRef.record.checkStatus, "duplicate", "same reference, written differently, is caught");
  assert.deepEqual(off.confirmed, [{ currency: "TZS", totalCents: 20_000_00, count: 1 }], "duplicates don't count in totals");

  const claim = await trust.recordOffline({ collection: trustCol, by: jumaUser, displayName: "Juma's sister", amountCents: 5_000_00, currency: "TZS", method: "cash", evidence: "text" });
  assert.equal(claim.record.status, "claimed");
  assert.ok((await inbox(OWNER)).some((m) => m.includes(`confirm ${claim.record.id}`) || m.includes(`thibitisha ${claim.record.id}`)), "the organiser is asked to confirm a contributor's claim");
  assert.match(await trust.resolveOffline(jumaUser, claim.record.id, "confirm"), /Only the collection owner/);
  assert.match(await trust.resolveOffline(owner, claim.record.id, "confirm"), /Confirmed/);
  assert.equal((await trust.offlineSummary(trustCol.id)).confirmed[0].totalCents, 25_000_00);
  console.log("✓ Trust Copilot: receipt photo recorded, pledge matched, duplicates flagged, claims need the organiser");

  // 11d. Treasurer autopilot: due-date reminders, weekly report, one deadline note. Never moves money.
  const ap = await import("../lib/services/autopilot");
  const rehema = await core.getOrCreateUser("sim:255700000808", "sim", "Rehema");
  await core.createPledge({ collection: trustCol, user: rehema, displayName: "Rehema", amountCents: 30_000_00, dueDate: "2020-01-01" });
  script.push({ tool: ["autopilot", { code: trustCol.code, on: true }] }, { text: "Autopilot is on 🤖" });
  await say(OWNER, "Turn on autopilot for the wedding");
  delete process.env.MODEL_API_KEY; // the weekly report falls back to a plain summary without a model
  await core.updateCollection(trustCol.id, { deadline: "2020-01-02" });
  const run1 = await ap.runAutopilot(new Date());
  assert.equal(run1.reminded, 1, "only the due pledge is reminded");
  assert.equal(run1.reports, 1);
  assert.equal(run1.deadlineNotes, 1);
  assert.ok((await inbox("sim:255700000808")).some((m) => m.includes("reminder") || m.includes("kumbusho")), "Rehema got her reminder");
  const autoMsgs = await inbox(OWNER);
  assert.ok(autoMsgs.some((m) => m.startsWith("📊")), "weekly report sent");
  assert.ok(autoMsgs.some((m) => m.includes("⏰")), "deadline note sent");
  const run2 = await ap.runAutopilot(new Date());
  assert.deepEqual([run2.reminded, run2.reports, run2.deadlineNotes], [0, 0, 0], "nothing repeats on the next run");
  // Contributors get a weekly update (totals only) once something has changed.
  const giver = await core.getOrCreateUser("sim:255700000909", "sim", "Halima");
  const gc = await core.createContribution({ collection: trustCol, contributorId: giver.id, displayName: "Halima", amountCents: 10_000_00, source: "sim" });
  await core.applySnippePayment({ contributionId: gc.id, status: "completed", amountTzs: 10_000 });
  await core.updateCollection(trustCol.id, { autopilot: "on" });
  const freshCol = (await core.getCollectionById(trustCol.id))!;
  assert.equal(await ap.broadcastProgress(freshCol), 1, "Halima gets the update");
  const update = (await inbox("sim:255700000909")).find((m) => m.includes("💚"));
  assert.ok(update && update.includes(trustCol.title) && !update.includes("Juma"), "update has progress but no other givers' names");
  assert.equal(await ap.broadcastProgress((await core.getCollectionById(trustCol.id))!), 0, "no update when nothing changed");
  const payoutsAfter = await db.select().from(schema.payouts).where(eq(schema.payouts.collectionId, trustCol.id));
  assert.equal(payoutsAfter.length, 0, "autopilot never creates payouts");
  console.log("✓ treasurer autopilot: reminds on due date, weekly report, contributor update, deadline note, no repeats, no money moved");

  // 11d2. Every tool the agent uses is logged for the organiser's dashboard, with numbers masked.
  const log = await import("../lib/services/agent-log");
  const acts = await log.actionsFor(trustCol.code);
  const tools = acts.map((a) => a.tool);
  assert.ok(tools.includes("record_offline_payment") && tools.includes("autopilot"), "receipt and autopilot actions are in the log");
  assert.ok(acts.every((a) => a.model === "test"), "the answering model is recorded");
  assert.equal(log.mask('{"phone":"255712345678","amount":20000}'), '{"phone":"255…78","amount":20000}');
  console.log("✓ agent activity log: tool, outcome and model per action, numbers masked");

  // 11e. Share card drawn by Muse Image, stored, served and sent as an image message.
  process.env.MODEL_API_KEY = "meta_test";
  let imgPrompt = "";
  metaHandler = (url, init) => {
    assert.ok(url.endsWith("/v1/images/generations"));
    const body = JSON.parse(String(init?.body));
    imgPrompt = body.prompt;
    assert.equal(body.model, "muse-image-1.0");
    return Response.json({ created: 1, data: [{ b64_json: Buffer.from("PNGDATA").toString("base64") }], output_format: "png" });
  };
  script.push({ tool: ["make_share_card", { code: trustCol.code }] }, { text: "Your card is ready to forward 🎉" });
  await say(OWNER, "Make a poster for the wedding");
  assert.match(imgPrompt, /Harusi ya Neema & Baraka/);
  assert.doesNotMatch(imgPrompt, /TZS|sarafupay\.test/, "facts stay in the caption, not the drawing");
  const card = (await inbox(OWNER)).find((m) => m.startsWith("🖼️ https://sarafupay.test/api/media/img_"));
  assert.ok(card, "card sent as an image message");
  const mediaId = /img_[a-f0-9]{16}/.exec(card!)![0];
  const { GET: getMediaRoute } = await import("../app/api/media/[id]/route");
  const served = await getMediaRoute(new Request("https://x/api/media/" + mediaId), { params: Promise.resolve({ id: mediaId }) });
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");
  assert.equal(await served.text(), "PNGDATA");
  assert.equal((await getMediaRoute(new Request("https://x"), { params: Promise.resolve({ id: "../etc" }) })).status, 404);
  delete process.env.MODEL_API_KEY;
  console.log("✓ share card drawn by Muse Image, stored, served and sent");

  // 12. Rates an admin saved before Oct 25 lose the SarafuPay payout fee once; later edits stand.
  const settingsMod = await import("../lib/services/settings");
  const { DEFAULT_RATES } = await import("../lib/pricing");
  await db.delete(schema.settings);
  await db.insert(schema.settings).values({
    key: "pricing.rates",
    value: JSON.stringify({ ...DEFAULT_RATES, snippePayoutMobile: { ...DEFAULT_RATES.snippePayoutMobile, sarafuPct: 2.5 }, paypalPayout: { ...DEFAULT_RATES.paypalPayout, sarafuPct: 2 } }),
  });
  settingsMod.__resetRatesCache();
  const migrated = await settingsMod.getRates();
  assert.equal(migrated.snippePayoutMobile.sarafuPct, 0, "old saved payout fee removed");
  assert.equal(migrated.paypalPayout.sarafuPct, 0);
  assert.equal(migrated.snippePayment.sarafuPct, 2.5, "payment fees untouched");
  await settingsMod.saveRates({ ...migrated, snippePayoutBank: { ...migrated.snippePayoutBank, sarafuPct: 1 } });
  settingsMod.__resetRatesCache();
  assert.equal((await settingsMod.getRates()).snippePayoutBank.sarafuPct, 1, "an admin's later choice is kept");
  console.log("✓ payouts carry no SarafuPay fee; old saved rates migrated once");

  // 10. Cost guard without Key Value falls back to memory and still limits.
  const limits = await import("../lib/limits");
  for (let i = 0; i < 3; i++) assert.equal(await limits.hit("test-ip", 3, 60_000), true);
  assert.equal(await limits.hit("test-ip", 3, 60_000), false, "4th hit in window is refused");
  assert.equal((await limits.aiUsageToday()).store, "memory");
  console.log("✓ cost guard works without Key Value (in-memory fallback)");

  console.log("\nAll e2e checks passed ✅");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
