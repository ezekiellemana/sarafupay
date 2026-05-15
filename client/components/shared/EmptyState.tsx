"use client";

import { motion } from "framer-motion";
import { WalletCards } from "lucide-react";

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-green-200/60 bg-white/70 p-8 text-center shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-linear-to-br from-green-500/12 to-emerald-400/20 text-primary">
        {icon ?? <WalletCards />}
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#0B1F3A]">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}
