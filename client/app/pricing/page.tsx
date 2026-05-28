import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Info,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing — SarafuPay",
  description:
    "Simple, transparent pricing. No setup fees, no subscriptions. SarafuPay charges a small service fee per contribution. Collection owners always receive the full contribution amount.",
  robots: { index: true, follow: true },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#19A254]">
      {children}
    </p>
  );
}

function FeeCard({
  icon,
  title,
  badge,
  rows,
  note,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  note?: string;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white shadow-sm shadow-[#0a1f12]/4",
        comingSoon ? "border-slate-200" : "border-[#e5e0d6]",
      )}
    >
      {comingSoon && (
        <div className="absolute right-4 top-4 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Coming soon
        </div>
      )}
      <div className="px-6 pb-6 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#071a0e]/6 text-[#071a0e]">
            {icon}
          </span>
          <div>
            <p className="font-bold text-[#071a0e]">{title}</p>
            {badge && (
              <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 divide-y divide-[#f5f2ed]">
          {rows.map(({ label, value, highlight }) => (
            <div key={label} className="flex items-center justify-between py-3">
              <p className="text-sm text-slate-500">{label}</p>
              <p
                className={cn(
                  "text-sm font-bold",
                  highlight ? "text-[#035034]" : "text-[#071a0e]",
                  comingSoon && "text-slate-400",
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {note && (
          <p className="mt-4 text-xs text-slate-400">{note}</p>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent: "green" | "amber" | "blue";
}) {
  const styles = {
    green: { wrap: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-700", title: "text-emerald-900" },
    amber: { wrap: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-700", title: "text-amber-900" },
    blue:  { wrap: "border-blue-200 bg-blue-50",   icon: "bg-blue-100 text-blue-700",   title: "text-blue-900" },
  }[accent];

  return (
    <div className={cn("flex gap-4 rounded-2xl border p-5", styles.wrap)}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
        {icon}
      </span>
      <div>
        <p className={cn("font-bold", styles.title)}>{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  );
}

function ExampleRow({ label, value, note, highlight }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-3", highlight && "rounded-xl bg-[#071a0e]/4 px-3")}>
      <div>
        <p className={cn("text-sm", highlight ? "font-bold text-[#071a0e]" : "text-slate-600")}>{label}</p>
        {note && <p className="text-[11px] text-slate-400">{note}</p>}
      </div>
      <p className={cn("text-sm font-bold", highlight ? "text-[#035034]" : "text-[#071a0e]")}>{value}</p>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "Why does SarafuPay charge a service fee?",
    a: "The service fee covers payment processing infrastructure, platform maintenance, and security. It allows us to keep SarafuPay running without charging subscription fees to collection owners.",
  },
  {
    q: "Are fees deducted from the collection balance?",
    a: "No. Service fees are charged separately to the contributor on top of the contribution amount. The collection balance always reflects the full contribution amount paid by contributors. Collection owners receive 100% of what contributors intend to give.",
  },
  {
    q: "How long do withdrawals take?",
    a: "Withdrawal requests are manually reviewed by our team. Most requests are processed within 1–3 business days. You will see a status update in your dashboard as your request progresses.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <BadgePercent className="size-3.5" />
            Transparent Pricing
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            No setup fees. No monthly subscriptions. You only pay a small service fee when money moves — and only contributors pay it, not collection owners.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["No setup fees", "No subscriptions", "No hidden charges", "Collection owners pay nothing"].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
              >
                <CheckCircle2 className="size-3.5 text-[#C4A237]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-14">

        {/* ── Contribution fees ── */}
        <section>
          <SectionLabel>Contribution fees</SectionLabel>
          <h2 className="text-2xl font-extrabold text-[#071a0e]">What contributors pay</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            When a contributor pays into a collection, SarafuPay adds a small service fee on top of the contribution amount. The contributor sees the total before confirming.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FeeCard
              icon={<Smartphone className="size-5" />}
              title="Mobile Money"
              badge="Active"
              rows={[
                { label: "Service fee rate", value: "3% of contribution", highlight: true },
                { label: "Minimum fee", value: "TZS 300" },
                { label: "Maximum fee", value: "TZS 5,000" },
                { label: "Charged to", value: "Contributor" },
                { label: "Collection receives", value: "Full contribution", highlight: true },
              ]}
              note="Powered by Snippe. Processed via M-Pesa and Airtel Money."
            />
            <FeeCard
              icon={<CreditCard className="size-5" />}
              title="Card Payments"
              comingSoon
              rows={[
                { label: "Service fee rate", value: "Coming soon" },
                { label: "Minimum fee", value: "—" },
                { label: "Maximum fee", value: "—" },
                { label: "Charged to", value: "—" },
                { label: "Collection receives", value: "—" },
              ]}
              note="Card payment support is planned for a future release."
            />
          </div>
        </section>

        {/* ── How fees work ── */}
        <section className="space-y-4">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-2xl font-extrabold text-[#071a0e]">Fees explained clearly</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard icon={<CheckCircle2 className="size-5" />} title="Collection owners pay nothing" accent="green">
              Creating and managing a collection on SarafuPay is completely free. There are no subscription fees, no listing fees, and no charges to the collection balance.
            </InfoCard>
            <InfoCard icon={<Info className="size-5" />} title="Contributors see the total before paying" accent="blue">
              The SarafuPay service fee is shown clearly on the payment page before any contributor confirms their payment. No surprises.
            </InfoCard>
            <InfoCard icon={<Wallet className="size-5" />} title="Collection balances are never reduced" accent="amber">
              Service fees are charged separately on top of contributions. Your collection balance reflects exactly what contributors intended to give — always.
            </InfoCard>
          </div>
        </section>

        {/* ── Contribution fee example ── */}
        <section>
          <SectionLabel>Example calculation</SectionLabel>
          <h2 className="text-2xl font-extrabold text-[#071a0e]">Contribution fee example</h2>
          <p className="mt-2 text-sm text-slate-500">Contributing TZS 10,000 to a mobile money collection:</p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
            <div className="divide-y divide-[#f5f2ed] px-6">
              <ExampleRow label="Contribution amount" value="TZS 10,000" note="Credited to the collection" />
              <ExampleRow label="SarafuPay service fee" value="+ TZS 300" note="3% of TZS 10,000 (minimum TZS 300 applies)" />
              <ExampleRow label="Total charged to contributor" value="TZS 10,300" highlight />
              <ExampleRow label="Collection receives" value="TZS 10,000" note="Full contribution, no deductions" />
            </div>
          </div>
        </section>

        {/* ── Withdrawal fees ── */}
        <section>
          <SectionLabel>Withdrawal fees</SectionLabel>
          <h2 className="text-2xl font-extrabold text-[#071a0e]">What collection owners pay to withdraw</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            When a collection owner requests a withdrawal of their collected balance, a flat withdrawal fee applies. This covers payout processing costs.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Withdrawal fee", value: "TZS 2,000", sub: "Flat fee per request", accent: "amber" },
              { label: "Minimum withdrawal", value: "TZS 10,000", sub: "Before fees", accent: "slate" },
              { label: "Processing method", value: "Mobile Money", sub: "M-Pesa · Airtel Money", accent: "green" },
            ].map(({ label, value, sub, accent }) => (
              <div
                key={label}
                className={cn(
                  "rounded-2xl border p-5",
                  accent === "amber" && "border-amber-200 bg-amber-50",
                  accent === "slate" && "border-[#e5e0d6] bg-slate-50",
                  accent === "green" && "border-emerald-200 bg-emerald-50",
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className={cn(
                  "mt-2 text-2xl font-extrabold",
                  accent === "amber" && "text-amber-700",
                  accent === "slate" && "text-[#071a0e]",
                  accent === "green" && "text-emerald-700",
                )}>{value}</p>
                <p className="mt-1 text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Withdrawal example */}
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-slate-600">Example: requesting TZS 100,000</p>
            <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
              <div className="divide-y divide-[#f5f2ed] px-6">
                <ExampleRow label="Requested amount" value="TZS 100,000" />
                <ExampleRow label="Withdrawal fee (flat)" value="− TZS 2,000" />
                <ExampleRow label="Payout cost (estimated)" value="− TZS 1,500" note="Provider payout cost" />
                <ExampleRow label="You receive" value="TZS 96,500" highlight />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Withdrawal requests are manually reviewed before payout. See{" "}
              <Link href="/withdrawal-policy" className="underline hover:text-slate-600">
                Withdrawal Policy
              </Link>{" "}
              for details.
            </p>
          </div>
        </section>

        {/* ── FAQ snippet ── */}
        <section>
          <SectionLabel>Common questions</SectionLabel>
          <h2 className="text-2xl font-extrabold text-[#071a0e]">Pricing FAQ</h2>
          <div className="mt-5 divide-y divide-[#e5e0d6] overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div key={q} className="flex gap-4 px-6 py-5">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-[#19A254]" />
                <div>
                  <p className="text-sm font-bold text-[#071a0e]">{q}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{a}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">
            More questions?{" "}
            <Link href="/faq" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              See the full FAQ
            </Link>
          </p>
        </section>

        {/* ── CTA ── */}
        <section className="overflow-hidden rounded-2xl bg-[#035034] px-8 py-10 text-center shadow-lg shadow-[#035034]/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C4A237]">Ready to start?</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">Create your first collection — free</h2>
          <p className="mt-2 text-sm text-white/70">
            No setup required. Your collection is live in under 2 minutes.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#C4A237] px-7 py-3 text-sm font-bold text-[#035034] shadow-md shadow-[#C4A237]/25 transition-all hover:bg-[#d4af45] hover:shadow-lg"
          >
            Create Your Collection
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  );
}
