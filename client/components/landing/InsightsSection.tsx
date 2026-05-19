"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Users } from "lucide-react";
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

const paymentStatus = [
  { name: "Completed", value: 18, color: "#19A254" },
  { name: "Pending",   value: 3,  color: "#C4A237" },
  { name: "Failed",    value: 1,  color: "#ef4444" },
];
const PAYMENT_TOTAL = 22;

const recentActivity = [
  { initial: "S", name: "Sarah M.",  amount: "25,000 TZS", status: "completed", time: "2 min ago"  },
  { initial: "J", name: "James K.",  amount: "10,000 TZS", status: "completed", time: "15 min ago" },
  { initial: "A", name: "Alice T.",  amount: "25,000 TZS", status: "pending",   time: "1 hr ago"   },
];

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.5, format: "comma" | "plain" = "comma") {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!inView) return;
    const el = ref.current;
    if (!el) return;

    const fmt = (v: number) =>
      format === "comma" ? v.toLocaleString() : String(v);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt(target);
      return;
    }

    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        el.textContent = fmt(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [inView, target, duration, format]);

  return ref;
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

interface AreaTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
}

function AreaTooltip({ active, payload, label }: AreaTooltipProps) {
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

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-[11px] font-bold" style={{ color }}>{name}</p>
      <p className="text-sm font-black text-[#0B1F3A]">{value} payments</p>
    </div>
  );
}

// ─── Donut legend row (each row owns its count-up hook) ───────────────────────

function LegendRow({ name, value, color }: { name: string; value: number; color: string }) {
  const pct = Math.round((value / PAYMENT_TOTAL) * 100);
  const countRef = useCountUp(value, value <= 5 ? 1.2 : 1.5, "plain");
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-xs font-medium text-slate-600">{name}</span>
      <span className="text-sm font-black" style={{ color }}>
        <span ref={countRef}>0</span>
      </span>
      <span className="w-8 text-right text-[10px] text-slate-400">{pct}%</span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function InsightsSection() {
  const totalRef       = useCountUp(312000, 1.8);
  const contributorsRef = useCountUp(24, 1.4, "plain");

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

            {/* Totals row: collected + contributors */}
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total collected</p>
                  <div className="mt-0.5 flex flex-wrap items-end gap-x-2 gap-y-1">
                    <p className="text-3xl font-black tracking-tight text-[#035034]">
                      <span ref={totalRef}>0</span>
                    </p>
                    <span className="mb-0.5 text-sm font-semibold text-slate-400">TZS</span>
                    <span className="mb-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                      ↑ 67% this month
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <p className="text-xs font-medium text-slate-500">Contributors</p>
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-[#035034]" />
                    <p className="text-2xl font-black text-[#035034]">
                      <span ref={contributorsRef}>0</span>
                    </p>
                  </div>
                </div>
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
                    <Tooltip
                      content={<AreaTooltip />}
                      cursor={{ stroke: "#C4A237", strokeWidth: 1, strokeDasharray: "4 2" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#C4A237"
                      strokeWidth={2.5}
                      fill="url(#goldGradient)"
                      dot={{ fill: "#C4A237", r: 3.5, strokeWidth: 0 }}
                      activeDot={{ r: 5.5, fill: "#035034", strokeWidth: 2, stroke: "#C4A237" }}
                      animationBegin={200}
                      animationDuration={1500}
                      animationEasing="ease-out"
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
            {/* Payment review card: donut + legend + stacked bar */}
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/6 backdrop-blur-xl">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-bold text-[#035034]">Payment review</p>
                <p className="text-xs font-medium text-slate-500">
                  Completed, pending, and failed at a glance
                </p>
              </div>

              {/* Donut + legend */}
              <div className="flex items-center gap-5 px-5 py-5">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={56}
                        dataKey="value"
                        paddingAngle={3}
                        animationBegin={500}
                        animationDuration={1300}
                        animationEasing="ease-out"
                      >
                        {paymentStatus.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  {paymentStatus.map((item) => (
                    <LegendRow key={item.name} {...item} />
                  ))}
                </div>
              </div>

              {/* Stacked proportional bar */}
              <div className="px-5 pb-5">
                <div className="flex h-2.5 overflow-hidden rounded-full">
                  {paymentStatus.map(({ name, value, color }) => (
                    <div
                      key={name}
                      style={{
                        width: `${(value / PAYMENT_TOTAL) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  {PAYMENT_TOTAL} total payments · this collection
                </p>
              </div>
            </div>

            {/* Recent contributions */}
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
