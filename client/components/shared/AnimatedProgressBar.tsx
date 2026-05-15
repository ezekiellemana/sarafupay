"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ProgressVariant = "blue" | "gold";

export function AnimatedProgressBar({
  value,
  className,
  variant = "blue",
}: {
  value: number;
  className?: string;
  variant?: ProgressVariant;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-slate-200/80", className)}>
      <motion.div
        className={cn(
          "h-full rounded-full",
          variant === "gold"
            ? "bg-linear-to-r from-amber-500 via-yellow-400 to-amber-300"
            : "bg-linear-to-r from-[#16A34A] via-[#2563EB] to-[#38BDF8]"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </div>
  );
}
