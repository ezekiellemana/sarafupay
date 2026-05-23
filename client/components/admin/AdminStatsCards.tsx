"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FolderOpen, Users, WalletCards } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@/types";

type Accent = "gold" | "green" | "blue" | "amber";

const ACCENT: Record<Accent, { card: string; strip: string; icon: string }> = {
  gold: {
    card: "border-amber-200 bg-amber-50",
    strip: "bg-amber-400",
    icon: "bg-amber-400/15 text-amber-600 ring-1 ring-amber-400/20",
  },
  green: {
    card: "border-emerald-200 bg-emerald-50",
    strip: "bg-emerald-500",
    icon: "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/15",
  },
  blue: {
    card: "border-blue-200 bg-blue-50",
    strip: "bg-blue-500",
    icon: "bg-blue-500/12 text-blue-600 ring-1 ring-blue-500/15",
  },
  amber: {
    card: "border-orange-200 bg-orange-50",
    strip: "bg-[#C4A237]",
    icon: "bg-[#C4A237]/15 text-[#C4A237] ring-1 ring-[#C4A237]/20",
  },
};

function HeroTile({
  label,
  value,
  formatValue,
  subStat,
  icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  formatValue?: (v: number) => string;
  subStat: string;
  icon: React.ReactNode;
  accent: Accent;
  delay?: number;
}) {
  const s = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-sm shadow-[#0a1f12]/4",
        s.card,
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1 rounded-l-2xl", s.strip)} />
      <div className="flex items-start justify-between gap-3 px-6 pb-5 pt-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
          <p className="mt-2 text-[2rem] font-extrabold leading-none tracking-tight text-[#071a0e] xl:text-[2.25rem]">
            <AnimatedNumber value={value} format={formatValue} />
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">{subStat}</p>
        </div>
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", s.icon)}>
          {icon}
        </span>
      </div>
    </motion.div>
  );
}

export function AdminStatsCards({ data }: { data: AdminDashboardData }) {
  const paidRate =
    data.totalMembers > 0 ? Math.round((data.paidMembersThisMonth / data.totalMembers) * 100) : 0;
  const inactiveUsers = data.totalUsers - data.activeUsers;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <HeroTile
        label="Total Collected"
        value={data.totalCollected}
        formatValue={(v) => formatMoney(v)}
        subStat={`${data.completedPayments.toLocaleString()} completed payments`}
        icon={<WalletCards className="size-6" />}
        accent="gold"
        delay={0}
      />
      <HeroTile
        label="Paid This Month"
        value={data.paidMembersThisMonth}
        subStat={`${paidRate}% of members · ${data.unpaidMembersThisMonth} yet to pay`}
        icon={<CheckCircle2 className="size-6" />}
        accent="green"
        delay={0.06}
      />
      <HeroTile
        label="Active Members"
        value={data.totalMembers}
        subStat={
          inactiveUsers > 0
            ? `${inactiveUsers} inactive account${inactiveUsers !== 1 ? "s" : ""}`
            : "All accounts active"
        }
        icon={<Users className="size-6" />}
        accent="blue"
        delay={0.12}
      />
      <HeroTile
        label="Active Collections"
        value={data.activeCollections}
        subStat={`${data.totalCollections} total collections`}
        icon={<FolderOpen className="size-6" />}
        accent="amber"
        delay={0.18}
      />
    </div>
  );
}
