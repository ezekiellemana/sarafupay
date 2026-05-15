"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { cn } from "@/lib/utils";

type AccentVariant = "blue" | "gold" | "green" | "purple";

const accentStyles: Record<AccentVariant, { card: string; icon: string }> = {
  blue:   { card: "border-blue-100/60 bg-white/80",   icon: "bg-linear-to-br from-blue-500/12 to-sky-400/15 text-blue-600 ring-1 ring-blue-500/10" },
  gold:   { card: "border-amber-100/60 bg-amber-50/60", icon: "bg-linear-to-br from-amber-400/20 to-yellow-300/15 text-amber-600 ring-1 ring-amber-400/15 coin-glow" },
  green:  { card: "border-emerald-100/60 bg-emerald-50/40", icon: "bg-linear-to-br from-emerald-500/12 to-green-400/15 text-emerald-600 ring-1 ring-emerald-500/10" },
  purple: { card: "border-purple-100/60 bg-purple-50/40", icon: "bg-linear-to-br from-purple-500/12 to-violet-400/15 text-purple-600 ring-1 ring-purple-500/10" },
};

export function DashboardCard({
  title,
  value,
  numericValue,
  formatValue,
  description,
  icon,
  className,
  accent = "blue",
}: {
  title: string;
  value: string;
  numericValue?: number;
  formatValue?: (value: number) => string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  accent?: AccentVariant;
}) {
  const styles = accentStyles[accent];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.28 }}>
      <Card className={cn("border shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-shadow hover:shadow-2xl", styles.card, className)}>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</CardTitle>
            <p className={cn("mt-2 text-2xl font-bold tracking-tight text-[#0B1F3A]", accent === "gold" && "sarafu-gradient-text-gold")}>
              {typeof numericValue === "number" ? <AnimatedNumber value={numericValue} format={formatValue} /> : value}
            </p>
          </div>
          {icon && (
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", styles.icon)}>
              {icon}
            </span>
          )}
        </CardHeader>
        {description && <CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent>}
      </Card>
    </motion.div>
  );
}
