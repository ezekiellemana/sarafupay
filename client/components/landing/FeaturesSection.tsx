"use client";

import { motion } from "framer-motion";
import { ChartNoAxesCombined, ClipboardList, Download, History, ShieldCheck, Smartphone } from "lucide-react";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";
import { MoneyBag } from "@/components/shared/illustrations/MoneyBag";

const features = [
  {
    title: "Easy Snippe Payments",
    desc: "Pay by M-Pesa or card through a Snippe-hosted checkout — no app install required for contributors.",
    Icon: Smartphone,
    tint: "bg-amber-50/80 border-amber-200/50",
    iconBg: "bg-linear-to-br from-amber-400/20 to-yellow-300/15",
    iconColor: "text-amber-600",
    illustration: <GoldCoin size={22} animate={false} />,
  },
  {
    title: "Owner Dashboard",
    desc: "See total collected, contributor count, and per-payment records for every collection you run.",
    Icon: ChartNoAxesCombined,
    tint: "bg-emerald-50/70 border-emerald-200/50",
    iconBg: "bg-linear-to-br from-emerald-500/15 to-green-400/10",
    iconColor: "text-emerald-600",
    illustration: null,
  },
  {
    title: "Payment History",
    desc: "Every contribution is recorded with a reference number, timestamp, status, and payment method.",
    Icon: History,
    tint: "bg-purple-50/70 border-purple-200/50",
    iconBg: "bg-linear-to-br from-purple-500/15 to-violet-400/10",
    iconColor: "text-purple-600",
    illustration: null,
  },
  {
    title: "Collection Pages",
    desc: "Create a public payment link for any event, cause, or group — share it and start collecting immediately.",
    Icon: ClipboardList,
    tint: "bg-emerald-50/70 border-emerald-200/50",
    iconBg: "bg-linear-to-br from-emerald-500/15 to-green-400/10",
    iconColor: "text-emerald-600",
    illustration: null,
  },
  {
    title: "Webhook-Verified Records",
    desc: "Payments are confirmed by a signed Snippe webhook. No amount is marked complete without server-side verification.",
    Icon: ShieldCheck,
    tint: "bg-sky-50/70 border-sky-200/50",
    iconBg: "bg-linear-to-br from-sky-500/15 to-cyan-400/10",
    iconColor: "text-sky-600",
    illustration: <MoneyBag size={22} animate={false} />,
  },
  {
    title: "CSV Export",
    desc: "Download a full payment record for any collection — useful for accounting, audits, or group reporting.",
    Icon: Download,
    tint: "bg-slate-50/80 border-slate-200/50",
    iconBg: "bg-linear-to-br from-slate-600/15 to-slate-400/10",
    iconColor: "text-slate-700",
    illustration: null,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-y border-white/70 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center gap-3">
          <GoldCoin size={28} animate={false} />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Built for collections</p>
        </div>
        <h2 className="mt-2 text-3xl font-bold text-[#071a0e]">Everything you need to collect and track</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, Icon, tint, iconBg, iconColor, illustration }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
              viewport={{ once: true }}
              className={`rounded-3xl border ${tint} p-5 shadow-xl shadow-slate-900/5 backdrop-blur transition-shadow hover:shadow-2xl`}
            >
              <div className={`flex size-12 items-center justify-center rounded-2xl ${iconBg}`}>
                {illustration ?? <Icon className={`size-5 ${iconColor}`} />}
              </div>
              <h3 className="mt-5 font-semibold text-[#071a0e]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
