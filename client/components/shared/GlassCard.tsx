"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "gold" | "navy" | "premium";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: GlassCardVariant;
};

const variantClass: Record<GlassCardVariant, string> = {
  default: "sarafu-glass",
  gold: "glass-gold",
  navy: "glass-navy",
  premium: "glass-premium",
};

export function GlassCard({ children, className, delay = 0, variant = "default" }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className={cn("rounded-3xl", variantClass[variant], className)}
    >
      {children}
    </motion.div>
  );
}
