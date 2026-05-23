"use client";

import { motion } from "framer-motion";
import { WalletCards } from "lucide-react";

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-[#e5e0d6] bg-white px-8 py-12 text-center shadow-sm shadow-[#0a1f12]/4">
      <div className="flex size-12 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
        {icon ?? <WalletCards />}
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#071a0e]">{title}</h3>
        <p className="mt-1.5 text-sm font-medium text-slate-600">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}
