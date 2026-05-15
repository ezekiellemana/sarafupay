"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Wallet, Target } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { formatMoney } from "@/lib/formatters";
import type { CollectionSummary } from "@/types";

export function CollectionStats({ summary }: { summary: CollectionSummary }) {
  const { collection, totalCollected, contributorCount, avgAmount, progress } = summary;

  const stats = [
    {
      label: "Total Collected",
      value: formatMoney(totalCollected, collection.currency),
      numericValue: totalCollected,
      format: (v: number) => formatMoney(v, collection.currency),
      icon: <Wallet className="size-5" />,
      color: "from-emerald-500/12 to-green-400/15 text-emerald-600 ring-emerald-500/10",
      bg: "border-emerald-100/60 bg-emerald-50/60"
    },
    {
      label: "Contributors",
      value: String(contributorCount),
      numericValue: contributorCount,
      format: (v: number) => String(v),
      icon: <Users className="size-5" />,
      color: "from-amber-400/20 to-yellow-300/15 text-amber-600 ring-amber-400/15",
      bg: "border-amber-100/60 bg-amber-50/60"
    },
    {
      label: "Avg. Contribution",
      value: formatMoney(avgAmount, collection.currency),
      numericValue: avgAmount,
      format: (v: number) => formatMoney(v, collection.currency),
      icon: <TrendingUp className="size-5" />,
      color: "from-blue-500/12 to-sky-400/15 text-blue-600 ring-blue-500/10",
      bg: "border-blue-100/60 bg-blue-50/60"
    },
    {
      label: "Target",
      value: collection.targetAmount ? formatMoney(collection.targetAmount, collection.currency) : "Open",
      numericValue: collection.targetAmount,
      icon: <Target className="size-5" />,
      color: "from-purple-500/12 to-violet-400/15 text-purple-600 ring-purple-500/10",
      bg: "border-purple-100/60 bg-purple-50/60"
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-3xl border px-5 py-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl ${stat.bg}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <span className={`flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-[#071a0e]">
              {typeof stat.numericValue === "number" && stat.format ? (
                <AnimatedNumber value={stat.numericValue} format={stat.format} />
              ) : (
                stat.value
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {collection.targetAmount && (
        <div className="rounded-3xl border border-green-100/60 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-[#071a0e]">Collection Progress</span>
            <span className="font-bold text-[#16a34a]">{progress}%</span>
          </div>
          <AnimatedProgressBar value={progress} variant="gold" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatMoney(totalCollected, collection.currency)} collected</span>
            <span>Target: {formatMoney(collection.targetAmount, collection.currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
