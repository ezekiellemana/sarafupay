"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users } from "lucide-react";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { formatMoney } from "@/lib/formatters";
import type { CollectionSummary } from "@/types";

export function CollectionStats({ summary }: { summary: CollectionSummary }) {
  const { collection, totalCollected, contributorCount, avgAmount, progress } = summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl"
    >
      {/* Headline: total collected */}
      <div className="border-b border-slate-100 px-6 pb-5 pt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Collected</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#16a34a]">
          <AnimatedNumber value={totalCollected} format={(v) => formatMoney(v, collection.currency)} />
        </p>
        {collection.targetAmount ? (
          <p className="mt-1 text-sm text-muted-foreground">
            of {formatMoney(collection.targetAmount, collection.currency)} target
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">Open-ended · no target set</p>
        )}
      </div>

      {/* Mini-stats row */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-5 py-4">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" /> Contributors
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">
            <AnimatedNumber value={contributorCount} format={(v) => String(v)} />
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <TrendingUp className="size-3.5" /> Avg. Contribution
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[#071a0e]">
            <AnimatedNumber value={avgAmount} format={(v) => formatMoney(v, collection.currency)} />
          </p>
        </div>
      </div>

      {/* Progress bar or open-ended note */}
      {collection.targetAmount ? (
        <div className="px-6 py-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="font-medium text-[#071a0e]">Progress to target</span>
            <span className="font-bold text-[#16a34a]">{progress}%</span>
          </div>
          <AnimatedProgressBar value={progress} variant="gold" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatMoney(totalCollected, collection.currency)} collected</span>
            <span>Target: {formatMoney(collection.targetAmount, collection.currency)}</span>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4">
          <p className="text-xs text-slate-400">
            No target set — this collection accepts payments until manually closed.
          </p>
        </div>
      )}
    </motion.div>
  );
}
