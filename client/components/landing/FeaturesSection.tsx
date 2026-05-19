"use client";

import { motion } from "framer-motion";
import { BarChart3, Download, Link2, QrCode, ReceiptText, Users } from "lucide-react";

const features = [
  {
    Icon: Link2,
    title: "Shareable Payment Links",
    desc: "Create a unique payment page for any collection in seconds. Share the link via WhatsApp, SMS, or email — no app install needed.",
    tint: "bg-amber-50/90 border-amber-200/50",
    iconBg: "bg-amber-400/15",
    iconColor: "text-[#C4A237]",
  },
  {
    Icon: Users,
    title: "Contributor Tracking",
    desc: "See exactly who paid, how much, and when. Every contribution is logged with a reference number, status, and timestamp.",
    tint: "bg-[#035034]/5 border-[#035034]/12",
    iconBg: "bg-[#035034]/10",
    iconColor: "text-[#035034]",
  },
  {
    Icon: QrCode,
    title: "QR Code & WhatsApp Sharing",
    desc: "Every collection gets a QR code. Display it at your event or paste your link in a WhatsApp group and start receiving instantly.",
    tint: "bg-emerald-50/80 border-emerald-200/50",
    iconBg: "bg-emerald-500/12",
    iconColor: "text-[#19A254]",
  },
  {
    Icon: ReceiptText,
    title: "Instant Payment Receipts",
    desc: "Contributors receive a verified receipt for every payment — printable, shareable, and proof of contribution.",
    tint: "bg-amber-50/90 border-amber-200/50",
    iconBg: "bg-amber-400/15",
    iconColor: "text-[#C4A237]",
  },
  {
    Icon: BarChart3,
    title: "Owner Dashboard",
    desc: "Your personal dashboard shows total collected, contributor count, payment history, and collection status at a glance.",
    tint: "bg-[#035034]/5 border-[#035034]/12",
    iconBg: "bg-[#035034]/10",
    iconColor: "text-[#035034]",
  },
  {
    Icon: Download,
    title: "CSV Export & Reports",
    desc: "Download a full spreadsheet of all contributions for auditing, accounting, or sharing with your committee.",
    tint: "bg-emerald-50/80 border-emerald-200/50",
    iconBg: "bg-emerald-500/12",
    iconColor: "text-[#19A254]",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-y border-white/70 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">

        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-[#C4A237]" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4A237]">
              Everything you need
            </p>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#035034] sm:text-4xl">
            Built for real collection needs
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            From your first group payment link to managing hundreds of contributors — SarafuPay keeps everything organised.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, desc, tint, iconBg, iconColor }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ delay: index * 0.07, duration: 0.3 }}
              viewport={{ once: true }}
              className={`rounded-3xl border ${tint} p-6 shadow-lg shadow-slate-900/4 backdrop-blur transition-shadow hover:shadow-xl`}
            >
              <div className={`flex size-12 items-center justify-center rounded-2xl ${iconBg}`}>
                <Icon className={`size-5 ${iconColor}`} strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#035034]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
