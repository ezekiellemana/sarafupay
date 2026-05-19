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
  "🎓 School Fees",
  "🎉 Harambee",
  "💒 Weddings",
  "⛪ Church Funds",
  "📚 Final Year Projects",
  "🆘 Emergency Relief",
  "💼 Chama Collections",
  "🎂 Birthday Funds",
  "🏫 School Events",
  "🤝 Community Projects",
  "🏥 Medical Support",
  "🌍 Diaspora Collections",
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
      className="flex justify-center lg:justify-end"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
        className="relative"
      >
        {/* Ambient glow */}
        <div className="absolute -inset-8 rounded-[4rem] bg-[#035034]/12 blur-3xl" />

        {/* Phone frame */}
        <div className="relative w-[232px] overflow-hidden rounded-[2.8rem] bg-gradient-to-b from-slate-700 to-slate-900 p-[9px] shadow-[0_30px_80px_rgba(3,80,52,0.38)] sm:w-[252px]">
          {/* Side buttons */}
          <div className="absolute -left-[3px] top-24 h-8 w-[3px] rounded-l-full bg-slate-600" />
          <div className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l-full bg-slate-600" />
          <div className="absolute -right-[3px] top-28 h-10 w-[3px] rounded-r-full bg-slate-600" />

          {/* Screen */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2.2rem] bg-slate-50">

            {/* Shimmer sweep */}
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ["-100%", "220%"] }}
              transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.5 }}
            />

            {/* Status bar */}
            <div className="bg-[#035034] px-4 pb-0 pt-3">
              <div className="flex items-center justify-between text-[9px] text-white/60">
                <span className="font-semibold">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-px">
                    {[1, 2, 3, 4].map((b) => (
                      <div key={b} className={`w-[3px] rounded-sm bg-white/70`} style={{ height: b * 2.5 + 2 }} />
                    ))}
                  </div>
                  <div className="h-2.5 w-4 rounded-sm border border-white/50 p-px">
                    <div className="h-full w-3/4 rounded-[1px] bg-white/70" />
                  </div>
                </div>
              </div>
            </div>

            {/* App header */}
            <div className="bg-[#035034] px-4 pb-3 pt-1.5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-[#C4A237] text-[9px] font-black text-[#035034]">S</span>
                  <span className="text-[11px] font-bold">SarafuPay</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-1 rounded-full bg-white/40" />
                  <div className="size-1 rounded-full bg-white/40" />
                  <div className="size-1 rounded-full bg-white/40" />
                </div>
              </div>
              <p className="mt-1 text-[9px] font-medium text-white/60">My Collections</p>
            </div>

            {/* Collection card */}
            <div className="mx-2.5 mt-2.5 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎓</span>
                  <div>
                    <p className="text-[10px] font-bold text-[#035034]">Harambee 2026</p>
                    <p className="text-[8px] text-slate-400">Final Year Project</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold text-emerald-600">
                  <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="px-3 py-2">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[8px] text-slate-400">Collected</p>
                    <p className="text-sm font-black text-[#035034]">312K <span className="text-[8px] font-medium text-slate-400">TZS</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-400">Target</p>
                    <p className="text-[10px] font-semibold text-slate-600">500K TZS</p>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-[#C4A237]"
                    initial={{ width: 0 }}
                    whileInView={{ width: "62%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.3, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="size-2 text-slate-400" />
                    <span className="text-[8px] text-slate-400">24 contributors</span>
                  </div>
                  <span className="text-[8px] font-bold text-[#C4A237]">62%</span>
                </div>
              </div>
            </div>

            {/* Recent payments */}
            <div className="mx-2.5 mt-2">
              <p className="mb-1 px-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">Recent</p>
              <div className="flex flex-col gap-1">
                {mockPayments.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-xl bg-white px-2 py-1.5 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded-full bg-[#035034]/10 text-[7px] font-bold text-[#035034]">
                        {p.initial}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-700">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-[#035034]">{p.amount}</span>
                      {p.done
                        ? <CheckCircle2 className="size-2.5 text-emerald-500" />
                        : <Clock3 className="size-2.5 text-amber-500" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mx-2.5 mb-4 mt-auto pt-2">
              <div className="flex gap-1.5">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#035034] py-2 text-[8px] font-bold text-white">
                  <Share2 className="size-2.5" /> Share
                </button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-[8px] font-semibold text-[#035034]">
                  <QrCode className="size-2.5" /> QR Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live badge below phone */}
        <div className="mt-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 backdrop-blur-sm shadow-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
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
      className="overflow-hidden py-3"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <motion.div
        className="flex w-max gap-2.5"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((chip, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm shadow-sm"
          >
            {chip}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

const stepVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const stepItemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38 } },
};

const caseVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const caseItemVariant = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32 } },
};

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
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">

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

              <motion.div
                variants={caseVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
              >
                {useCases.map(({ emoji, title, desc }) => (
                  <motion.div
                    key={title}
                    variants={caseItemVariant}
                    whileHover={{ y: -3, scale: 1.02 }}
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
                transition={{ duration: 0.35, delay: 0.3 }}
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
      <div className="border-t border-white/70 bg-white/50 py-5 backdrop-blur-sm">
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Collections people run on SarafuPay
        </p>
        <ChipMarquee />
      </div>
    </section>
  );
}
