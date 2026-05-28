import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  HelpCircle,
  Mail,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact Support — SarafuPay",
  description:
    "Get in touch with the SarafuPay support team. Email us at support@sarafupay.app. We typically respond within 2 business days.",
  robots: { index: true, follow: true },
};

function ContactCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#e5e0d6] bg-white p-6 shadow-sm shadow-[#0a1f12]/4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#071a0e]/5 text-[#071a0e]">
        {icon}
      </span>
      <div>
        <p className="font-bold text-[#071a0e]">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-slate-500">{children}</div>
      </div>
    </div>
  );
}

const QUICK_TOPICS = [
  {
    label: "Payment issue",
    subject: "Payment Issue",
    hint: "Failed, pending, or duplicate payment",
  },
  {
    label: "Withdrawal question",
    subject: "Withdrawal Question",
    hint: "Status, processing times, or failed withdrawal",
  },
  {
    label: "Account access",
    subject: "Account Access",
    hint: "Login trouble or account suspended",
  },
  {
    label: "Report fraud",
    subject: "URGENT: Fraud Report",
    hint: "Suspicious collection or fraudulent activity",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <Mail className="size-3.5" />
            Get in touch
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            We&apos;re here to help
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Have a question about your collection, a payment, or a withdrawal? Send us an email and we&apos;ll get back to you promptly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-14">

        {/* ── Primary contact ── */}
        <section>
          <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
            <div className="flex flex-col items-center gap-5 px-8 py-10 text-center sm:flex-row sm:text-left">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#035034]/8 text-[#035034]">
                <Mail className="size-8" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Email support</p>
                <a
                  href="mailto:support@sarafupay.app"
                  className="mt-1 block text-2xl font-extrabold text-[#071a0e] underline-offset-4 hover:underline sm:text-3xl"
                >
                  support@sarafupay.app
                </a>
                <p className="mt-2 text-sm text-slate-500">
                  The best way to reach us. We read every message.
                </p>
              </div>
            </div>
            <div className="border-t border-[#e5e0d6] bg-slate-50/60 px-8 py-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#19A254]" />
                  Response time: within 2 business days
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#19A254]" />
                  Urgent fraud reports addressed within 24 hours
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick topics ── */}
        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#19A254]">
            Common support topics
          </p>
          <h2 className="text-xl font-extrabold text-[#071a0e]">What do you need help with?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Click any topic to start an email with the right subject line pre-filled.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {QUICK_TOPICS.map(({ label, subject, hint }) => (
              <a
                key={label}
                href={`mailto:support@sarafupay.app?subject=${encodeURIComponent(subject)}`}
                className="flex items-start gap-3 rounded-2xl border border-[#e5e0d6] bg-white p-4 shadow-sm shadow-[#0a1f12]/4 transition-all hover:border-[#C4A237]/40 hover:shadow-md"
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-[#19A254]" />
                <div>
                  <p className="text-sm font-bold text-[#071a0e]">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── What to include ── */}
        <section>
          <ContactCard icon={<MessageSquare className="size-5" />} title="What to include in your message">
            <ul className="mt-2 space-y-1.5">
              {[
                "Your full name and email address registered on SarafuPay",
                "The collection name or link (if relevant)",
                "Your payment or withdrawal reference number",
                "A clear description of the issue",
                "Screenshots if helpful",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#19A254]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ContactCard>
        </section>

        {/* ── WhatsApp coming soon ── */}
        <section>
          <div className="rounded-2xl border border-[#e5e0d6] bg-slate-50/60 px-6 py-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-5 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-500">WhatsApp support</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  WhatsApp support is coming soon. For now, please use email — we&apos;re just as responsive.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ CTA ── */}
        <section className="rounded-2xl border border-[#e5e0d6] bg-white p-6 shadow-sm shadow-[#0a1f12]/4 text-center">
          <HelpCircle className="mx-auto size-8 text-[#19A254]" />
          <h2 className="mt-3 text-lg font-extrabold text-[#071a0e]">Check the FAQ first</h2>
          <p className="mt-1 text-sm text-slate-500">
            Many common questions about fees, withdrawals, and payments are answered in our FAQ.
          </p>
          <Link
            href="/faq"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#e5e0d6] bg-white px-5 py-2.5 text-sm font-semibold text-[#071a0e] shadow-sm transition-all hover:border-[#C4A237]/40 hover:shadow-md"
          >
            Browse the FAQ
          </Link>
        </section>

      </div>

      <Footer />
    </main>
  );
}
