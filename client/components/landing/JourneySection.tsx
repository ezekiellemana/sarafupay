"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Link2,
  QrCode,
  Share2,
  Users,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: "01",
    title: "Create",
    desc: "Set up your collection with a title, target, and contribution amount in under 2 minutes.",
    numBg: "bg-[#C4A237]",
    cardBg: "bg-amber-50/90 border-amber-200/50",
    titleColor: "text-[#C4A237]",
  },
  {
    num: "02",
    title: "Share",
    desc: "Copy your payment link and share it on WhatsApp, or display the QR code at your event.",
    numBg: "bg-[#035034]",
    cardBg: "bg-[#035034]/5 border-[#035034]/12",
    titleColor: "text-[#035034]",
  },
  {
    num: "03",
    title: "Collect",
    desc: "Contributors pay securely through Snippe — M-Pesa, card, or mobile money. Webhook-verified.",
    numBg: "bg-[#19A254]",
    cardBg: "bg-emerald-50/80 border-emerald-200/50",
    titleColor: "text-[#19A254]",
  },
  {
    num: "04",
    title: "Track",
    desc: "Watch contributions roll in on your dashboard. Download CSV, view receipts, see your progress.",
    numBg: "bg-[#035034]",
    cardBg: "bg-[#035034]/5 border-[#035034]/12",
    titleColor: "text-[#035034]",
  },
];

const useCases = [
  { emoji: "🎓", title: "School Contributions", desc: "Class fees, uniforms, trips" },
  { emoji: "🎉", title: "Harambee & Events", desc: "Weddings, celebrations, parties" },
  { emoji: "📚", title: "Final Year Projects", desc: "Group budgets, research costs" },
  { emoji: "⛪", title: "Church & Mosque", desc: "Offerings, building funds" },
  { emoji: "🆘", title: "Emergency Funds", desc: "Medical, disaster, urgent causes" },
  { emoji: "💼", title: "Chama / Business", desc: "Savings clubs, group investments" },
];

const chips = [
  { emoji: "🎓", label: "School Fees", desc: "Uniforms, trips & supplies" },
  { emoji: "🎉", label: "Harambee", desc: "Events & celebrations" },
  { emoji: "💒", label: "Weddings", desc: "Contributions & gifts" },
  { emoji: "⛪", label: "Church Funds", desc: "Offerings & building" },
  { emoji: "📚", label: "Final Year Projects", desc: "Group budgets & costs" },
  { emoji: "🆘", label: "Emergency Relief", desc: "Medical & urgent causes" },
  { emoji: "💼", label: "Chama Collections", desc: "Savings clubs & investments" },
  { emoji: "🎂", label: "Birthday Funds", desc: "Surprise contributions" },
  { emoji: "🏫", label: "School Events", desc: "Sports days & concerts" },
  { emoji: "🤝", label: "Community Projects", desc: "Boreholes & clean-up" },
  { emoji: "🏥", label: "Medical Support", desc: "Hospital bills & recovery" },
  { emoji: "🌍", label: "Diaspora Collections", desc: "Remote group giving" },
];

const mockPayments = [
  { initial: "S", name: "Sarah M.", amount: "25,000 TZS", done: true },
  { initial: "J", name: "James K.", amount: "10,000 TZS", done: true },
  { initial: "A", name: "Alice T.", amount: "Pending", done: false },
];

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: 0.08 }}
      className="flex justify-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
        className="relative"
      >
        {/* Ambient glow */}
        <div className="absolute -inset-10 rounded-[4rem] bg-[#035034]/14 blur-3xl" />

        {/* Phone frame */}
        <div className="relative w-[262px] overflow-hidden rounded-[3.2rem] bg-gradient-to-b from-slate-700 to-slate-900 p-[12px] shadow-[0_40px_100px_rgba(3,80,52,0.42)] sm:w-[290px]">
          {/* Side buttons */}
          <div className="absolute -left-[5px] top-24 h-8 w-[5px] rounded-l-full bg-slate-600" />
          <div className="absolute -left-[5px] top-36 h-12 w-[5px] rounded-l-full bg-slate-600" />
          <div className="absolute -right-[5px] top-28 h-10 w-[5px] rounded-r-full bg-slate-600" />

          {/* Screen */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2.6rem] bg-slate-50">

            {/* Shimmer sweep */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ["-100%", "220%"] }}
              transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.5 }}
            />

            {/* Status bar */}
            <div className="bg-[#035034] px-4 pb-0 pt-3.5">
              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span className="font-semibold">9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-end gap-px">
                    {[1, 2, 3, 4].map((b) => (
                      <div key={b} className="w-[3px] rounded-sm bg-white/70" style={{ height: b * 3 + 2 }} />
                    ))}
                  </div>
                  <div className="h-3 w-5 rounded-sm border border-white/50 p-px">
                    <div className="h-full w-3/4 rounded-[1px] bg-white/70" />
                  </div>
                </div>
              </div>
            </div>

            {/* App header */}
            <div className="bg-[#035034] px-4 pb-4 pt-2 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-[#C4A237] text-[10px] font-black text-[#035034]">S</span>
                  <span className="text-[13px] font-bold">SarafuPay</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-1.5 rounded-full bg-white/40" />
                  <div className="size-1.5 rounded-full bg-white/40" />
                  <div className="size-1.5 rounded-full bg-white/40" />
                </div>
              </div>
              <p className="mt-2 text-[11px] font-medium text-white/60">My Collections</p>
            </div>

            {/* Collection card */}
            <div className="mx-3 mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎓</span>
                  <div>
                    <p className="text-[13px] font-bold text-[#035034]">Harambee 2026</p>
                    <p className="text-[10px] text-slate-400">Final Year Project</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="px-3.5 py-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400">Collected</p>
                    <p className="text-base font-black text-[#035034]">312K <span className="text-[10px] font-medium text-slate-400">TZS</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Target</p>
                    <p className="text-[11px] font-semibold text-slate-600">500K TZS</p>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-[#C4A237]"
                    initial={{ width: 0 }}
                    whileInView={{ width: "62%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="size-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">24 contributors</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#C4A237]">62%</span>
                </div>
              </div>
            </div>

            {/* Recent payments */}
            <div className="mx-3 mt-3">
              <p className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent</p>
              <div className="flex flex-col gap-1.5">
                {mockPayments.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#035034]/10 text-[9px] font-bold text-[#035034]">
                        {p.initial}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#035034]">{p.amount}</span>
                      {p.done
                        ? <CheckCircle2 className="size-3 text-emerald-500" />
                        : <Clock3 className="size-3 text-amber-500" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mx-3 mb-5 mt-auto pt-3">
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#035034] py-2.5 text-[10px] font-bold text-white">
                  <Share2 className="size-3" /> Share
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-[10px] font-semibold text-[#035034]">
                  <QrCode className="size-3" /> QR Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating notification — lg+ only */}
        <motion.div
          className="absolute -right-4 top-14 hidden w-44 flex-col gap-1 rounded-2xl border border-white/90 bg-white/96 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl lg:flex"
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.7 }}
        >
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-4 text-emerald-600" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-800">Payment received</p>
              <p className="text-[11px] font-bold text-emerald-600">+25,000 TZS</p>
            </div>
          </div>
          <p className="mt-0.5 pl-9 text-[10px] text-slate-400">Sarah M. · just now</p>
        </motion.div>

        {/* Floating contributors — lg+ only */}
        <motion.div
          className="absolute -left-4 bottom-28 hidden items-center gap-2.5 rounded-2xl border border-white/90 bg-white/96 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl lg:flex"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.9 }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#035034]/10">
            <Users className="size-4 text-[#035034]" />
          </span>
          <div>
            <p className="text-[12px] font-bold text-[#035034]">24 contributors</p>
            <p className="text-[10px] text-slate-400">Active collection</p>
          </div>
        </motion.div>

        {/* Live badge */}
        <div className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3.5 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur-sm">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Live dashboard preview
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Chip Marquee ─────────────────────────────────────────────────────────────

function ChipMarquee() {
  const doubled = [...chips, ...chips];
  return (
    <div
      className="overflow-hidden py-2"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 38, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((chip, i) => (
          <div
            key={i}
            className="flex w-36 shrink-0 flex-col gap-1.5 rounded-2xl border border-white/80 bg-white/90 px-4 py-3.5 shadow-sm backdrop-blur-sm"
          >
            <span className="text-2xl leading-none">{chip.emoji}</span>
            <p className="text-sm font-bold text-[#035034]">{chip.label}</p>
            <p className="text-xs leading-tight text-slate-500">{chip.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

const stepVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const stepItemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

const caseVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const caseItemVariant = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32 } },
};

// ─── Section ─────────────────────────────────────────────────────────────────

export function JourneySection() {
  return (
    <section className="relative border-t border-white/70">
      {/* Dual scroll anchors */}
      <div id="how" className="absolute -top-4" aria-hidden="true" />

      {/* ── Steps ── */}
      <div className="bg-white/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="size-2 rounded-full bg-[#C4A237]" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4A237]">
                Built for every collection
              </p>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#035034] sm:text-4xl">
              Built for every collection journey
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              From creating your first payment link to tracking 200+ contributors — SarafuPay handles the whole journey.
            </p>
          </motion.div>

          {/* Step cards */}
          <motion.div
            variants={stepVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* Dashed connector — desktop only */}
            <div className="absolute left-[12.5%] right-[12.5%] top-[1.65rem] hidden border-t-2 border-dashed border-[#C4A237]/30 lg:block" />

            {steps.map(({ num, title, desc, numBg, cardBg, titleColor }) => (
              <motion.div
                key={num}
                variants={stepItemVariant}
                whileHover={{ y: -5 }}
                className={`relative rounded-3xl border p-6 shadow-lg shadow-slate-900/4 backdrop-blur transition-shadow hover:shadow-xl ${cardBg}`}
              >
                <div className={`relative z-10 flex size-12 items-center justify-center rounded-full ${numBg} text-sm font-black text-white shadow-md`}>
                  {num}
                </div>
                <h3 className={`mt-4 text-base font-bold ${titleColor}`}>{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Phone + Use cases ── */}
      <div id="uses" className="border-t border-white/70 bg-[#035034]/3 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* Phone mockup */}
            <PhoneMockup />

            {/* Use cases */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.38 }}
                className="mb-7"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#C4A237]" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4A237]">
                    Built for everyone
                  </p>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#035034] sm:text-3xl">
                  What will you collect for?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  SarafuPay works for any group, any cause, any size — in Tanzania and beyond.
                </p>
              </motion.div>

              {/* Mobile: compact list */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.38 }}
                className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:hidden"
              >
                <div className="divide-y divide-slate-100/80">
                  {useCases.map(({ emoji, title, desc }) => (
                    <div
                      key={title}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 active:bg-slate-50/80"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#035034]/6 text-xl">
                        {emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#035034]">{title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* sm+: card grid */}
              <motion.div
                variants={caseVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
              >
                {useCases.map(({ emoji, title, desc }) => (
                  <motion.div
                    key={title}
                    variants={caseItemVariant}
                    whileHover={{ y: -3 }}
                    className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-md shadow-slate-900/4 backdrop-blur transition-shadow hover:shadow-lg"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#035034]/6 text-xl">
                      {emoji}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#035034]">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Register CTA within section */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <a
                  href="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#035034] px-6 text-sm font-bold text-white shadow-lg shadow-[#035034]/25 transition-all hover:bg-[#024028] hover:shadow-xl"
                >
                  <Link2 className="size-4" />
                  Start collecting — free
                </a>
                <span className="text-xs text-slate-500">No credit card required</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chip marquee ── */}
      <div className="border-t border-white/70 bg-white/50 py-6 backdrop-blur-sm">
        <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Collections people run on SarafuPay
        </p>
        <ChipMarquee />
      </div>
    </section>
  );
}
