"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LockKeyhole, Share2, TrendingUp, Users } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";

const recentContribs = [
  { name: "Sarah M.", amount: "10,000 TZS", initial: "S" },
  { name: "James K.", amount: "5,000 TZS", initial: "J" },
  { name: "Alice T.", amount: "10,000 TZS", initial: "A" },
];

export function HeroSection() {
  return (
    <section className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">

      {/* ── Left: copy ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-7 text-center md:text-left"
      >
        {/* Eyebrow badge */}
        <div className="flex justify-center md:justify-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C4A237]/40 bg-amber-50/90 px-4 py-1.5 text-xs font-semibold text-amber-700 backdrop-blur-sm">
            <TrendingUp className="size-3.5 text-[#C4A237]" />
            Tanzania&apos;s group payment platform
          </span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-3">
          <h1 className="text-[2.6rem] font-black leading-[1.05] tracking-tight text-[#035034] sm:text-5xl md:text-6xl lg:text-[4rem]">
            Collect money for any group, event, or project.
          </h1>
          <p className="mx-auto max-w-lg text-base leading-7 text-slate-600 md:mx-0 md:text-lg md:leading-8">
            Create a payment link in seconds. Share it with your group. Receive payments and track every contributor from one clean dashboard.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
          <Link href="/register" className="block w-full sm:w-auto">
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#035034] px-7 text-sm font-bold text-white shadow-lg shadow-[#035034]/25 transition-all hover:bg-[#024028] hover:shadow-xl sm:w-auto">
              Create Collection
              <ArrowRight className="size-4" />
            </button>
          </Link>
          <Link href="#how" className="block w-full sm:w-auto">
            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-7 text-sm font-semibold text-[#035034] shadow-sm backdrop-blur-sm transition-all hover:border-[#035034]/30 hover:bg-white sm:w-auto">
              See How It Works
            </button>
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-3 md:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 backdrop-blur-sm">
            <LockKeyhole className="size-3.5 text-[#19A254]" />
            Secure Snippe checkout
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 backdrop-blur-sm">
            <CheckCircle2 className="size-3.5 text-[#19A254]" />
            Webhook-verified payments
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 backdrop-blur-sm">
            <Share2 className="size-3.5 text-[#C4A237]" />
            Free to start
          </span>
        </div>
      </motion.div>

      {/* ── Right: collection preview card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="relative"
      >
        {/* Glow behind card */}
        <div className="absolute -inset-4 rounded-[2.5rem] bg-[#035034]/8 blur-2xl" />

        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">

          {/* Card header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#035034]/8 text-xl">🎓</span>
              <div>
                <p className="text-sm font-bold text-[#035034]">Harambee 2026</p>
                <p className="text-xs font-medium text-slate-500">Final Year Project Fundraiser</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Active
            </span>
          </div>

          {/* Progress */}
          <div className="px-5 py-4">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Collected</p>
                <p className="text-2xl font-extrabold tracking-tight text-[#035034]">312,000 <span className="text-sm font-semibold text-slate-400">TZS</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Target</p>
                <p className="text-sm font-semibold text-slate-600">500,000 TZS</p>
              </div>
            </div>
            <AnimatedProgressBar value={62} variant="gold" />
            <p className="mt-1.5 text-right text-xs font-semibold text-[#C4A237]">62% of target</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 px-5 pb-4">
            <div className="rounded-2xl bg-[#035034]/6 px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Users className="size-3.5" />
                Contributors
              </div>
              <p className="mt-1 text-xl font-extrabold text-[#035034]">24</p>
            </div>
            <div className="rounded-2xl bg-amber-50/80 px-4 py-3">
              <p className="text-xs font-medium text-slate-600">Avg. contribution</p>
              <p className="mt-1 text-xl font-extrabold text-[#C4A237]">13,000 <span className="text-xs font-medium text-slate-400">TZS</span></p>
            </div>
          </div>

          {/* Recent contributors */}
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Recent contributions</p>
            <div className="flex flex-col gap-2">
              {recentContribs.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#035034]/10 text-[10px] font-bold text-[#035034]">
                      {c.initial}
                    </span>
                    <span className="text-xs font-medium text-slate-700">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#035034]">{c.amount}</span>
                    <CheckCircle2 className="size-3.5 text-[#19A254]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share link */}
          <div className="border-t border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <Share2 className="size-3.5 shrink-0 text-[#C4A237]" />
              <span className="flex-1 truncate font-mono text-[12px] font-medium text-slate-600">sarafupay.com/pay/harambee-2026</span>
              <span className="shrink-0 rounded-lg bg-[#035034] px-2 py-0.5 text-[10px] font-bold text-white">Copy</span>
            </div>
          </div>

        </div>
      </motion.div>

    </section>
  );
}
