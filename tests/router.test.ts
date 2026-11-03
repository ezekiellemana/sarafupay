/** Router unit tests (no network). Run: npm run test:router */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fastPlan, parseDecision, routeMessage, routerConfigured } from "../lib/agent/router";

const ALL = ["update_my_profile", "set_reply_voice", "create_collection", "list_my_collections", "open_collection", "collection_report", "create_payment_link", "make_pledge", "prepare_payout", "record_offline_payment", "investigate_payments", "get_dashboard_link", "pricing", "payout_history"];

test("parses the router's JSON, with or without noise around it", () => {
  assert.deepEqual(parseDecision('{"intent": "pricing", "lang": "sw", "route": "fast"}'), { intent: "pricing", lang: "sw", route: "fast" });
  assert.deepEqual(parseDecision('Sure: {"intent":"PAYOUT","lang":"en","route":"full"} done'), { intent: "payout", lang: "en", route: "full" });
});

test("anything off-schema means the full path", () => {
  for (const raw of ["", "hello", '{"intent":"steal","lang":"sw","route":"fast"}', '{"intent":"pricing","lang":"fr","route":"fast"}', '{"intent":"pricing"', "{bad json}"]) {
    assert.equal(parseDecision(raw), null, raw);
  }
});

test("money and follow-ups never take the fast path, even if the model says fast", () => {
  for (const intent of ["payout", "receipt_offline", "chase_payments", "followup", "multi", "autopilot_settings"] as const) {
    assert.equal(fastPlan({ intent, lang: "sw", route: "fast" }, ALL), null, intent);
  }
  assert.equal(fastPlan({ intent: "pricing", lang: "sw", route: "full" }, ALL), null);
  assert.equal(fastPlan(null, ALL), null);
});

test("a fast plan only exposes that intent's tools plus the read-only basics", () => {
  const plan = fastPlan({ intent: "collection_status", lang: "sw", route: "fast" }, ALL)!;
  assert.ok(plan.activeTools.includes("collection_report"));
  assert.ok(plan.activeTools.includes("open_collection"));
  assert.ok(!plan.activeTools.includes("prepare_payout"));
  assert.ok(!plan.activeTools.includes("record_offline_payment"));
});

test("without Fireworks config the router is off and changes nothing", async () => {
  delete process.env.FIREWORKS_API_KEY;
  delete process.env.ROUTER_MODEL;
  assert.equal(routerConfigured(), false);
  assert.equal(await routeMessage("Tumefikisha kiasi gani?"), null);
});

test("calls the deployment and survives errors and timeouts", async () => {
  process.env.FIREWORKS_API_KEY = "fw_test";
  process.env.ROUTER_MODEL = "accounts/test/deployments/router";
  process.env.ROUTER_TIMEOUT_MS = "200";
  const real = globalThis.fetch;
  try {
    let body: { model?: string; messages?: { role: string; content: string }[] } = {};
    globalThis.fetch = (async (_u: string, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Response.json({ choices: [{ message: { content: '{"intent": "collection_status", "lang": "sw", "route": "fast"}' } }] });
    }) as typeof fetch;
    const ok = await routeMessage("Tumefikisha kiasi gani?");
    assert.equal(ok?.decision?.intent, "collection_status");
    assert.equal(body.model, "accounts/test/deployments/router");
    assert.equal(body.messages?.[1].content, "Tumefikisha kiasi gani?");

    globalThis.fetch = (async () => new Response("down", { status: 503 })) as typeof fetch;
    assert.equal((await routeMessage("habari"))?.decision, null);

    globalThis.fetch = ((_u: string, init?: RequestInit) =>
      new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))))) as typeof fetch;
    const keepAlive = setTimeout(() => {}, 5000); // AbortSignal.timeout's timer doesn't hold the loop open
    const slow = await routeMessage("habari");
    clearTimeout(keepAlive);
    assert.equal(slow?.decision, null);
    assert.ok(slow!.ms < 1000);
  } finally {
    globalThis.fetch = real;
    delete process.env.FIREWORKS_API_KEY;
    delete process.env.ROUTER_MODEL;
  }
});
