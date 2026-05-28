import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Gift, GraduationCap, Handshake, Heart, PartyPopper, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { GradientButton } from "@/components/shared/GradientButton";

export const metadata: Metadata = {
  title: "About SarafuPay",
  description: "Learn what SarafuPay is, how it works, and the everyday use cases it was built for — from weddings and events to group savings and charity drives across Tanzania.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "About SarafuPay — Tanzania's Payment Collection Platform",
    description: "Learn what SarafuPay is, how it works, and the everyday use cases it was built for — from weddings and events to group savings and charity drives across Tanzania.",
  },
  twitter: {
    card: "summary_large_image",
    title: "About SarafuPay",
    description: "Learn what SarafuPay is and how it works for groups, events, and community projects in Tanzania.",
  },
};

const useCases = [
  { icon: PartyPopper, title: "Events & Celebrations",  description: "Collect contributions for birthday parties, graduation ceremonies, farewell parties, and cultural celebrations." },
  { icon: Heart,       title: "Weddings",               description: "Let guests contribute to the couple's wedding fund directly through a simple payment link — no cash envelopes needed." },
  { icon: Handshake,   title: "Charity & Fundraising",  description: "Run transparent charity drives. Donors see the goal and track progress. Every payment is recorded." },
  { icon: Users,       title: "Groups & Chamas",         description: "Manage monthly chama contributions, savings groups, or community funds with clear payment records for every member." },
  { icon: GraduationCap, title: "School & Class Funds", description: "Collect class trip fees, uniform funds, or school project contributions from parents without the paper trail." },
  { icon: Building2,   title: "Business Collections",   description: "Accept deposits, event fees, or service payments through a branded collection page — no payment terminal required." },
  { icon: Gift,        title: "Gift Collections",        description: "Pool money for a group gift. One link, everyone contributes, you track who has paid." },
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden">
      <FloatingBlobBackground />
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-20 text-center">
        <span className="inline-block rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
          About SarafuPay
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#0b1f3a] md:text-5xl">
          Lipa kwa urahisi.
          <span className="block mt-1 bg-linear-to-r from-[#16a34a] via-[#4ade80] to-[#f59e0b] bg-clip-text text-transparent">
            Pay with ease.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600">
          SarafuPay is a Tanzanian payment collection platform that lets anyone create a collection page and receive payments through a simple link. Whether you are organising a wedding, running a charity, or managing a savings group, SarafuPay gives you a clear, digital record of every contribution.
        </p>
      </section>

      {/* What we do */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/65 shadow-2xl shadow-slate-900/8 backdrop-blur-xl ring-1 ring-amber-200/20">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-white/50 p-8 md:border-b-0 md:border-r">
              <h2 className="text-xl font-bold text-[#0b1f3a]">How it works</h2>
              <ol className="mt-5 space-y-4">
                {[
                  "Create an account and set up your collection page in minutes.",
                  "Share your unique payment link with contributors — no app needed on their side.",
                  "Contributors pay securely through Snippe using M-Pesa or card.",
                  "Track all payments in your dashboard. Export records any time.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="p-8">
              <h2 className="text-xl font-bold text-[#0b1f3a]">Powered by Snippe</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                All payments are processed securely by{" "}
                <span className="font-semibold text-[#0b1f3a]">Snippe</span>, a licensed payment gateway. SarafuPay does not store any card details. When a contributor pays, they are taken to a Snippe-hosted checkout where payment is completed and verified.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                SarafuPay records the outcome — completed, pending, or failed — and updates your dashboard automatically. The money goes directly to your account through Snippe&apos;s payout process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-10 text-center text-2xl font-bold text-[#0b1f3a]">Built for everyday collections</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/70 bg-white/60 p-6 shadow-md shadow-slate-900/5 backdrop-blur-sm transition-shadow hover:shadow-lg"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200/60">
                <Icon className="size-5 text-emerald-600" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-[#0b1f3a]">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#071a0e] p-8 text-white shadow-2xl md:p-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 size-48 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-white/60">SarafuPay — Lipa kwa urahisi.</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Ready to start collecting?
              </h2>
              <p className="mt-2 text-sm text-white/60">Create your first collection page in under two minutes.</p>
            </div>
            <Link href="/register">
              <GradientButton btnVariant="gold">Create Account</GradientButton>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
