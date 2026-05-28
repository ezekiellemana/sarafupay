import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  Clock,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Refund Policy — SarafuPay",
  description:
    "SarafuPay's refund and dispute policy. Understand what happens with completed contributions, failed payments, duplicate transactions, and how to contact support for a review.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 2026";

const TOC = [
  { id: "introduction", label: "1. Introduction" },
  { id: "completed-contributions", label: "2. Completed Contributions" },
  { id: "failed-payments", label: "3. Failed Payments" },
  { id: "duplicate-payments", label: "4. Duplicate Payments" },
  { id: "fraudulent-activity", label: "5. Fraudulent Activity" },
  { id: "withdrawal-reversals", label: "6. Withdrawal Reversals" },
  { id: "eligibility", label: "7. Refund Eligibility" },
  { id: "how-to-request", label: "8. How to Request a Review" },
  { id: "timelines", label: "9. Processing Timelines" },
  { id: "third-party", label: "10. Third-Party Processor" },
];

function TOCSidebar({ items }: { items: { id: string; label: string }[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 rounded-2xl border border-[#e5e0d6] bg-white p-5 shadow-sm shadow-[#0a1f12]/4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Contents</p>
        <nav className="space-y-0.5">
          {items.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="block rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#035034]"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-[#e5e0d6] bg-white p-6 shadow-sm shadow-[#0a1f12]/4">
      <div className="flex items-center gap-3 pb-4 border-b border-[#f5f2ed]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#071a0e]/5 text-[#071a0e]">
          {icon}
        </span>
        <h2 className="text-base font-bold text-[#071a0e]">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Callout({ variant, children }: { variant: "warning" | "info" | "success"; children: React.ReactNode }) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info:    "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[variant];
  const Icon = variant === "warning" ? AlertTriangle : variant === "success" ? CheckCircle2 : HelpCircle;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", styles)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: "green" | "red" | "slate" }) {
  const dotColor = { green: "bg-emerald-400", red: "bg-red-400", slate: "bg-slate-300" }[accent];
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", dotColor)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50/60">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <RefreshCw className="size-3.5" />
            Legal Document
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Refund Policy
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Clear, honest terms for payments, disputes, and failed transactions on SarafuPay.
          </p>
          <p className="mt-6 text-sm text-white/55">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          <TOCSidebar items={TOC} />

          <div className="min-w-0 space-y-5">

            <Section id="introduction" icon={<ShieldCheck className="size-5" />} title="1. Introduction">
              <p>
                SarafuPay is a payment collection platform. All payments made through SarafuPay are processed by{" "}
                <strong className="text-slate-700">Snippe</strong>, a third-party payment gateway. SarafuPay receives
                payment outcomes from Snippe via verified webhooks and records them for your dashboard.
              </p>
              <p>
                This Refund Policy explains how SarafuPay handles requests related to completed contributions, failed
                transactions, duplicate payments, and suspected fraud. Please read it carefully before making or accepting payments.
              </p>
            </Section>

            <Section id="completed-contributions" icon={<Ban className="size-5" />} title="2. Completed Contributions">
              <p>
                Contributions made to SarafuPay collections are <strong className="text-slate-700">generally non-refundable</strong> once
                the payment has been confirmed as completed by Snippe.
              </p>
              <Callout variant="warning">
                Collection owners are responsible for honouring the stated purpose of their collection. If you contributed to a collection and believe funds were misused, contact us and we will review the case.
              </Callout>
              <p>
                This policy exists because:
              </p>
              <BulletList accent="slate" items={[
                "Completed contributions are credited to the collection balance immediately.",
                "Collection owners may begin withdrawing available funds.",
                "Reversing completed contributions after payout is not technically possible on a per-transaction basis.",
              ]} />
              <p>
                SarafuPay may, at its sole discretion, assist in cases where a contribution was made in clear error or as a result of fraud.
              </p>
            </Section>

            <Section id="failed-payments" icon={<AlertTriangle className="size-5" />} title="3. Failed Payments">
              <p>
                If a payment is marked as <strong className="text-slate-700">failed</strong>, <strong className="text-slate-700">expired</strong>, or{" "}
                <strong className="text-slate-700">cancelled</strong> by Snippe, no funds are collected and no charge is applied.
              </p>
              <Callout variant="success">
                You are not charged for failed, expired, or cancelled payments. No refund is necessary because no money was taken.
              </Callout>
              <p>
                If you believe a payment failed but funds were still deducted from your mobile money account, please contact your mobile money provider first — Snippe handles all payment processing and charge reversals.
              </p>
            </Section>

            <Section id="duplicate-payments" icon={<ArrowLeftRight className="size-5" />} title="4. Duplicate Payments">
              <p>
                If you accidentally made two payments for the same contribution:
              </p>
              <BulletList accent="green" items={[
                "Contact us at support@sarafupay.app with your payment reference numbers.",
                "We will verify both payments in our system.",
                "Duplicate payment reviews are handled case-by-case.",
                "Resolution may require coordination with Snippe depending on payment status.",
              ]} />
              <p>
                Please do not attempt multiple payment retries for the same contribution without checking your payment status first. The payment return page shows the current status of your most recent transaction.
              </p>
            </Section>

            <Section id="fraudulent-activity" icon={<ShieldAlert className="size-5" />} title="5. Fraudulent Activity">
              <p>
                SarafuPay takes fraud seriously. If you believe a collection on our platform is fraudulent or misleading:
              </p>
              <BulletList accent="red" items={[
                "Contact us immediately at support@sarafupay.app.",
                "Provide the collection link and a description of your concern.",
                "We will investigate and may suspend the collection and associated account.",
                "In serious cases, we will escalate to relevant authorities.",
              ]} />
              <Callout variant="warning">
                SarafuPay reserves the right to suspend or permanently terminate accounts involved in fraudulent activity, without prior notice. We may withhold any balance pending investigation.
              </Callout>
              <p>
                Contributors to a collection that is found to be fraudulent may be eligible for a case-by-case review, but refunds cannot be guaranteed once funds have been disbursed.
              </p>
            </Section>

            <Section id="withdrawal-reversals" icon={<RefreshCw className="size-5" />} title="6. Withdrawal Reversals">
              <p>
                Withdrawal requests that have been approved or are being processed cannot be reversed after payout has been initiated.
              </p>
              <p>
                If a withdrawal is marked as <strong className="text-slate-700">failed</strong> after initiation, the deducted amount is reviewed by our team. Where possible, the balance may be reinstated — contact us at support@sarafupay.app with your withdrawal reference.
              </p>
              <p>
                Withdrawals marked as <strong className="text-slate-700">rejected</strong> before payout is initiated return the full balance to your available withdrawal balance immediately.
              </p>
            </Section>

            <Section id="eligibility" icon={<CheckCircle2 className="size-5" />} title="7. Refund Eligibility">
              <p>A review or refund request may be considered eligible in the following cases:</p>
              <BulletList accent="green" items={[
                "Duplicate payment confirmed by SarafuPay and Snippe.",
                "Payment made to a collection that SarafuPay has suspended for fraud.",
                "Technical error caused an incorrect charge (verified by our team).",
                "Payment deducted from your mobile account but confirmed as failed in our system.",
              ]} />
              <p>The following are generally <strong className="text-slate-700">not eligible</strong> for a refund:</p>
              <BulletList accent="red" items={[
                "Change of mind after a contribution is completed.",
                "Disputes with a collection owner about how funds will be used.",
                "Payments where the contributor did not read the collection description.",
                "Delays in withdrawal processing (these are not refunds — the funds remain in your balance).",
              ]} />
            </Section>

            <Section id="how-to-request" icon={<HelpCircle className="size-5" />} title="8. How to Request a Review">
              <p>To request a review of a payment or raise a dispute:</p>
              <BulletList accent="green" items={[
                "Email support@sarafupay.app with the subject: \"Payment Review Request\".",
                "Include your full name, the collection name or link, and your payment reference number.",
                "Describe the issue clearly and attach any relevant screenshots.",
                "We will acknowledge your request within 2 business days.",
              ]} />
              <p>
                For urgent fraud reports, mark your email subject as: <strong className="text-slate-700">URGENT: Fraud Report</strong>.
              </p>
            </Section>

            <Section id="timelines" icon={<Clock className="size-5" />} title="9. Processing Timelines">
              <div className="divide-y divide-[#f5f2ed] overflow-hidden rounded-xl border border-[#e5e0d6]">
                {[
                  { item: "Initial acknowledgement", time: "Within 2 business days" },
                  { item: "Duplicate payment review", time: "3–5 business days" },
                  { item: "Fraud investigation", time: "5–10 business days" },
                  { item: "Failed withdrawal review", time: "2–5 business days" },
                ].map(({ item, time }) => (
                  <div key={item} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-slate-600">{item}</p>
                    <p className="text-sm font-semibold text-[#071a0e]">{time}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Timelines are estimates and may vary depending on case complexity and third-party response times.
              </p>
            </Section>

            <Section id="third-party" icon={<ShieldCheck className="size-5" />} title="10. Third-Party Processor Disclaimer">
              <p>
                All payment processing on SarafuPay is handled by <strong className="text-slate-700">Snippe</strong>. SarafuPay does not process, hold, or settle payments — Snippe does.
              </p>
              <p>
                For payment-related technical issues, charge reversals, or mobile money disputes, you may need to contact Snippe directly. SarafuPay can provide your payment reference number to assist with Snippe inquiries.
              </p>
              <Callout variant="info">
                SarafuPay is not responsible for delays, failures, or errors that occur within the Snippe payment processing system. These are governed by Snippe&apos;s own terms and policies.
              </Callout>
              <p>
                Questions? Contact us at{" "}
                <a href="mailto:support@sarafupay.app" className="font-medium text-[#035034] underline-offset-2 hover:underline">
                  support@sarafupay.app
                </a>{" "}
                or visit our{" "}
                <Link href="/contact" className="font-medium text-[#035034] underline-offset-2 hover:underline">
                  Contact page
                </Link>.
              </p>
            </Section>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
