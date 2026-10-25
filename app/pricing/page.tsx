import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinField } from "@/components/landing/coin-field";
import { TiltCard } from "@/components/landing/tilt-card";
import { ScrollFX } from "@/components/scroll-fx";
import { money } from "@/lib/format";
import { quotePayment, quotePayout, rateSummary, type Rates } from "@/lib/pricing";
import { getRates } from "@/lib/services/settings";
import { BANKS, CARDS, LogoChip, MOBILE_MONEY } from "@/components/provider";
import { detectVisitor } from "@/lib/visitor";
import { fmt, friendly, perUsd, type Visitor } from "@/lib/locale";
import { copy, type Copy } from "@/lib/copy";
import { Bank, Card, IconBadge, PhoneMoney } from "@/components/icons";

export const metadata = {
  title: "Pricing · SarafuPay",
  description: "Friends pay exactly what they give. No monthly fee, no minimum withdrawal.",
};

type Option = { icon: typeof Card; what: string; price: string };

/** The visitor's own way first: mobile money in Tanzania, card elsewhere. */
function options(r: Rates, v: Visitor, t: Copy["pricing"]) {
  const mm: Option = { icon: PhoneMoney, what: t.mm, price: rateSummary(r.snippePayment, "TZS") };
  const card: Option = { icon: Card, what: t.card, price: rateSummary(r.paypalPayment, "USD") };
  const mmOut: Option = { icon: Bank, what: t.mmOut, price: rateSummary(r.snippePayoutMobile, "TZS") };
  const ppOut: Option = { icon: Card, what: "PayPal", price: rateSummary(r.paypalPayout, "USD") };
  return v.mobileMoney ? { pay: [mm, card], out: [mmOut, ppOut] } : { pay: [card, mm], out: [ppOut, mmOut] };
}

/** One big price for the visitor's own way, and one quiet line for the other. */
function PriceCard({ title, main, other, note, orWord, badge }: { title: string; main: Option; other: Option; note: string; orWord: string; badge?: string }) {
  return (
    <TiltCard className="price-panel flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{title}</p>
        {badge ? <span className="rounded-full bg-marigold/25 px-2.5 py-0.5 text-xs font-semibold text-[#7a4f00]">{badge}</span> : null}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <IconBadge icon={main.icon} size={40} />
        <p className="font-semibold">{main.what}</p>
      </div>
      <p className="font-display mt-3 text-[2.6rem] font-semibold leading-none text-forest sm:text-6xl">{main.price}</p>
      <p className="mt-3 text-sm text-ink-soft">{note}</p>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-ink-soft">
          <span className="text-xs">{orWord}</span>
          <other.icon size={18} className="shrink-0 text-forest" />
          <span>{other.what}</span>
        </span>
        <span className="shrink-0 font-semibold">{other.price}</span>
      </div>
    </TiltCard>
  );
}

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  await connection();
  const v = await detectVisitor((await searchParams).country);
  const r = await getRates();
  const t = copy(v.lang).pricing;
  const c = copy(v.lang).calc;
  const o = options(r, v, t);
  // Worked example on the rail this visitor would use: TZS 100,000 by mobile money in Tanzania, $100 by card elsewhere.
  const card = !v.mobileMoney;
  const pay = card ? quotePayment(r, "paypal", 100_00) : quotePayment(r, "snippe", 100_000_00);
  const out = card ? quotePayout(r, "paypal", pay.netCents) : quotePayout(r, "mobile_money", pay.netCents);
  const tz = (c: number) => money(c, card ? "USD" : "TZS");
  const approx = card && v.cur !== "USD" ? `≈ ${fmt(v.cur, friendly((out.netCents / 100) * perUsd(v.cur)))}` : null;

  const receipt: [string, string, boolean?][] = [
    [t.friendsPay, tz(pay.grossCents), true],
    [c.providerFee, `− ${tz(pay.providerFeeCents)}`],
    [c.sarafuFee, `− ${tz(pay.sarafuFeeCents)}`],
    [t.balance, tz(pay.netCents), true],
    [c.transferFee, `− ${tz(out.providerFeeCents)}`],
    [t.payoutFee, out.sarafuFeeCents ? `− ${tz(out.sarafuFeeCents)}` : c.free],
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
            <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{t.kicker}</p>
            <h1 className="rise d1 font-display mt-3 max-w-2xl text-[2.6rem] font-semibold leading-[1.02] sm:text-7xl">{t.title}</h1>
            <p className="rise d2 mt-4 text-lg text-ink-soft">{t.sub}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-5 py-8 sm:px-6 md:grid-cols-2" data-reveal>
          <PriceCard title={t.chipInTitle} main={o.pay[0]} other={o.pay[1]} note={t.friendsExact} orWord={t.or} />
          <PriceCard title={t.withdrawTitle} main={o.out[0]} other={o.out[1]} note={t.freeFromUs} orWord={t.or} badge={`SarafuPay ${c.free}`} />
        </section>

        <ul className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-5 text-sm text-ink-soft sm:px-6" data-reveal>
          {[t.convert].map((x) => (
            <li key={x} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" aria-hidden />
              {x}
            </li>
          ))}
        </ul>

        <section className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{t.example}</p>
            <h2 className="font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{card ? t.raisedCard : t.raisedTz}</h2>
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
                <p className="font-semibold text-forest">{t.youReceive}</p>
                <div className="text-right">
                  <p className="font-display text-3xl font-semibold text-forest sm:text-4xl">{tz(out.netCents)}</p>
                  {approx ? <p className="text-sm text-ink-soft">{approx}</p> : null}
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-6" data-reveal>
          <div className="works-with">
            {[...MOBILE_MONEY, ...CARDS, ...BANKS].map((n) => (
              <LogoChip key={n} name={n} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
