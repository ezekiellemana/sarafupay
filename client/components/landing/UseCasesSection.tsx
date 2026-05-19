"use client";

import { motion } from "framer-motion";

const cases = [
  {
    emoji: "🎓",
    title: "School Contributions",
    desc: "Class fees, uniform funds, trip costs — collect from parents with one shareable link.",
  },
  {
    emoji: "🎉",
    title: "Events & Harambee",
    desc: "Weddings, birthday funds, harambees, celebrations — accept contributions from anyone in your network.",
  },
  {
    emoji: "📚",
    title: "Final Year Projects",
    desc: "Group project budgets, research costs, materials — split costs fairly and track who has paid.",
  },
  {
    emoji: "⛪",
    title: "Church & Mosque",
    desc: "Weekly offerings, building funds, charity drives — a transparent collection record for your community.",
  },
  {
    emoji: "🆘",
    title: "Emergency Fundraising",
    desc: "Medical emergencies, disaster relief, urgent causes — start collecting within minutes, share instantly.",
  },
  {
    emoji: "💼",
    title: "Business Collections",
    desc: "Group investments, savings clubs (chama), supplier payments — keep professional records of every transaction.",
  },
];

export function UseCasesSection() {
  return (
    <section id="uses" className="border-t border-white/70 bg-[#035034]/3 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-[#C4A237]" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4A237]">
              Built for everyone
            </p>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#035034] sm:text-4xl">
            What will you collect for?
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-500">
            SarafuPay works for any group, any cause, any size. Here are the most common uses.
          </p>
        </div>

        {/* Use case grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map(({ emoji, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ delay: index * 0.07, duration: 0.3 }}
              viewport={{ once: true }}
              className="flex gap-4 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-lg shadow-slate-900/4 backdrop-blur transition-shadow hover:shadow-xl"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#035034]/6 text-2xl">
                {emoji}
              </span>
              <div>
                <h3 className="font-bold text-[#035034]">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
