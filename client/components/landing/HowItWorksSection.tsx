"use client";

import { motion } from "framer-motion";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";

const steps = [
  { label: "Join or login", tint: "bg-blue-50/80 border-blue-200/50", desc: "Create your account or log in to your SarafuPay wallet." },
  { label: "Pay through Snippe", tint: "glass-gold border-amber-200/50", desc: "Complete your monthly contribution via the Snippe checkout flow." },
  { label: "Return to SarafuPay", tint: "bg-emerald-50/80 border-emerald-200/50", desc: "We verify your payment automatically via webhook confirmation." },
  { label: "Track your contribution", tint: "bg-[#0B1F3A]/5 border-[#0B1F3A]/15", desc: "Your dashboard updates in real time with your wallet summary." },
];

const stepColors = ["text-blue-600", "text-amber-600", "text-emerald-600", "text-[#0B1F3A]"];
const stepCoinBg = [
  "bg-linear-to-br from-blue-500 to-sky-400",
  "bg-linear-to-br from-amber-500 to-yellow-400",
  "bg-linear-to-br from-emerald-500 to-green-400",
  "bg-linear-to-br from-[#052e16] to-[#16a34a]",
];

export function HowItWorksSection() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex items-center gap-3">
        <GoldCoin size={28} animate={false} />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Four clear steps</p>
      </div>
      <h2 className="mt-2 text-3xl font-bold text-[#0B1F3A]">How it works</h2>
      <div className="relative mt-8 grid gap-4 md:grid-cols-4">
        {/* Connecting dashed line on desktop */}
        <div className="absolute left-[12.5%] right-[12.5%] top-[2.2rem] hidden border-t-2 border-dashed border-amber-300/50 md:block" />
        {steps.map(({ label, tint, desc }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ delay: index * 0.1, duration: 0.35 }}
            viewport={{ once: true }}
            className={`relative rounded-3xl border ${tint} p-5 shadow-xl shadow-slate-900/5 backdrop-blur`}
          >
            <div className={`relative z-10 flex size-11 items-center justify-center rounded-full ${stepCoinBg[index]} text-sm font-bold text-white shadow-lg`}>
              {index + 1}
              {/* Small coin shine */}
              <span className="absolute inset-0 rounded-full bg-white/20 mask-[radial-gradient(circle_at_30%_30%,white,transparent)]" />
            </div>
            <p className={`mt-4 font-semibold ${stepColors[index]}`}>{label}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{desc}</p>
            {index === 1 && (
              <motion.div
                className="absolute -right-2 -top-3"
                animate={{ y: [0, -6, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <GoldCoin size={22} animate={false} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
