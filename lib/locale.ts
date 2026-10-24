/**
 * Who's looking at the public site, and how to show them examples in their own money.
 * Client-safe (no server imports). Detection lives in lib/visitor.ts.
 *
 * The illustrations on the landing page (chat, 3D scenes) use the visitor's local currency.
 * Their amounts are examples, scaled from the Tanzanian originals with rough exchange rates and
 * rounded to friendly numbers; they are never used for real prices. Real prices (calculator,
 * pricing page) use the currency the visitor would actually pay in: TZS by mobile money in
 * Tanzania, card payments elsewhere (PayPal settles them in USD).
 */

export type Visitor = {
  /** ISO country code, if known. */
  country: string | null;
  lang: "sw" | "en";
  /** Local currency for example amounts. */
  cur: string;
  /** Mobile money (Snippe) is available: Tanzania. */
  mobileMoney: boolean;
};

const COUNTRY_CURRENCY: Record<string, string> = {
  TZ: "TZS", KE: "KES", UG: "UGX", RW: "RWF", BI: "BIF", CD: "CDF", ET: "ETB", ZM: "ZMW", MW: "MWK", MZ: "MZN",
  ZA: "ZAR", NG: "NGN", GH: "GHS", EG: "EGP", MA: "MAD", SN: "XOF", CI: "XOF", CM: "XAF", BW: "BWP", NA: "NAD", ZW: "USD",
  US: "USD", CA: "CAD", MX: "MXN", BR: "BRL", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN",
  GB: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", NL: "EUR", BE: "EUR", IT: "EUR", ES: "EUR", PT: "EUR", AT: "EUR", FI: "EUR", GR: "EUR",
  CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", TR: "TRY", UA: "UAH",
  AE: "AED", SA: "SAR", QA: "QAR", OM: "OMR", KW: "KWD", IL: "ILS",
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", CN: "CNY", JP: "JPY", KR: "KRW", HK: "HKD", SG: "SGD", MY: "MYR",
  ID: "IDR", TH: "THB", PH: "PHP", VN: "VND", TW: "TWD", AU: "AUD", NZ: "NZD",
};

/** Rough units per US dollar, only for scaling example amounts. */
const PER_USD: Record<string, number> = {
  USD: 1, TZS: 2600, KES: 129, UGX: 3650, RWF: 1400, BIF: 2950, CDF: 2850, ETB: 135, ZMW: 26, MWK: 1740, MZN: 64,
  ZAR: 18, NGN: 1550, GHS: 12, EGP: 49, MAD: 9.5, XOF: 570, XAF: 570, BWP: 13.5, NAD: 18,
  CAD: 1.37, MXN: 18.5, BRL: 5.5, ARS: 1200, COP: 4000, CLP: 930, PEN: 3.7,
  GBP: 0.75, EUR: 0.88, CHF: 0.82, SEK: 9.6, NOK: 10.2, DKK: 6.6, PLN: 3.8, CZK: 22, HUF: 350, TRY: 40, UAH: 41,
  AED: 3.67, SAR: 3.75, QAR: 3.64, OMR: 0.385, KWD: 0.307, ILS: 3.6,
  INR: 85, PKR: 280, BDT: 120, LKR: 300, NPR: 136, CNY: 7.2, JPY: 150, KRW: 1380, HKD: 7.8, SGD: 1.3, MYR: 4.3,
  IDR: 16000, THB: 33, PHP: 57, VND: 25500, TWD: 31, AUD: 1.52, NZD: 1.68,
};

const SWAHILI = new Set(["TZ", "KE", "UG"]);

export function visitorFor(country: string | null | undefined, langHint?: string | null): Visitor {
  const c = country && /^[A-Z]{2}$/.test(country) ? country : null;
  const cur = (c && COUNTRY_CURRENCY[c]) || "USD";
  const lang: "sw" | "en" = (c && SWAHILI.has(c)) || /^sw\b/i.test(langHint ?? "") ? "sw" : "en";
  return { country: c, lang, cur: PER_USD[cur] ? cur : "USD", mobileMoney: c === "TZ" };
}

/** Rough units of `cur` per US dollar (examples only). */
export const perUsd = (cur: string) => PER_USD[cur] ?? 1;

/** Rounds to a friendly example number: 2 significant figures (3 for 1,000–9,999 that look odd). */
export function friendly(n: number): number {
  if (n <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / mag) * mag;
}

/** An example amount given in TZS, shown in the visitor's currency. TZS stays exact. */
export function example(v: Visitor, tzs: number): number {
  if (v.cur === "TZS") return tzs;
  return friendly((tzs / PER_USD.TZS) * PER_USD[v.cur]);
}

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹", NGN: "₦", JPY: "¥", CNY: "¥", KRW: "₩", PHP: "₱", ILS: "₪", TRY: "₺", VND: "₫", UAH: "₴" };

/** "TZS 50,000", "KES 2,500", "€20", "$1,200". Whole numbers: these are examples. */
export function fmt(cur: string, amount: number): string {
  const s = Math.round(amount).toLocaleString("en-US");
  return SYMBOL[cur] ? `${SYMBOL[cur]}${s}` : `${cur} ${s}`;
}

/** Shorthand: example amount (given in TZS) formatted in the visitor's currency. */
export function ex(v: Visitor, tzs: number): string {
  return fmt(v.cur, example(v, tzs));
}

/** Pick the Swahili or English string. */
export const tr = (v: Pick<Visitor, "lang">, sw: string, en: string) => (v.lang === "sw" ? sw : en);
