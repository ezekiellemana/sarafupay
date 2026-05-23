"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { cn } from "@/lib/utils";

type AccentVariant = "blue" | "gold" | "green" | "purple" | "red";

const accentStyles: Record<AccentVariant, { card: string; icon: string }> = {
  blue:   { card: "border-blue-100 bg-white",            icon: "bg-blue-50 text-blue-600 ring-1 ring-blue-100" },
  gold:   { card: "border-amber-200 bg-amber-50",        icon: "bg-amber-100 text-amber-600 ring-1 ring-amber-200 coin-glow" },
  green:  { card: "border-emerald-100 bg-emerald-50",   icon: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" },
  purple: { card: "border-purple-100 bg-purple-50",     icon: "bg-purple-50 text-purple-600 ring-1 ring-purple-100" },
  red:    { card: "border-red-100 bg-red-50",           icon: "bg-red-50 text-red-600 ring-1 ring-red-100" },
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
      <Card className={cn("border shadow-sm shadow-[#0a1f12]/4 transition-shadow hover:shadow-md", styles.card, className)}>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{title}</CardTitle>
            <p className={cn("mt-2 text-2xl font-bold tracking-tight text-[#071a0e]", accent === "gold" && "sarafu-gradient-text-gold")}>
              {typeof numericValue === "number" ? <AnimatedNumber value={numericValue} format={formatValue} /> : value}
            </p>
          </div>
          {icon && (
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", styles.icon)}>
              {icon}
            </span>
          )}
        </CardHeader>
        {description && <CardContent><p className="text-sm font-medium text-slate-600">{description}</p></CardContent>}
      </Card>
    </motion.div>
  );
}
