/**
 * Which currencies each payment rail accepts, and how a payment in one currency settles in another.
 *
 * - Snippe (mobile money): TZS only. Snippe's Payments docs: "Only TZS is supported. Other currencies
 *   (USD, EUR, KES, etc.) will return a 400 validation error." Add KES/UGX here only once Snippe
 *   documents them and how they settle.
 * - PayPal (card or PayPal): the contributor pays in any PayPal currency; the SarafuPay account
 *   converts it to USD (Payment Receiving Preferences must be set to "accept and convert"), and the
 *   capture reports the USD amount and fee in seller_receivable_breakdown.
 */

export const SNIPPE_CURRENCIES = ["TZS"] as const;

/** Settlement currency of each rail: what the collection's balance is kept in. */
export const SETTLE_CURRENCY = { snippe: "TZS", paypal: "USD" } as const;

/**
 * PayPal REST currencies a contributor abroad can pay in (developer.paypal.com/api/rest/reference/
 * currency-codes). BRL, CNY and MYR are left out: PayPal supports them for in-country accounts only.
 */
export const PAYPAL_CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF",
  "ILS", "JPY", "HKD", "SGD", "TWD", "THB", "PHP", "MXN",
] as const;

/** PayPal rejects decimals for these. */
export const ZERO_DECIMAL = new Set(["HUF", "JPY", "TWD"]);

export const isPaypalCurrency = (c: string) => (PAYPAL_CURRENCIES as readonly string[]).includes(c.toUpperCase());

/** Amount string for PayPal's API from our ×100 integer: "1234.50", or "1235" for zero-decimal currencies. */
export function paypalValue(cents: number, currency: string): string {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? String(Math.round(cents / 100)) : (cents / 100).toFixed(2);
}

/** Region → currency, to preselect the contributor's own currency from their browser language. */
const REGION_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", NL: "EUR", BE: "EUR", IT: "EUR", ES: "EUR", PT: "EUR",
  AT: "EUR", FI: "EUR", GR: "EUR", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  PL: "PLN", CZ: "CZK", HU: "HUF", IL: "ILS", JP: "JPY", HK: "HKD", SG: "SGD", TW: "TWD", TH: "THB", PH: "PHP",
  MX: "MXN",
};

export function currencyForLocale(locale: string | undefined): string {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  return (region && REGION_CURRENCY[region]) || "USD";
}

/** Smallest single payment we accept per currency, in ×100 units (1 unit; 100 for zero-decimal ones). */
export const minPayCents = (currency: string) => (ZERO_DECIMAL.has(currency.toUpperCase()) ? 100_00 : 1_00);

export type Settlement = {
  /** Gross amount in the settlement currency (what the payer paid, converted), ×100. */
  grossCents: number;
  /** Provider fee in the settlement currency, ×100. */
  feeCents?: number;
  currency: string;
  /** Exchange rate applied (settlement units per 1 unit paid), when the payment was converted. */
  fxRate?: string;
};

type Money = { value?: string; currencyCode?: string; currency_code?: string } | undefined;
const val = (m: Money) => (m?.value !== undefined ? Math.round(Number(m.value) * 100) : undefined);
const cur = (m: Money) => (m?.currencyCode ?? m?.currency_code)?.toUpperCase();

/**
 * What a PayPal capture is worth in the account's currency. Works with both the SDK's camelCase
 * objects and the webhook's snake_case JSON.
 * - Converted payment: receivable_amount is the money that reached the balance after PayPal's fee,
 *   and paypal_fee_in_receivable_currency is that fee, so gross = receivable + fee.
 * - Same-currency payment: gross is the captured amount and the fee is paypal_fee.
 */
export function paypalSettlement(amount: Money, breakdown: Record<string, unknown> | undefined): Settlement | undefined {
  const b = (breakdown ?? {}) as Record<string, Money | { value?: string; source_currency?: string } | undefined>;
  const receivable = (b.receivableAmount ?? b.receivable_amount) as Money;
  const feeRecv = (b.paypalFeeInReceivableCurrency ?? b.paypal_fee_in_receivable_currency) as Money;
  const rate = (b.exchangeRate ?? b.exchange_rate) as { value?: string } | undefined;
  if (receivable && val(receivable) !== undefined && cur(receivable)) {
    const fee = val(feeRecv) ?? 0;
    return { grossCents: val(receivable)! + fee, feeCents: val(feeRecv), currency: cur(receivable)!, fxRate: rate?.value };
  }
  const gross = val(amount);
  if (gross === undefined || !cur(amount)) return undefined;
  return { grossCents: gross, feeCents: val((b.paypalFee ?? b.paypal_fee) as Money), currency: cur(amount)! };
}
