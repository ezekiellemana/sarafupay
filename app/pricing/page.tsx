import Link from "next/link";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinField } from "@/components/landing/coin-field";
import { TiltCard } from "@/components/landing/tilt-card";
import { Belt } from "@/components/landing/belt";
import { ScrollFX } from "@/components/scroll-fx";
import { money } from "@/lib/format";
import { quotePayment, quotePayout, rateSummary, type Rates } from "@/lib/pricing";
import { getRates } from "@/lib/services/settings";
import { CARDS, Mark, MOBILE_MONEY, Provider, type BrandName, type ProviderName } from "@/components/provider";

export const metadata = {
  title: "Pricing · SarafuPay",
  description: "Friends pay exactly what they give. No monthly fee, no minimum withdrawal.",
};

type Rate = { providerPct: number; providerFixedCents: number; providerCapCents: number; sarafuPct: number };
type Row = { what: string; logos: BrandName[]; price: string; prov: ProviderName; rate: Rate; cur: "TZS" | "USD" };

function rows(r: Rates): { receive: Row[]; withdraw: Row[] } {
  return {
    receive: [
      { what: "Mobile money", logos: MOBILE_MONEY, price: rateSummary(r.snippePayment, "TZS"), prov: "Snippe", rate: r.snippePayment, cur: "TZS" },
      { what: "Card or PayPal", logos: CARDS, price: rateSummary(r.paypalPayment, "USD"), prov: "PayPal", rate: r.paypalPayment, cur: "USD" },
    ],
    withdraw: [
      { what: "To mobile money", logos: MOBILE_MONEY, price: rateSummary(r.snippePayoutMobile, "TZS"), prov: "Snippe", rate: r.snippePayoutMobile, cur: "TZS" },
      { what: "To a bank", logos: ["CRDB", "NMB", "NBC"], price: rateSummary(r.snippePayoutBank, "TZS"), prov: "Snippe", rate: r.snippePayoutBank, cur: "TZS" },
      { what: "To PayPal", logos: ["PayPal"], price: `up to ${r.paypalPayout.providerPct + r.paypalPayout.sarafuPct}%`, prov: "PayPal", rate: r.paypalPayout, cur: "USD" },
    ],
  };
}

function Split({ row }: { row: Row }) {
  const fixed = (c: number) => (row.cur === "TZS" ? `TZS ${(c / 100).toLocaleString("en-US")}` : `$${(c / 100).toFixed(2)}`);
  const r = row.rate;
  const p = [r.providerPct ? `${r.providerPct}%` : "", r.providerFixedCents ? fixed(r.providerFixedCents) : ""].filter(Boolean).join(" + ");
  const cap = r.providerCapCents ? ` (max ${fixed(r.providerCapCents)})` : "";
  return (
    <>
      <Provider name={row.prov} /> {p}
      {cap} · SarafuPay {r.sarafuPct}%
    </>
  );
}

function PriceCard({ row }: { row: Row }) {
  return (
    <TiltCard className="price-card">
      <div className="flex min-h-9 flex-wrap items-center gap-2">
        {row.logos.map((l) => (
          <Mark key={l} name={l} height={l === "Visa" ? 16 : l === "Airtel Money" ? 34 : 26} />
        ))}
      </div>
      <p className="mt-5 font-semibold">{row.what}</p>
      <p className="price-figure font-display text-5xl font-semibold leading-none text-forest">{row.price}</p>
      <p className="mt-5 border-t border-line pt-3 font-mono text-xs text-ink-soft">
        <Split row={row} />
      </p>
    </TiltCard>
  );
}

export default async function PricingPage() {
  await connection();
  const r = await getRates();
  const { receive, withdraw } = rows(r);
  const pay = quotePayment(r, "snippe", 100_000_00);
  const out = quotePayout(r, "mobile_money", pay.netCents);
  const tz = (c: number) => money(c, "TZS");

  const receipt: [React.ReactNode, string, string?][] = [
    ["Friends pay", tz(pay.grossCents), "strong"],
    [<><Provider name="Snippe" /> fee</>, `− ${tz(pay.providerFeeCents)}`],
    ["SarafuPay fee", `− ${tz(pay.sarafuFeeCents)}`],
    ["Balance", tz(pay.netCents), "strong"],
    [<><Provider name="Snippe" /> transfer</>, `− ${tz(out.providerFeeCents)}`],
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
          <div className="relative mx-auto max-w-5xl px-5 pb-6 pt-6 sm:px-6 sm:pt-10">
            <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Pricing</p>
            <h1 className="rise d1 font-display mt-3 max-w-2xl text-[2.6rem] font-semibold leading-[1.02] sm:text-7xl">
              Pay only when money moves.
            </h1>
            <p className="rise d2 mt-4 text-lg text-ink-soft">No monthly fee. No minimum withdrawal.</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl py-10 sm:px-6">
          <h2 className="font-display px-5 text-2xl font-semibold sm:px-0" data-reveal>Receiving</h2>
          <div className="mt-4" data-reveal style={{ "--rd": ".08s" } as React.CSSProperties}>
            <Belt label="Receiving prices" cols={2}>
              {receive.map((row) => <PriceCard key={row.what} row={row} />)}
            </Belt>
          </div>

          <h2 className="font-display mt-8 px-5 text-2xl font-semibold sm:px-0" data-reveal>Withdrawing</h2>
          <div className="mt-4" data-reveal style={{ "--rd": ".08s" } as React.CSSProperties}>
            <Belt label="Withdrawal prices">
              {withdraw.map((row) => <PriceCard key={row.what} row={row} />)}
            </Belt>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Example</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">TZS 100,000 raised.</h2>
            <p className="mt-3 text-ink-soft">Withdrawn once to mobile money.</p>
          </div>
          <div data-reveal style={{ "--rd": ".1s" } as React.CSSProperties}>
            <TiltCard className="receipt">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Receipt</p>
              <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 font-mono text-sm">
                {receipt.map(([k, v, s], i) => (
                  <div key={i} className={`receipt-row contents ${s ? "font-semibold" : "text-ink-soft"}`} style={{ "--i": i } as React.CSSProperties}>
                    <dt>{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex items-end justify-between border-t-2 border-dashed border-line pt-4">
                <p className="font-semibold text-forest">You receive</p>
                <p className="font-display text-4xl font-semibold text-forest">{tz(out.netCents)}</p>
              </div>
            </TiltCard>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-6" data-reveal>
          <Link href="/" className="btn btn-ghost">← SarafuPay</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
