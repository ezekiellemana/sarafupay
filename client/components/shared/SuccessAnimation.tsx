"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export function SuccessAnimation({ state }: { state: "success" | "pending" | "failed" }) {
  const Icon = state === "success" ? CheckCircle2 : state === "failed" ? XCircle : Clock3;
  const color = state === "success" ? "text-emerald-600 bg-emerald-500/10" : state === "failed" ? "text-red-600 bg-red-500/10" : "text-yellow-700 bg-yellow-400/20";

  return (
    <motion.div
      initial={{ scale: 0.86, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className={`mx-auto flex size-20 items-center justify-center rounded-full ${color}`}
    >
      <motion.div animate={state === "pending" ? { rotate: [0, 8, -8, 0] } : { scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: state === "pending" ? Infinity : 0 }}>
        <Icon className="size-10" />
      </motion.div>
    </motion.div>
  );
}
