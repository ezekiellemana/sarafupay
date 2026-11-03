import "server-only";
import { env } from "../env";

/**
 * The message router: a small Muse Glimmer 30B model, LoRA-tuned on Kiswahili and English SarafuPay
 * WhatsApp messages (ml/router/), reads each text message and says what it is about. Clear,
 * single-purpose, low-stakes messages ("tumefikisha kiasi gani?", "my name is Asha") take a fast
 * path: Muse Spark sees only the tools that intent needs, with less reasoning. Anything that moves
 * or records money, chases payers, follows up on an earlier turn, or asks several things takes the
 * full path, as does every message the router can't classify in time. The router never answers and
 * never calls a tool itself.
 */

export const INTENTS = [
  "greeting_help", "profile_voice", "create_collection", "collection_status", "contribute", "share", "pricing",
  "chase_payments", "receipt_offline", "payout", "autopilot_settings", "followup", "multi", "other",
] as const;
export type Intent = (typeof INTENTS)[number];
export type RouteDecision = { intent: Intent; lang: "sw" | "en" | "mix"; route: "fast" | "full" };

// Keep in sync with ROUTER_SYSTEM in ml/router/build_dataset.py: the model was trained on this exact text.
export const ROUTER_SYSTEM =
  "You route WhatsApp messages for SarafuPay, a group money collection service in Tanzania. " +
  "Messages are in Kiswahili, English or a mix. Read ONE message and respond with ONLY a compact " +
  "JSON object (no prose, no code fence) with exactly these keys, in this order:\n" +
  '- "intent": one of "greeting_help", "profile_voice", "create_collection", "collection_status", ' +
  '"contribute", "share", "pricing", "chase_payments", "receipt_offline", "payout", ' +
  '"autopilot_settings", "followup", "multi", "other"\n' +
  '- "lang": one of "sw", "en", "mix"\n' +
  '- "route": one of "fast", "full"\n\n' +
  'Example: {"intent": "payout", "lang": "sw", "route": "full"}';

/** Read-only tools every fast turn keeps, so a slightly-off intent can still answer. */
const ALWAYS = ["list_my_collections", "open_collection", "get_dashboard_link", "update_my_profile"];

/** Tools each fast intent may call. Intents not listed here never take the fast path. */
const FAST_TOOLS: Partial<Record<Intent, string[]>> = {
  greeting_help: ["pricing"],
  profile_voice: ["set_reply_voice"],
  create_collection: ["create_collection", "update_collection", "get_share_message", "make_share_card"],
  collection_status: ["collection_report", "payout_history"],
  contribute: ["create_payment_link", "make_pledge", "my_contributions"],
  share: ["get_share_message", "make_share_card", "send_thank_you_videos"],
  pricing: ["pricing"],
  other: [],
};

export function routerConfigured(): boolean {
  return Boolean(env.fireworksApiKey() && env.routerModel());
}

/** Parses the router's JSON answer; anything malformed or off-schema is null (= full path). */
export function parseDecision(raw: string | null | undefined): RouteDecision | null {
  const m = /\{[\s\S]*?\}/.exec(raw ?? "");
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>;
    const intent = String(o.intent ?? "").toLowerCase() as Intent;
    const lang = String(o.lang ?? "").toLowerCase();
    const route = String(o.route ?? "").toLowerCase();
    if (!INTENTS.includes(intent) || !["sw", "en", "mix"].includes(lang) || !["fast", "full"].includes(route)) return null;
    return { intent, lang: lang as RouteDecision["lang"], route: route as RouteDecision["route"] };
  } catch {
    return null;
  }
}

export type FastPlan = { activeTools: string[]; maxSteps: number };

/** The fast plan for a decision, or null for the full path. Both the route and the intent must agree. */
export function fastPlan(d: RouteDecision | null, available: string[]): FastPlan | null {
  if (!d || d.route !== "fast") return null;
  const tools = FAST_TOOLS[d.intent];
  if (!tools) return null;
  const want = new Set([...ALWAYS, ...tools]);
  return { activeTools: available.filter((t) => want.has(t)), maxSteps: 4 };
}

/**
 * Asks the Glimmer router about one text message. Never throws: no config, a timeout, an HTTP error
 * or a bad answer all return null, which means "take the full path", i.e. today's behaviour.
 */
export async function routeMessage(text: string): Promise<{ decision: RouteDecision | null; ms: number; raw?: string } | null> {
  if (!routerConfigured() || !text.trim()) return null;
  const started = Date.now();
  try {
    const res = await fetch(`${env.routerBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.fireworksApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.routerModel(),
        messages: [
          { role: "system", content: ROUTER_SYSTEM },
          { role: "user", content: text.slice(0, 1000) },
        ],
        max_tokens: 48,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(env.routerTimeoutMs()),
    });
    if (!res.ok) throw new Error(`router HTTP ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    return { decision: parseDecision(raw), ms: Date.now() - started, raw };
  } catch (e) {
    console.warn("[router] skipped:", e instanceof Error ? e.message : e);
    return { decision: null, ms: Date.now() - started };
  }
}
