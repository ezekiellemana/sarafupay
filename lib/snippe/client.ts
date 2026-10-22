import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env";

// Snippe (snippe.sh), Tanzanian mobile money: M-Pesa, Airtel Money, Mixx by Yas, HaloPesa.
// Docs: https://docs.snippe.sh (API version 2026-01-25). Amounts are whole TZS integers here;
// the rest of the app stores cents (× 100), so callers convert at the boundary.

export class SnippeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

type Envelope<T> = { status?: string; code?: number; data?: T; message?: string; error?: string };

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const key = env.snippeApiKey();
  if (!key) throw new SnippeError("Snippe is not configured (SNIPPE_API_KEY missing)");
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey.slice(0, 30);
  let res: Response;
  try {
    res = await fetch(`${env.snippeBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    throw new SnippeError(`Snippe unreachable: ${e instanceof Error ? e.message : String(e)}`);
  }
  const text = await res.text();
  let json: Envelope<T> | undefined;
  try {
    json = text ? (JSON.parse(text) as Envelope<T>) : undefined;
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `HTTP ${res.status}`;
    console.error(`[snippe] ${method} ${path} → ${res.status} ${msg}`);
    throw new SnippeError(`Snippe: ${msg}`, res.status, json ?? text);
  }
  return (json?.data ?? (json as unknown)) as T;
}

/** 0712 345 678 / +255712345678 / 712345678 → 255712345678. Throws on anything else. */
export function normalizeTzPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("255") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 10) return "255" + d.slice(1);
  if (d.length === 9 && /^[67]/.test(d)) return "255" + d;
  throw new Error("Use a Tanzanian mobile number like 0712 345 678");
}

export const isTzPhone = (raw: string) => {
  try {
    normalizeTzPhone(raw);
    return true;
  } catch {
    return false;
  }
};

// ---------- hosted checkout (payment sessions) ----------

type SessionData = { id?: string; reference: string; status: string; checkout_url?: string; payment_link_url?: string; amount?: number };

export type SnippeSession = { reference: string; status: string; checkoutUrl: string };

export async function createSession(input: {
  contributionId: string;
  amountTzs: number;
  description: string;
  customerName?: string;
  customerPhone?: string;
  redirectUrl: string;
  webhookUrl: string;
}): Promise<SnippeSession> {
  if (!Number.isInteger(input.amountTzs) || input.amountTzs < 500) throw new SnippeError("Mobile money payments start at TZS 500");
  const customer: Record<string, string> = {};
  if (input.customerName) customer.name = input.customerName.slice(0, 200);
  if (input.customerPhone) customer.phone = "+" + normalizeTzPhone(input.customerPhone);
  const data = await call<SessionData>(
    "POST",
    "/api/v1/sessions",
    {
      amount: input.amountTzs,
      currency: "TZS",
      allowed_methods: ["mobile_money"],
      ...(env.snippeProfileId() ? { profile_id: env.snippeProfileId() } : {}),
      ...(Object.keys(customer).length ? { customer } : {}),
      redirect_url: input.redirectUrl,
      webhook_url: input.webhookUrl,
      description: input.description.slice(0, 500),
      metadata: { contribution_id: input.contributionId },
      expires_in: 3600,
    },
    input.contributionId,
  );
  const checkoutUrl = data.checkout_url ?? data.payment_link_url;
  if (!data.reference || !checkoutUrl) throw new SnippeError("Snippe returned no checkout link");
  return { reference: data.reference, status: data.status, checkoutUrl };
}

export async function getSession(reference: string): Promise<{ reference: string; status: string; amountTzs?: number }> {
  const data = await call<SessionData>("GET", `/api/v1/sessions/${encodeURIComponent(reference)}`);
  return { reference: data.reference ?? reference, status: data.status, amountTzs: data.amount };
}

// ---------- payouts (disbursements) ----------

type Money = { value?: number; currency?: string };
type PayoutData = {
  reference: string;
  status: string;
  fees?: Money;
  fee_amount?: number;
  total?: Money;
  failure_reason?: string;
};

export type SnippePayout = { reference: string; status: string; feeTzs?: number; failureReason?: string };

function toPayout(d: PayoutData): SnippePayout {
  return { reference: d.reference, status: d.status, feeTzs: d.fees?.value ?? d.fee_amount, failureReason: d.failure_reason };
}

/** Snippe's fee for sending `amountTzs` (charged on top, from the merchant balance). */
export async function payoutFee(amountTzs: number): Promise<number> {
  const d = await call<{ fee_amount?: number }>("GET", `/v1/payouts/fee?amount=${Math.round(amountTzs)}`);
  if (typeof d.fee_amount !== "number") throw new SnippeError("Snippe returned no payout fee");
  return d.fee_amount;
}

export async function sendPayout(input: {
  payoutId: string;
  amountTzs: number;
  recipientName: string;
  narration: string;
  webhookUrl: string;
  to: { channel: "mobile"; phone: string } | { channel: "bank"; bank: string; account: string };
}): Promise<SnippePayout> {
  const base = {
    amount: Math.round(input.amountTzs),
    recipient_name: input.recipientName.slice(0, 120),
    narration: input.narration.slice(0, 200),
    webhook_url: input.webhookUrl,
    metadata: { payout_id: input.payoutId },
  };
  const body =
    input.to.channel === "mobile"
      ? { ...base, channel: "mobile", recipient_phone: normalizeTzPhone(input.to.phone) }
      : { ...base, channel: "bank", recipient_bank: input.to.bank, recipient_account: input.to.account.replace(/\s/g, "") };
  return toPayout(await call<PayoutData>("POST", "/v1/payouts/send", body, input.payoutId));
}

export async function getPayout(reference: string): Promise<SnippePayout> {
  return toPayout(await call<PayoutData>("GET", `/v1/payouts/${encodeURIComponent(reference)}`));
}

// ---------- webhooks ----------

/**
 * Snippe signs `${timestamp}.${rawBody}` with HMAC-SHA256 (hex) using the webhook secret.
 * Headers: X-Webhook-Signature, X-Webhook-Timestamp. Events older than 5 minutes are refused.
 */
export function verifyWebhook(rawBody: string, signature: string | null, timestamp: string | null, now = Date.now()): boolean {
  const secret = env.snippeWebhookSecret();
  if (!secret || !signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const tsMs = ts > 1e12 ? ts : ts * 1000;
  if (Math.abs(now - tsMs) > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type SnippeEvent = {
  id?: string;
  type: string;
  data: {
    reference?: string;
    session_reference?: string;
    external_reference?: string;
    status?: string;
    amount?: Money | number;
    settlement?: { gross?: Money; fees?: Money; net?: Money };
    fees?: Money;
    customer?: { name?: string; phone?: string; email?: string };
    channel?: { type?: string; provider?: string };
    metadata?: Record<string, unknown>;
    failure_reason?: string;
  };
};

export const SNIPPE_BANKS: Record<string, string> = {
  ABSA: "ABSA Bank Tanzania", ACCESS: "AccessBank Tanzania", AKIBA: "Akiba Commercial Bank", AMANA: "Amana Bank",
  AZANIA: "Azania Bank", BANCABC: "BancABC Tanzania", BARODA: "Bank of Baroda (Tanzania)", BOA: "Bank of Africa Tanzania",
  BOI: "Bank of India (Tanzania)", CANARA: "Canara Bank Tanzania", CITI: "Citibank Tanzania", CRDB: "CRDB Bank",
  DASHENG: "China Dasheng Bank", DCB: "DCB Commercial Bank", DTB: "Diamond Trust Bank Tanzania", ECOBANK: "Ecobank Tanzania",
  EQUITY: "Equity Bank Tanzania", EXIM: "Exim Bank (Tanzania)", FNB: "First National Bank", "GT BANK": "Guaranty Trust Bank (T)",
  HABIB: "Habib African Bank", ICB: "International Commercial Bank (Tanzania)", IMBANK: "I&M Bank", KCB: "KCB Bank Tanzania",
  KILIMANJARO: "Kilimanjaro Co-operative Bank", MAENDELEO: "Maendeleo Bank", MKOMBOZI: "Mkombozi Commercial Bank",
  MWALIMU: "Mwalimu Commercial Bank", MWANGA: "Mwanga Hakika Microfinance Bank", NBC: "NBC Bank", NCBA: "NCBA Bank",
  NMB: "NMB Bank", PBZ: "People's Bank of Zanzibar", SCB: "Standard Chartered Bank (T)", SELCOMPESA: "SelcomPesa Bank",
  STANBIC: "Stanbic Bank Tanzania", TCB: "Tanzania Commercial Bank", UBA: "United Bank for Africa (T)",
  UCHUMI: "Uchumi Commercial Bank", YETU: "Yetu Microfinance Bank",
};

/** Matches "crdb", "CRDB Bank", "nmb bank" etc. to a Snippe bank code. */
export function bankCode(input: string): string | undefined {
  const q = input.trim().toUpperCase().replace(/\s+BANK$/, "");
  if (SNIPPE_BANKS[q]) return q;
  return Object.entries(SNIPPE_BANKS).find(([, name]) => name.toUpperCase().includes(q))?.[0];
}
