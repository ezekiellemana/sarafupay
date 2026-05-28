import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  HelpCircle,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ — SarafuPay",
  description:
    "Frequently asked questions about SarafuPay — how collections work, contribution fees, withdrawal fees, payment methods, security, and how to contact support.",
  robots: { index: true, follow: true },
};

type FAQItem = { q: string; a: React.ReactNode };

type FAQGroup = {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  items: FAQItem[];
};

const FAQ_GROUPS: FAQGroup[] = [
  {
    id: "general",
    icon: <HelpCircle className="size-5" />,
    label: "General",
    color: "bg-blue-100 text-blue-700",
    items: [
      {
        q: "What is SarafuPay?",
        a: "SarafuPay is a payment collection platform built for Tanzania. It lets individuals and groups create shared collection pages — for monthly contributions, events, weddings, school fees, emergencies, and more — and accept payments via a simple shareable link.",
      },
      {
        q: "How do collection links work?",
        a: "When you create a collection, SarafuPay generates a unique public link (e.g. sarafupay.app/pay/your-collection-name). Anyone with that link can open the payment page and contribute using mobile money. No account is required from contributors.",
      },
      {
        q: "Is SarafuPay free to use?",
        a: "Creating and managing a collection is completely free. SarafuPay charges a small service fee (3% for mobile money) to contributors at the time of payment — not to collection owners. There are no subscription fees, setup fees, or monthly charges.",
      },
    ],
  },
  {
    id: "fees",
    icon: <BadgePercent className="size-5" />,
    label: "Fees & Pricing",
    color: "bg-amber-100 text-amber-700",
    items: [
      {
        q: "How much are contribution fees?",
        a: (
          <>
            For mobile money payments, SarafuPay charges a <strong>3% service fee</strong>, with a minimum of{" "}
            <strong>TZS 300</strong> and a maximum of <strong>TZS 5,000</strong> per transaction. The fee is charged
            to the contributor on top of their contribution — the collection always receives the full amount intended.
            See the{" "}
            <Link href="/pricing" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              Pricing page
            </Link>{" "}
            for full details and examples.
          </>
        ),
      },
      {
        q: "Are fees deducted from the collection balance?",
        a: "No. Service fees are charged separately to the contributor on top of the contribution amount. Your collection balance always reflects the full amount contributors intended to give — it is never reduced by service fees.",
      },
      {
        q: "How much are withdrawal fees?",
        a: (
          <>
            There is a flat <strong>TZS 2,000 withdrawal fee</strong> per request, plus an estimated provider payout
            cost of approximately TZS 1,500. For example, requesting TZS 100,000 would result in TZS 96,500 sent to
            your mobile money account. See the{" "}
            <Link href="/withdrawal-policy" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              Withdrawal Policy
            </Link>{" "}
            for the full breakdown.
          </>
        ),
      },
      {
        q: "Are card payments supported?",
        a: "Card payments are coming in a future release. Currently, SarafuPay supports mobile money payments only (M-Pesa and Airtel Money via Snippe).",
      },
    ],
  },
  {
    id: "withdrawals",
    icon: <Wallet className="size-5" />,
    label: "Withdrawals",
    color: "bg-emerald-100 text-emerald-700",
    items: [
      {
        q: "How do withdrawals work?",
        a: "As a collection owner, you can request a withdrawal of your available balance directly from your collection dashboard. You provide your mobile money number, confirm the amount, and submit the request. Our team manually reviews every withdrawal before initiating the payout.",
      },
      {
        q: "What is the minimum withdrawal amount?",
        a: "The minimum withdrawal amount is TZS 10,000. This is the amount you request before fees are deducted.",
      },
      {
        q: "How long do withdrawals take?",
        a: "Withdrawal requests are manually reviewed. Most requests progress through review within 1–2 business days. After approval, payout is typically initiated the same day or next business day. The total end-to-end timeline is usually 1–3 business days.",
      },
      {
        q: "Can I cancel a withdrawal?",
        a: "Yes — you can cancel a withdrawal while it is still in Pending status, from your collection dashboard. Once a withdrawal has been Approved, it can no longer be cancelled through the dashboard. Contact support immediately at support@sarafupay.app if you need to cancel an approved withdrawal.",
      },
    ],
  },
  {
    id: "payments",
    icon: <Smartphone className="size-5" />,
    label: "Payments",
    color: "bg-violet-100 text-violet-700",
    items: [
      {
        q: "What payment methods are supported?",
        a: "SarafuPay currently supports mobile money payments via M-Pesa and Airtel Money (Tanzania), processed by Snippe. Card payment support is planned for a future release.",
      },
      {
        q: "What happens if a payment fails?",
        a: "If a payment is marked as failed, expired, or cancelled by our payment processor, no funds are collected and no charge is applied. You can simply retry the payment. If you believe funds were deducted from your mobile account but the payment shows as failed, contact your mobile money provider — they handle all payment charges.",
      },
      {
        q: "Can I get a refund on a contribution I made?",
        a: (
          <>
            Completed contributions are generally non-refundable. If you believe a payment was made in error or to a
            fraudulent collection, contact us at{" "}
            <a href="mailto:support@sarafupay.app" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              support@sarafupay.app
            </a>{" "}
            and we will review the case. See our{" "}
            <Link href="/refund-policy" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              Refund Policy
            </Link>{" "}
            for full details.
          </>
        ),
      },
    ],
  },
  {
    id: "security",
    icon: <Lock className="size-5" />,
    label: "Security & Privacy",
    color: "bg-slate-100 text-slate-600",
    items: [
      {
        q: "Is my money secure?",
        a: "All payments are processed by Snippe, a regulated payment gateway. SarafuPay never stores your M-Pesa PIN, card numbers, or any payment credentials. We store only the payment outcome and reference number provided by Snippe after processing.",
      },
      {
        q: "Who can see my collection's contributor details?",
        a: "Contributor names are shown publicly on the collection page (truncated to first name and initial, e.g. \"John S.\") only if you enable that setting. Phone numbers and email addresses of contributors are never shown publicly.",
      },
      {
        q: "Can SarafuPay see my mobile money PIN or account password?",
        a: "No. Mobile money payments are handled entirely by Snippe. SarafuPay receives only the payment result (success or failure) — not your PIN, credentials, or account details.",
      },
    ],
  },
  {
    id: "support",
    icon: <Mail className="size-5" />,
    label: "Support",
    color: "bg-rose-100 text-rose-700",
    items: [
      {
        q: "How do I contact support?",
        a: (
          <>
            Email us at{" "}
            <a href="mailto:support@sarafupay.app" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              support@sarafupay.app
            </a>
            . Include your name, the collection name or link, and your payment or withdrawal reference number if relevant.
            We typically respond within 2 business days.
          </>
        ),
      },
      {
        q: "What is SarafuPay's support email?",
        a: (
          <>
            Our support email is{" "}
            <a href="mailto:support@sarafupay.app" className="font-medium text-[#035034] underline-offset-2 hover:underline">
              support@sarafupay.app
            </a>
            . We read every message personally.
          </>
        ),
      },
    ],
  },
];

function FAQGroupSection({ group }: { group: FAQGroup }) {
  return (
    <section id={group.id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <span className={cn("flex size-9 items-center justify-center rounded-xl", group.color)}>
          {group.icon}
        </span>
        <h2 className="text-lg font-extrabold text-[#071a0e]">{group.label}</h2>
      </div>
      <div className="divide-y divide-[#e5e0d6] overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
        {group.items.map(({ q, a }) => (
          <div key={q} className="px-6 py-5">
            <p className="font-bold text-[#071a0e]">{q}</p>
            <div className="mt-2 text-sm leading-relaxed text-slate-500">{a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-slate-50/60">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <HelpCircle className="size-3.5" />
            Help centre
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Answers to the most common questions about SarafuPay — fees, withdrawals, payments, and security.
          </p>

          {/* Group jump links */}
          <div className="mt-7 flex flex-wrap gap-2">
            {FAQ_GROUPS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ body ── */}
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-14">
        {FAQ_GROUPS.map((group) => (
          <FAQGroupSection key={group.id} group={group} />
        ))}

        {/* ── Still have questions ── */}
        <section className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
          <div className="px-6 py-6 text-center">
            <ShieldCheck className="mx-auto size-8 text-[#19A254]" />
            <h2 className="mt-3 text-lg font-extrabold text-[#071a0e]">Still have a question?</h2>
            <p className="mt-1 text-sm text-slate-500">
              If you didn&apos;t find your answer above, our support team is happy to help.
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="mailto:support@sarafupay.app"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#035034] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#035034]/20 transition-all hover:bg-[#024028]"
              >
                <Mail className="size-4" />
                Email support
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#e5e0d6] bg-white px-6 py-2.5 text-sm font-semibold text-[#071a0e] shadow-sm transition-all hover:border-[#C4A237]/40 hover:shadow-md"
              >
                Contact page
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
