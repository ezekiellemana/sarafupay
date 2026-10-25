// Pricing math, checked against the worked examples agreed with Enzo (Oct 22 2026).
// Run: npm run test:pricing
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_RATES, normalizeRates, quotePayment, quotePayout, rateSummary } from "../lib/pricing";

const TZS = (n: number) => n * 100; // app stores cents for every currency
const USD = (n: number) => Math.round(n * 100);

test("mobile money payment: Snippe 2.5% + SarafuPay 2.5% = 5%", () => {
  const q = quotePayment(DEFAULT_RATES, "snippe", TZS(100_000));
  assert.equal(q.currency, "TZS");
  assert.equal(q.providerFeeCents, TZS(2_500));
  assert.equal(q.sarafuFeeCents, TZS(2_500));
  assert.equal(q.netCents, TZS(95_000));
});

test("TZS fees round to whole shillings", () => {
  const q = quotePayment(DEFAULT_RATES, "snippe", TZS(1_234));
  assert.equal(q.providerFeeCents % 100, 0);
  assert.equal(q.sarafuFeeCents % 100, 0);
  assert.equal(q.providerFeeCents + q.sarafuFeeCents + q.netCents, TZS(1_234));
});

test("actual provider fee from the webhook replaces the estimate", () => {
  const q = quotePayment(DEFAULT_RATES, "snippe", TZS(50_000), TZS(1_000));
  assert.equal(q.providerFeeCents, TZS(1_000));
  assert.equal(q.sarafuFeeCents, TZS(1_250));
  assert.equal(q.netCents, TZS(47_750));
});

test("payout to mobile money: only Snippe's TZS 1,500, no SarafuPay fee", () => {
  const q = quotePayout(DEFAULT_RATES, "mobile_money", TZS(200_000));
  assert.equal(q.providerFeeCents, TZS(1_500));
  assert.equal(q.sarafuFeeCents, 0);
  assert.equal(q.netCents, TZS(198_500));
});

test("small payout still works (no minimum)", () => {
  const q = quotePayout(DEFAULT_RATES, "bank", TZS(20_000));
  assert.equal(q.netCents, TZS(18_500));
});

test("whole collection: TZS 1,000,000 in, one mobile payout", () => {
  const p = quotePayment(DEFAULT_RATES, "snippe", TZS(1_000_000));
  const o = quotePayout(DEFAULT_RATES, "mobile_money", p.netCents);
  assert.equal(p.netCents, TZS(950_000));
  assert.equal(o.netCents, TZS(948_500));
  assert.equal(p.providerFeeCents + o.providerFeeCents, TZS(26_500));
  assert.equal(p.sarafuFeeCents + o.sarafuFeeCents, TZS(25_000));
});

test("PayPal payment: 4.9% + $0.30 + SarafuPay 3%", () => {
  const q = quotePayment(DEFAULT_RATES, "paypal", USD(100));
  assert.equal(q.currency, "USD");
  assert.equal(q.providerFeeCents, USD(5.2));
  assert.equal(q.sarafuFeeCents, USD(3));
  assert.equal(q.netCents, USD(91.8));
});

test("PayPal payout: only PayPal's 2% (max $1), no SarafuPay fee", () => {
  const big = quotePayout(DEFAULT_RATES, "paypal", USD(100));
  assert.equal(big.providerFeeCents, USD(1));
  assert.equal(big.sarafuFeeCents, 0);
  assert.equal(big.netCents, USD(99));
  const small = quotePayout(DEFAULT_RATES, "paypal", USD(20));
  assert.equal(small.providerFeeCents, USD(0.4));
});

test("public summaries", () => {
  assert.equal(rateSummary(DEFAULT_RATES.snippePayment, "TZS"), "5%");
  assert.equal(rateSummary(DEFAULT_RATES.snippePayoutMobile, "TZS"), "TZS 1,500");
  assert.equal(rateSummary(DEFAULT_RATES.paypalPayment, "USD"), "7.9% + $0.30");
  assert.equal(rateSummary(DEFAULT_RATES.paypalPayout, "USD"), "2% (max $1.00)");
  assert.equal(rateSummary({ ...DEFAULT_RATES.snippePayoutMobile, sarafuPct: 2.5 }, "TZS"), "TZS 1,500 + 2.5%", "an admin-set payout fee still shows");
});

test("normalizeRates keeps defaults for missing or bad values", () => {
  const r = normalizeRates({ snippePayment: { sarafuPct: 3, providerPct: -1 }, paypalPayout: "nope" });
  assert.equal(r.snippePayment.sarafuPct, 3);
  assert.equal(r.snippePayment.providerPct, 2.5);
  assert.deepEqual(r.paypalPayout, DEFAULT_RATES.paypalPayout);
});

test("rejects zero or negative amounts", () => {
  assert.throws(() => quotePayment(DEFAULT_RATES, "snippe", 0));
  assert.throws(() => quotePayout(DEFAULT_RATES, "mobile_money", -5));
});
