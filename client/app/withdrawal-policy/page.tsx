import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  Ban,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Withdrawal Policy — SarafuPay",
  description:
    "SarafuPay withdrawal policy. Learn about eligibility, the TZS 2,000 withdrawal fee, TZS 10,000 minimum, manual review process, payout timelines, and supported methods.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 2026";

const TOC = [
  { id: "eligibility", label: "1. Withdrawal Eligibility" },
  { id: "minimum", label: "2. Minimum Withdrawal Amount" },
  { id: "fee", label: "3. Withdrawal Fee" },
  { id: "review", label: "4. Manual Review & Approval" },
  { id: "timelines", label: "5. Processing Timelines" },
  { id: "methods", label: "6. Supported Payout Methods" },
  { id: "failed", label: "7. Failed Withdrawals" },
  { id: "details", label: "8. Recipient Details Responsibility" },
  { id: "risk", label: "9. Fraud & Risk Review" },
  { id: "pending", label: "10. Pending & Processing States" },
  { id: "support", label: "11. Support" },
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
      <div className="flex items-center gap-3 border-b border-[#f5f2ed] pb-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#071a0e]/5 text-[#071a0e]">
          {icon}
        </span>
        <h2 className="text-base font-bold text-[#071a0e]">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Callout({ variant, children }: { variant: "warning" | "info" | "success" | "red"; children: React.ReactNode }) {
  const styles = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info:    "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red:     "border-red-200 bg-red-50 text-red-800",
  }[variant];
  const Icon = variant === "warning" ? AlertTriangle : variant === "success" ? CheckCircle2 : variant === "red" ? Ban : Info;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", styles)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: "green" | "red" | "slate" | "amber" }) {
  const dotColor = {
    green: "bg-emerald-400",
    red:   "bg-red-400",
    slate: "bg-slate-300",
    amber: "bg-amber-400",
  }[accent];
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

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: "amber" | "slate" | "green" }) {
  return (
    <div className={cn(
      "rounded-2xl border p-4 text-center",
      accent === "amber" && "border-amber-200 bg-amber-50",
      accent === "slate" && "border-[#e5e0d6] bg-slate-50",
      accent === "green" && "border-emerald-200 bg-emerald-50",
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={cn(
        "mt-2 text-2xl font-extrabold",
        accent === "amber" && "text-amber-700",
        accent === "slate" && "text-[#071a0e]",
        accent === "green" && "text-emerald-700",
      )}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function WithdrawalPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50/60">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <ArrowDownToLine className="size-3.5" />
            Legal Document
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Withdrawal Policy
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Everything collection owners need to know about withdrawing their collected balance from SarafuPay.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:max-w-lg">
            {[
              { label: "Withdrawal fee", value: "TZS 2,000" },
              { label: "Minimum withdrawal", value: "TZS 10,000" },
              { label: "Processing", value: "Manual review" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">{label}</p>
                <p className="mt-1 text-sm font-extrabold text-white">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/55">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          <TOCSidebar items={TOC} />

          <div className="min-w-0 space-y-5">

            <Section id="eligibility" icon={<CheckCircle2 className="size-5" />} title="1. Withdrawal Eligibility">
              <p>
                Withdrawals are available to collection owners who have an available balance in a collection they own.
                To be eligible for a withdrawal:
              </p>
              <BulletList accent="green" items={[
                "You must be the verified owner of the collection.",
                "Your available balance must be at least TZS 10,000 (the minimum withdrawal amount).",
                "You must have no other pending, approved, or processing withdrawal request for the same collection at the same time.",
                "Your account must be active and in good standing.",
              ]} />
              <p>
                Available balance is calculated as: completed contributions minus any locked (pending/approved/processing) withdrawals
                minus any already paid withdrawals.
              </p>
            </Section>

            <Section id="minimum" icon={<Info className="size-5" />} title="2. Minimum Withdrawal Amount">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Minimum withdrawal" value="TZS 10,000" sub="Before fees" accent="slate" />
                <StatCard label="Withdrawal fee" value="TZS 2,000" sub="Deducted from balance" accent="amber" />
                <StatCard label="Minimum you receive" value="TZS 8,500" sub="After fee + payout cost" accent="green" />
              </div>
              <p className="mt-2">
                The minimum withdrawal amount is <strong className="text-slate-700">TZS 10,000</strong>. This is the
                amount you request — the withdrawal fee and payout processing cost are deducted before funds are sent to you.
              </p>
              <Callout variant="info">
                To withdraw TZS 10,000 minimum, your available balance must be at least TZS 10,000. The withdrawal fee (TZS 2,000) and payout cost (est. TZS 1,500) are deducted from your balance — not from the amount you receive.
              </Callout>
            </Section>

            <Section id="fee" icon={<ArrowDownToLine className="size-5" />} title="3. Withdrawal Fee">
              <p>
                A flat <strong className="text-slate-700">withdrawal fee of TZS 2,000</strong> applies to every withdrawal request.
                This fee covers the cost of manually reviewing and processing your request, plus payout infrastructure costs.
              </p>

              <div className="overflow-hidden rounded-xl border border-[#e5e0d6]">
                <div className="border-b border-[#e5e0d6] px-4 py-2.5 bg-slate-50">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Example: requesting TZS 100,000</p>
                </div>
                <div className="divide-y divide-[#f5f2ed]">
                  {[
                    { label: "Requested amount", value: "TZS 100,000" },
                    { label: "Withdrawal fee (flat)", value: "− TZS 2,000" },
                    { label: "Payout cost (estimated)", value: "− TZS 1,500" },
                    { label: "You receive", value: "TZS 96,500", bold: true },
                  ].map(({ label, value, bold }) => (
                    <div key={label} className={cn("flex items-center justify-between px-4 py-3", bold && "bg-emerald-50/60")}>
                      <p className="text-sm text-slate-600">{label}</p>
                      <p className={cn("text-sm", bold ? "font-extrabold text-[#035034]" : "font-semibold text-[#071a0e]")}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">
                The payout cost is an estimated provider fee that may vary slightly. The exact amount is shown in your withdrawal request before you submit.
              </p>
            </Section>

            <Section id="review" icon={<ShieldCheck className="size-5" />} title="4. Manual Review & Approval">
              <Callout variant="info">
                Withdrawal requests are manually reviewed by the SarafuPay team before any payout is initiated.
                This is a deliberate safeguard to protect collection owners and contributors.
              </Callout>
              <p>The withdrawal review process follows these stages:</p>
              <div className="space-y-2">
                {[
                  { status: "Pending", desc: "Your request has been received and is awaiting admin review." },
                  { status: "Approved", desc: "Your request has been approved. Payout will be initiated shortly." },
                  { status: "Processing", desc: "Payout is being initiated to your specified destination." },
                  { status: "Paid", desc: "Funds have been sent to your mobile money account or bank." },
                  { status: "Rejected", desc: "Your request was rejected. The reason will be shown in your dashboard." },
                  { status: "Failed", desc: "Payout was initiated but failed. Contact support with your reference." },
                ].map(({ status, desc }) => (
                  <div key={status} className="flex items-start gap-3 rounded-xl border border-[#e5e0d6] px-4 py-3">
                    <span className="mt-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                      {status}
                    </span>
                    <p className="text-sm text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="timelines" icon={<Clock className="size-5" />} title="5. Processing Timelines">
              <p>
                Withdrawal processing times are estimates and depend on review queue and payout provider availability.
              </p>
              <div className="overflow-hidden rounded-xl border border-[#e5e0d6]">
                <div className="divide-y divide-[#f5f2ed]">
                  {[
                    { stage: "Pending → Approved", time: "1–2 business days (typically)" },
                    { stage: "Approved → Processing", time: "Same day or next business day" },
                    { stage: "Processing → Paid", time: "A few minutes to 24 hours" },
                    { stage: "Total (estimate)", time: "1–3 business days", bold: true },
                  ].map(({ stage, time, bold }) => (
                    <div key={stage} className={cn("flex items-center justify-between px-4 py-3", bold && "bg-emerald-50/60")}>
                      <p className={cn("text-sm", bold ? "font-bold text-[#071a0e]" : "text-slate-600")}>{stage}</p>
                      <p className={cn("text-sm", bold ? "font-bold text-[#035034]" : "font-semibold text-[#071a0e]")}>{time}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Callout variant="warning">
                SarafuPay does not guarantee a specific payout timeline. Delays may occur due to review queue, public holidays, or payout provider issues. There is no automatic payout — every withdrawal requires manual review.
              </Callout>
            </Section>

            <Section id="methods" icon={<Smartphone className="size-5" />} title="6. Supported Payout Methods">
              <p>SarafuPay currently supports the following withdrawal destinations:</p>
              <BulletList accent="green" items={[
                "Mobile Money — M-Pesa (Tanzania)",
                "Mobile Money — Airtel Money (Tanzania)",
                "Bank transfer — coming in a future release",
              ]} />
              <p>
                You must provide your correct mobile money phone number or bank account details when submitting a withdrawal request.
                SarafuPay does not store payment credentials — destination details are used solely for processing your specific withdrawal.
              </p>
            </Section>

            <Section id="failed" icon={<AlertTriangle className="size-5" />} title="7. Failed Withdrawals">
              <p>
                A withdrawal may be marked as <strong className="text-slate-700">failed</strong> if the payout provider was unable to complete the transfer. Common reasons include:
              </p>
              <BulletList accent="amber" items={[
                "Incorrect or inactive mobile money number.",
                "Mobile money account limit exceeded.",
                "Temporary payout provider outage.",
                "Mismatch between recipient name and account.",
              ]} />
              <p>
                If your withdrawal fails:
              </p>
              <BulletList accent="green" items={[
                "Contact support at support@sarafupay.app with your withdrawal reference number.",
                "Our team will investigate and advise on next steps.",
                "Where possible, we will reinstate your balance or arrange a retry.",
              ]} />
            </Section>

            <Section id="details" icon={<Info className="size-5" />} title="8. Recipient Details Responsibility">
              <Callout variant="red">
                Providing incorrect recipient details (wrong phone number or bank account) may delay or permanently prevent payout. SarafuPay is not responsible for funds sent to an incorrect number or account provided by the collection owner.
              </Callout>
              <p>Before submitting a withdrawal request, please verify:</p>
              <BulletList accent="green" items={[
                "Your mobile money number is active and able to receive payments.",
                "The recipient name matches the account registered with your mobile money provider.",
                "For bank transfers: account number and bank name are correct.",
              ]} />
              <p>
                If you realise you provided incorrect details after submitting, contact us immediately at support@sarafupay.app. If payout has not yet been initiated, we may be able to cancel and update your request.
              </p>
            </Section>

            <Section id="risk" icon={<ShieldAlert className="size-5" />} title="9. Fraud & Risk Review">
              <p>
                SarafuPay may place a withdrawal request under extended review if our team identifies unusual activity, including:
              </p>
              <BulletList accent="amber" items={[
                "Sudden large withdrawal requests from newly active collections.",
                "Multiple withdrawal requests in rapid succession.",
                "Reports of fraudulent collection activity.",
                "Account flagged for suspicious activity.",
              ]} />
              <Callout variant="warning">
                SarafuPay may reject suspicious or fraudulent withdrawal requests without prior notice. Accounts involved in confirmed fraud may be suspended and balances may be withheld pending investigation.
              </Callout>
              <p>
                If your withdrawal is placed under risk review, we will contact you at the email registered to your account.
              </p>
            </Section>

            <Section id="pending" icon={<Clock className="size-5" />} title="10. Pending & Processing States">
              <p>
                While a withdrawal is in a <strong className="text-slate-700">pending</strong>, <strong className="text-slate-700">approved</strong>, or{" "}
                <strong className="text-slate-700">processing</strong> state, the requested amount is locked from your available balance.
                You cannot request another withdrawal for the same collection while one is already active.
              </p>
              <p>
                You may cancel a <strong className="text-slate-700">pending</strong> withdrawal from your dashboard at any time before it is approved.
                Once approved, a withdrawal cannot be cancelled.
              </p>
              <BulletList accent="slate" items={[
                "Pending: can be cancelled by you from your dashboard.",
                "Approved: cannot be cancelled — contact support immediately if needed.",
                "Processing: cannot be cancelled — payout is underway.",
                "Paid: final — funds have been sent.",
                "Rejected/Failed: balance is restored to your available withdrawal balance.",
              ]} />
            </Section>

            <Section id="support" icon={<HelpCircle className="size-5" />} title="11. Support">
              <p>For any questions about your withdrawal or this policy, contact us:</p>
              <div className="rounded-xl border border-[#e5e0d6] bg-slate-50 px-5 py-4">
                <p className="text-sm font-bold text-[#071a0e]">SarafuPay Support</p>
                <a href="mailto:support@sarafupay.app" className="mt-1 block text-sm font-medium text-[#035034] underline-offset-2 hover:underline">
                  support@sarafupay.app
                </a>
                <p className="mt-2 text-xs text-slate-400">We aim to respond within 2 business days.</p>
              </div>
              <p>
                You can also visit our{" "}
                <Link href="/faq" className="font-medium text-[#035034] underline-offset-2 hover:underline">FAQ page</Link>{" "}
                or our{" "}
                <Link href="/pricing" className="font-medium text-[#035034] underline-offset-2 hover:underline">Pricing page</Link>{" "}
                for more details on fees.
              </p>
            </Section>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
