"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Create a collection",
    desc: "Set up your collection with a title, description, target amount, and optional fixed or custom contribution amount. Takes under 2 minutes.",
    tint: "bg-amber-50/90 border-amber-200/50",
    numBg: "bg-[#C4A237]",
    titleColor: "text-[#C4A237]",
  },
  {
    num: "02",
    title: "Share the link",
    desc: "Copy your unique payment link and share it on WhatsApp, in a group chat, or display the QR code at your event. No tech skills needed.",
    tint: "bg-[#035034]/5 border-[#035034]/12",
    numBg: "bg-[#035034]",
    titleColor: "text-[#035034]",
  },
  {
    num: "03",
    title: "Contributors pay securely",
    desc: "Your group pays through Snippe — M-Pesa, card, or mobile money. Each payment is webhook-verified before it appears on your dashboard.",
    tint: "bg-emerald-50/80 border-emerald-200/50",
    numBg: "bg-[#19A254]",
    titleColor: "text-[#19A254]",
  },
  {
    num: "04",
    title: "Track everything in real time",
    desc: "Watch contributions roll in on your dashboard. Download a CSV export, view receipts, and see your progress towards the target — all in one place.",
    tint: "bg-[#035034]/5 border-[#035034]/12",
    numBg: "bg-[#035034]",
    titleColor: "text-[#035034]",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:py-20">

      {/* Section header */}
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="size-2 rounded-full bg-[#C4A237]" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4A237]">
            Simple process
          </p>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#035034] sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-500">
          From zero to collecting money in under 5 minutes.
        </p>
      </div>

      {/* Steps */}
      <div className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Connecting dashed line — desktop only */}
        <div className="absolute left-[12.5%] right-[12.5%] top-[1.65rem] hidden border-t-2 border-dashed border-[#C4A237]/30 lg:block" />

        {steps.map(({ num, title, desc, tint, numBg, titleColor }, index) => (
          <motion.div
            key={num}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ delay: index * 0.1, duration: 0.35 }}
            viewport={{ once: true }}
            className={`relative rounded-3xl border ${tint} p-6 shadow-lg shadow-slate-900/4 backdrop-blur transition-shadow hover:shadow-xl`}
          >
            <div
              className={`relative z-10 flex size-12 items-center justify-center rounded-full ${numBg} text-sm font-black text-white shadow-md`}
            >
              {num}
            </div>
            <h3 className={`mt-4 text-base font-bold ${titleColor}`}>{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
