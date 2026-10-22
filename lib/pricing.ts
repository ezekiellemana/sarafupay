// SarafuPay pricing. Pure functions: no I/O, safe to import anywhere (server, client, tests).
//
// Rules (Enzo, Oct 22 2026):
// - Contributors pay exactly what they give. The organiser carries every fee.
// - On every payment and every payout the provider (Snippe or PayPal) takes its own fee,
//   and SarafuPay takes a percentage of the same amount. Both are shown on every receipt.
// - No minimum withdrawal.
//
// Money is stored in "cents" everywhere in this app (amount × 100), for TZS as well as USD,
// so one integer type covers both rails. TZS amounts are rounded to whole shillings.

export type Rail = "snippe" | "paypal";
export type PayoutMethod = "mobile_money" | "bank" | "paypal";

/** One priced step: what the provider charges and what SarafuPay charges, as % of the amount. */
export type Rate = {
  /** Provider percentage fee, e.g. 2.5 for 2.5%. */
  providerPct: number;
  /** Provider fixed fee in cents of the rail's currency (e.g. 150000 = TZS 1,500; 30 = $0.30). */
  providerFixedCents: number;
  /** Optional cap on the provider fee in cents (PayPal Payouts: $1.00 = 100). 0 = no cap. */
  providerCapCents: number;
  /** SarafuPay percentage, taken on the full amount. */
  sarafuPct: number;
};

export type Rates = {
  /** Mobile money contribution via Snippe (TZS). */
  snippePayment: Rate;
  /** Payout to mobile money via Snippe (TZS). */
  snippePayoutMobile: Rate;
  /** Payout to a Tanzanian bank via Snippe (TZS). */
  snippePayoutBank: Rate;
  /** Card or PayPal contribution via PayPal Checkout (USD). */
  paypalPayment: Rate;
  /** Payout to the organiser's PayPal account via PayPal Payouts (USD). */
  paypalPayout: Rate;
};

export const RATE_KEYS = ["snippePayment", "snippePayoutMobile", "snippePayoutBank", "paypalPayment", "paypalPayout"] as const;
export type RateKey = (typeof RATE_KEYS)[number];

/**
 * Defaults, from the providers' own price lists (checked Oct 22 2026):
 * - Snippe: 2.5% per collection; TZS 1,500 per disbursement (snippe.sh/pricing).
 * - PayPal (Tanzania seller, "All other markets"): receiving international 4.90% + $0.30;
 *   PayPal Payouts 2% with a maximum fee of $1.00 (PayPal merchant fees, Sep 28 2026).
 * SarafuPay percentages are Enzo's: 2.5% / 2.5% on Snippe, 3% / 2% on PayPal.
 */
export const DEFAULT_RATES: Rates = {
  snippePayment: { providerPct: 2.5, providerFixedCents: 0, providerCapCents: 0, sarafuPct: 2.5 },
  snippePayoutMobile: { providerPct: 0, providerFixedCents: 150000, providerCapCents: 0, sarafuPct: 2.5 },
  snippePayoutBank: { providerPct: 0, providerFixedCents: 150000, providerCapCents: 0, sarafuPct: 2.5 },
  paypalPayment: { providerPct: 4.9, providerFixedCents: 30, providerCapCents: 0, sarafuPct: 3 },
  paypalPayout: { providerPct: 2, providerFixedCents: 0, providerCapCents: 100, sarafuPct: 2 },
};

export const RATE_LABELS: Record<RateKey, { title: string; provider: string; currency: "TZS" | "USD"; kind: "payment" | "payout" }> = {
  snippePayment: { title: "Mobile money payment", provider: "Snippe", currency: "TZS", kind: "payment" },
  snippePayoutMobile: { title: "Payout to mobile money", provider: "Snippe", currency: "TZS", kind: "payout" },
  snippePayoutBank: { title: "Payout to bank", provider: "Snippe", currency: "TZS", kind: "payout" },
  paypalPayment: { title: "Card or PayPal payment", provider: "PayPal", currency: "USD", kind: "payment" },
  paypalPayout: { title: "Payout to PayPal", provider: "PayPal", currency: "USD", kind: "payout" },
};

export const railCurrency = (rail: Rail): "TZS" | "USD" => (rail === "snippe" ? "TZS" : "USD");

/** Round to the smallest unit that rail actually moves: whole shillings for TZS, cents for USD. */
export function roundFor(currency: string, cents: number): number {
  const unit = currency.toUpperCase() === "TZS" ? 100 : 1;
  return Math.round(cents / unit) * unit;
}

export function providerFee(rate: Rate, amountCents: number, currency: string): number {
  let fee = (amountCents * rate.providerPct) / 100 + rate.providerFixedCents;
  if (rate.providerCapCents > 0) fee = Math.min(fee, rate.providerCapCents);
  return roundFor(currency, fee);
}

export function sarafuFee(rate: Rate, amountCents: number, currency: string): number {
  return roundFor(currency, (amountCents * rate.sarafuPct) / 100);
}

export type Quote = {
  currency: string;
  /** What moves: the contribution the contributor pays, or the amount withdrawn from the balance. */
  grossCents: number;
  providerFeeCents: number;
  sarafuFeeCents: number;
  /** Payment: what reaches the collection balance. Payout: what the organiser receives. */
  netCents: number;
  rate: Rate;
};

function quote(rate: Rate, grossCents: number, currency: string, actualProviderFeeCents?: number): Quote {
  if (!Number.isFinite(grossCents) || grossCents <= 0) throw new Error("Amount must be positive");
  const p = actualProviderFeeCents ?? providerFee(rate, grossCents, currency);
  const s = sarafuFee(rate, grossCents, currency);
  return { currency, grossCents, providerFeeCents: p, sarafuFeeCents: s, netCents: grossCents - p - s, rate };
}

/**
 * A contribution. `actualProviderFeeCents` is the fee the provider reported after settlement
 * (Snippe webhook `settlement.fees`, PayPal `seller_receivable_breakdown.paypal_fee`); when
 * given, it replaces the estimate so the organiser is charged what the provider really took.
 */
export function quotePayment(rates: Rates, rail: Rail, grossCents: number, actualProviderFeeCents?: number): Quote {
  const rate = rail === "snippe" ? rates.snippePayment : rates.paypalPayment;
  return quote(rate, grossCents, railCurrency(rail), actualProviderFeeCents);
}

export function payoutRateKey(method: PayoutMethod): RateKey {
  return method === "paypal" ? "paypalPayout" : method === "bank" ? "snippePayoutBank" : "snippePayoutMobile";
}

export const payoutRail = (method: PayoutMethod): Rail => (method === "paypal" ? "paypal" : "snippe");

/**
 * A withdrawal from the collection balance. The organiser receives `netCents`.
 * Snippe and PayPal charge their payout fee on top of what they send, so the app sends
 * `netCents` and the provider debits `netCents + providerFeeCents` from the merchant balance;
 * SarafuPay's share (`sarafuFeeCents`) stays in that balance.
 */
export function quotePayout(rates: Rates, method: PayoutMethod, grossCents: number): Quote {
  const rail = payoutRail(method);
  return quote(rates[payoutRateKey(method)], grossCents, railCurrency(rail));
}

/** "5%", "TZS 1,500 + 2.5%", "7.9% + $0.30", "2% + PayPal 2% (max $1)" — the totals shown publicly. */
export function rateSummary(rate: Rate, currency: "TZS" | "USD"): string {
  const fixed = (c: number) => (currency === "TZS" ? `TZS ${(c / 100).toLocaleString("en-US")}` : `$${(c / 100).toFixed(2)}`);
  const pct = (n: number) => `${Number(n.toFixed(2))}%`;
  if (rate.providerCapCents > 0) return `${pct(rate.sarafuPct)} + ${pct(rate.providerPct)} (provider, max ${fixed(rate.providerCapCents)})`;
  const total = rate.providerPct + rate.sarafuPct;
  if (rate.providerFixedCents && !rate.providerPct) return `${fixed(rate.providerFixedCents)} + ${pct(rate.sarafuPct)}`;
  return rate.providerFixedCents ? `${pct(total)} + ${fixed(rate.providerFixedCents)}` : pct(total);
}

/** Validates and fills in a partial rates object (e.g. from the settings table). */
export function normalizeRates(input: unknown): Rates {
  const src = (input && typeof input === "object" ? input : {}) as Partial<Record<RateKey, Partial<Rate>>>;
  const out = {} as Rates;
  for (const k of RATE_KEYS) {
    const d = DEFAULT_RATES[k];
    const r = src[k] ?? {};
    const num = (v: unknown, fb: number, max: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= max ? n : fb;
    };
    out[k] = {
      providerPct: num(r.providerPct, d.providerPct, 50),
      providerFixedCents: Math.round(num(r.providerFixedCents, d.providerFixedCents, 100_000_000)),
      providerCapCents: Math.round(num(r.providerCapCents, d.providerCapCents, 100_000_000)),
      sarafuPct: num(r.sarafuPct, d.sarafuPct, 50),
    };
  }
  return out;
}
