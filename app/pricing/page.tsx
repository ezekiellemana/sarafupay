import Link from "next/link";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinField } from "@/components/landing/coin-field";
import { TiltCard } from "@/components/landing/tilt-card";
import { ScrollFX } from "@/components/scroll-fx";
import { money } from "@/lib/format";
import { quotePayment, quotePayout, rateSummary, type Rates } from "@/lib/pricing";
import { getRates } from "@/lib/services/settings";
import { BANKS, CARDS, LogoChip, MOBILE_MONEY } from "@/components/provider";

export const metadata = {
  title: "Pricing · SarafuPay",
  description: "Friends pay exactly what they give. No monthly fee, no minimum withdrawal.",
};

type Rate = { providerPct: number; providerFixedCents: number; providerCapCents: number; sarafuPct: number };
type Line = { icon: string; what: string; price: string; rate: Rate; cur: "TZS" | "USD" };

function split(r: Rate, cur: "TZS" | "USD") {
  const fixed = (c: number) => (cur === "TZS" ? `TZS ${(c / 100).toLocaleString("en-US")}` : `$${(c / 100).toFixed(2)}`);
  const p = [r.providerPct ? `${r.providerPct}%` : "", r.providerFixedCents ? fixed(r.providerFixedCents) : ""].filter(Boolean).join(" + ");
  const cap = r.providerCapCents ? ` (max ${fixed(r.providerCapCents)})` : "";
  return `Provider ${p}${cap} · SarafuPay ${r.sarafuPct}%`;
}

function lines(r: Rates): { receive: Line[]; withdraw: Line[] } {
  return {
    receive: [
      { icon: "📱", what: "Mobile money", price: rateSummary(r.snippePayment, "TZS"), rate: r.snippePayment, cur: "TZS" },
      { icon: "💳", what: "Card, any currency", price: rateSummary(r.paypalPayment, "USD"), rate: r.paypalPayment, cur: "USD" },
    ],
    withdraw: [
      { icon: "🏦", what: "Mobile money or bank", price: rateSummary(r.snippePayoutMobile, "TZS"), rate: r.snippePayoutMobile, cur: "TZS" },
      { icon: "💳", what: "PayPal", price: `up to ${r.paypalPayout.providerPct + r.paypalPayout.sarafuPct}%`, rate: r.paypalPayout, cur: "USD" },
    ],
  };
}

function PriceList({ title, items }: { title: string; items: Line[] }) {
  return (
    <TiltCard className="price-panel">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{title}</p>
      <ul className="mt-3 divide-y divide-line">
        {items.map((l) => (
          <li key={l.what} className="py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2 font-semibold">
                <span aria-hidden>{l.icon}</span> {l.what}
              </span>
              <span className="font-display shrink-0 text-2xl font-semibold text-forest sm:text-3xl">{l.price}</span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-ink-soft">{split(l.rate, l.cur)}</p>
          </li>
        ))}
      </ul>
    </TiltCard>
  );
}

export default async function PricingPage() {
  await connection();
  const r = await getRates();
  const { receive, withdraw } = lines(r);
  const pay = quotePayment(r, "snippe", 100_000_00);
  const out = quotePayout(r, "mobile_money", pay.netCents);
  const tz = (c: number) => money(c, "TZS");

  const receipt: [string, string, boolean?][] = [
    ["Friends pay", tz(pay.grossCents), true],
    ["Provider fee", `− ${tz(pay.providerFeeCents)}`],
    ["SarafuPay fee", `− ${tz(pay.sarafuFeeCents)}`],
    ["Balance", tz(pay.netCents), true],
    ["Transfer fee", `− ${tz(out.providerFeeCents)}`],
    ["SarafuPay payout fee", `− ${tz(out.sarafuFeeCents)}`],
  ];

  return (
    <div className="min-h-screen overflow-x-clip">
      <ScrollFX />
      <div className="kanga" />
      <SiteHeader />
      <main>
        <section className="relative">
          <CoinField className="absolute inset-0 -top-24 opacity-50 [mask-image:radial-gradient(50%_70%_at_85%_40%,black_20%,transparent)]" />
          <div className="relative mx-auto max-w-5xl px-5 pb-4 pt-6 sm:px-6 sm:pt-10">
            <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Pricing</p>
            <h1 className="rise d1 font-display mt-3 max-w-2xl text-[2.6rem] font-semibold leading-[1.02] sm:text-7xl">Pay only when money moves.</h1>
            <p className="rise d2 mt-4 text-lg text-ink-soft">No monthly fee. No minimum withdrawal.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-5 py-8 sm:px-6 md:grid-cols-2" data-reveal>
          <PriceList title="Receive" items={receive} />
          <PriceList title="Withdraw" items={withdraw} />
          <p className="text-xs text-ink-soft md:col-span-2">Cards in other currencies convert to USD at PayPal&apos;s rate.</p>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-14 sm:px-6" data-reveal>
          <div className="works-with">
            {[...MOBILE_MONEY, ...CARDS, ...BANKS].map((n) => (
              <LogoChip key={n} name={n} />
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl items-center gap-8 px-5 pb-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Example</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">TZS 100,000 raised.</h2>
          </div>
          <div data-reveal style={{ "--rd": ".1s" } as React.CSSProperties}>
            <TiltCard className="receipt">
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 font-mono text-sm">
                {receipt.map(([k, v, strong], i) => (
                  <div key={k} className={`receipt-row contents ${strong ? "font-semibold" : "text-ink-soft"}`} style={{ "--i": i } as React.CSSProperties}>
                    <dt>{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex items-end justify-between border-t-2 border-dashed border-line pt-4">
                <p className="font-semibold text-forest">You receive</p>
                <p className="font-display text-3xl font-semibold text-forest sm:text-4xl">{tz(out.netCents)}</p>
              </div>
            </TiltCard>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
          <Link href="/" className="btn btn-ghost">← SarafuPay</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
