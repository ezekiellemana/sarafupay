"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Clock3, Users, XCircle, BarChart3 } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";

// ─── Demo data ────────────────────────────────────────────────────────────────

const chartData = [
  { month: "Jan", amount: 45 },
  { month: "Feb", amount: 78 },
  { month: "Mar", amount: 120 },
  { month: "Apr", amount: 95 },
  { month: "May", amount: 187 },
  { month: "Jun", amount: 312 },
];

const statusCards = [
  {
    label: "Completed",
    value: "18",
    Icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50/90 border-emerald-100",
  },
  {
    label: "Pending",
    value: "3",
    Icon: Clock3,
    color: "text-amber-600",
    bg: "bg-amber-50/90 border-amber-100",
  },
  {
    label: "Failed",
    value: "1",
    Icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50/90 border-red-100",
  },
  {
    label: "Contributors",
    value: "24",
    Icon: Users,
    color: "text-[#035034]",
    bg: "bg-[#035034]/5 border-[#035034]/10",
  },
];

const recentActivity = [
  { initial: "S", name: "Sarah M.", amount: "25,000 TZS", status: "completed", time: "2 min ago" },
  { initial: "J", name: "James K.", amount: "10,000 TZS", status: "completed", time: "15 min ago" },
  { initial: "A", name: "Alice T.", amount: "25,000 TZS", status: "pending", time: "1 hr ago" },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/80 bg-white/98 px-4 py-2.5 shadow-xl backdrop-blur-xl">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-black text-[#035034]">
        {payload[0].value}K <span className="text-xs font-semibold text-slate-400">TZS</span>
      </p>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function InsightsSection() {
  return (
    <section className="border-y border-white/70 bg-[#035034]/3 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.38 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-[#C4A237]" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4A237]">
              Live collection insights
            </p>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#035034] sm:text-4xl">
            Track every contribution clearly
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            See how much has been collected, who has paid, and what still needs attention — all from one clean dashboard.
          </p>
        </motion.div>

        {/* Dashboard grid */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

          {/* ── Left: chart card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.42, delay: 0.06 }}
            className="flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/6 backdrop-blur-xl"
          >
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#035034]/8">
                  <BarChart3 className="size-4 text-[#035034]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#035034]">Collection performance</p>
                  <p className="text-xs font-medium text-slate-500">Harambee 2026 · Demo</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Live
              </span>
            </div>

            {/* Totals + progress */}
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">Total collected</p>
              <div className="mt-0.5 flex flex-wrap items-end gap-x-2 gap-y-1">
                <p className="text-3xl font-black tracking-tight text-[#035034]">312,000</p>
                <span className="mb-0.5 text-sm font-semibold text-slate-400">TZS</span>
                <span className="mb-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                  ↑ 67% this month
                </span>
              </div>
              <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium text-slate-500">Target: 500,000 TZS</span>
                  <span className="font-bold text-[#C4A237]">62% reached</span>
                </div>
                <AnimatedProgressBar value={62} variant="gold" />
              </div>
            </div>

            {/* Area chart */}
            <div className="flex-1 px-5 pb-5 pt-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Monthly growth (TZS × 1,000)
              </p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C4A237" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#C4A237" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#C4A237", strokeWidth: 1, strokeDasharray: "4 2" }} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#C4A237"
                      strokeWidth={2.5}
                      fill="url(#goldGradient)"
                      dot={{ fill: "#C4A237", r: 3.5, strokeWidth: 0 }}
                      activeDot={{ r: 5.5, fill: "#035034", strokeWidth: 2, stroke: "#C4A237" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* ── Right column ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.42, delay: 0.12 }}
            className="flex flex-col gap-4"
          >
            {/* Status mini cards */}
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/6 backdrop-blur-xl">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-bold text-[#035034]">Payment overview</p>
                <p className="text-xs font-medium text-slate-500">Current collection status</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {statusCards.map(({ label, value, Icon, color, bg }) => (
                  <div key={label} className={`flex flex-col gap-2 rounded-2xl border p-3.5 ${bg}`}>
                    <Icon className={`size-4 ${color}`} />
                    <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
                    <p className="text-xs font-semibold text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="flex-1 overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/6 backdrop-blur-xl">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-bold text-[#035034]">Recent contributions</p>
              </div>
              <div className="flex flex-col divide-y divide-slate-100">
                {recentActivity.map((item) => (
                  <div key={item.name} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#035034]/10 text-xs font-bold text-[#035034]">
                        {item.initial}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#035034]">{item.name}</p>
                        <p className="text-[11px] font-medium text-slate-400">{item.time}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-[#035034]">{item.amount}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.status === "completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <p className="text-[11px] font-medium text-slate-400">
                  Demo preview · Your real data appears here
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
