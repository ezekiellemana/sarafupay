import Link from "next/link";
import { connection } from "next/server";
import { Logo, SandboxBadge } from "@/components/brand";
import { money } from "@/lib/format";
import { quotePayment, quotePayout, rateSummary, type Rates } from "@/lib/pricing";
import { getRates } from "@/lib/services/settings";

export const metadata = {
  title: "Pricing · SarafuPay",
  description: "Contributors pay exactly what they give. No monthly fees, no minimum withdrawal.",
};

type Row = { what: string; detail: string; price: string; split: string };

function rows(r: Rates): { receive: Row[]; withdraw: Row[] } {
  const split = (prov: string, rate: { providerPct: number; providerFixedCents: number; providerCapCents: number; sarafuPct: number }, cur: "TZS" | "USD") => {
    const fixed = (c: number) => (cur === "TZS" ? `TZS ${(c / 100).toLocaleString("en-US")}` : `$${(c / 100).toFixed(2)}`);
    const p = [rate.providerPct ? `${rate.providerPct}%` : "", rate.providerFixedCents ? fixed(rate.providerFixedCents) : ""].filter(Boolean).join(" + ");
    const cap = rate.providerCapCents ? ` (max ${fixed(rate.providerCapCents)})` : "";
    return `${prov} ${p}${cap} · SarafuPay ${rate.sarafuPct}%`;
  };
  return {
    receive: [
      { what: "Mobile money", detail: "M-Pesa, Airtel Money, Mixx by Yas, HaloPesa · TZS", price: rateSummary(r.snippePayment, "TZS"), split: split("Snippe", r.snippePayment, "TZS") },
      { what: "Card or PayPal", detail: "Visa, Mastercard, PayPal · USD, for friends abroad", price: rateSummary(r.paypalPayment, "USD"), split: split("PayPal", r.paypalPayment, "USD") },
    ],
    withdraw: [
      { what: "To mobile money", detail: "Any Tanzanian mobile money number · instant", price: rateSummary(r.snippePayoutMobile, "TZS"), split: split("Snippe", r.snippePayoutMobile, "TZS") },
      { what: "To a bank account", detail: "40+ Tanzanian banks · minutes to 2 business days", price: rateSummary(r.snippePayoutBank, "TZS"), split: split("Snippe", r.snippePayoutBank, "TZS") },
      { what: "To PayPal", detail: "From the USD balance", price: `up to ${r.paypalPayout.providerPct + r.paypalPayout.sarafuPct}%`, split: split("PayPal", r.paypalPayout, "USD") },
    ],
  };
}

export default async function PricingPage() {
  await connection();
  const r = await getRates();
  const { receive, withdraw } = rows(r);
  const pay = quotePayment(r, "snippe", 100_000_00);
  const out = quotePayout(r, "mobile_money", pay.netCents);
  const tz = (c: number) => money(c, "TZS");

  const Card = ({ row }: { row: Row }) => (
    <div className="card flex flex-col gap-1 p-5">
      <p className="font-semibold">{row.what}</p>
      <p className="font-display text-4xl font-semibold leading-tight text-forest">{row.price}</p>
      <p className="text-sm text-ink-soft">{row.detail}</p>
      <p className="mt-2 border-t border-line pt-2 font-mono text-xs text-ink-soft">{row.split}</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="kanga" />
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
        <Logo />
        <SandboxBadge />
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
        <section className="rise max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Pricing</p>
          <h1 className="font-display mt-3 text-[2.5rem] font-semibold leading-tight sm:text-6xl">You only pay when money moves.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Contributors pay exactly what they give. The organiser covers the fees, which come out of the collection. No monthly
            fee, no setup fee, no minimum withdrawal.
          </p>
        </section>

        <h2 className="font-display mt-12 text-2xl font-semibold">Receiving contributions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {receive.map((row) => <Card key={row.what} row={row} />)}
        </div>

        <h2 className="font-display mt-12 text-2xl font-semibold">Withdrawing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {withdraw.map((row) => <Card key={row.what} row={row} />)}
        </div>

        <section className="card mt-12 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">A worked example</h2>
          <p className="mt-1 text-sm text-ink-soft">A wedding collection raises TZS 100,000 by M-Pesa and the organiser withdraws it all to mobile money.</p>
          <dl className="mt-5 grid gap-x-8 gap-y-2 font-mono text-sm sm:grid-cols-[1fr_auto]">
            <dt>Contributors pay</dt><dd className="sm:text-right">{tz(pay.grossCents)}</dd>
            <dt className="text-ink-soft">Snippe fee</dt><dd className="text-ink-soft sm:text-right">− {tz(pay.providerFeeCents)}</dd>
            <dt className="text-ink-soft">SarafuPay fee</dt><dd className="text-ink-soft sm:text-right">− {tz(pay.sarafuFeeCents)}</dd>
            <dt className="font-semibold">Collection balance</dt><dd className="font-semibold sm:text-right">{tz(pay.netCents)}</dd>
            <dt className="text-ink-soft">Snippe transfer fee</dt><dd className="text-ink-soft sm:text-right">− {tz(out.providerFeeCents)}</dd>
            <dt className="text-ink-soft">SarafuPay payout fee</dt><dd className="text-ink-soft sm:text-right">− {tz(out.sarafuFeeCents)}</dd>
            <dt className="border-t border-line pt-2 font-semibold text-forest">Organiser receives</dt>
            <dd className="border-t border-line pt-2 font-semibold text-forest sm:text-right">{tz(out.netCents)}</dd>
          </dl>
          <p className="mt-5 text-sm text-ink-soft">
            Fewer, larger withdrawals cost less, because each transfer has its own provider fee. Every receipt and every
            transparency update shows each fee.
          </p>
        </section>

        <section className="mt-12 max-w-2xl text-sm leading-relaxed text-ink-soft">
          <h2 className="font-display text-xl font-semibold text-ink">Who handles the money</h2>
          <p className="mt-2">
            SarafuPay is a technology and record-keeping platform by EPRIZE DIGITAL. Mobile money is collected and paid out by Snippe;
            card and PayPal payments by PayPal. SarafuPay never sees your PIN or card details.
          </p>
          <Link href="/" className="btn btn-ghost mt-6">Back to SarafuPay</Link>
        </section>
      </main>
    </div>
  );
}
