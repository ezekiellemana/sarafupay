"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownToLine, Banknote, DollarSign, Receipt, TrendingUp, Hash } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@/types";

type RevenueSummary = AdminDashboardData["revenueSummary"];
type WithdrawalRevenueSummary = AdminDashboardData["withdrawalRevenueSummary"];

const ACCENT_CONFIG = {
  gold:   { card: "border-amber-200 bg-amber-50",    strip: "bg-amber-400",    icon: "bg-amber-400/15 text-amber-600 ring-1 ring-amber-400/20" },
  green:  { card: "border-emerald-200 bg-emerald-50", strip: "bg-emerald-500", icon: "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/15" },
  orange: { card: "border-orange-200 bg-orange-50",  strip: "bg-orange-500",   icon: "bg-orange-500/12 text-orange-600 ring-1 ring-orange-500/15" },
  blue:   { card: "border-blue-200 bg-blue-50",      strip: "bg-blue-500",     icon: "bg-blue-500/12 text-blue-600 ring-1 ring-blue-500/15" },
} as const;

type Accent = keyof typeof ACCENT_CONFIG;

const CHANNEL_LABEL: Record<string, string> = {
  mobile_money: "Mobile Money",
  card: "Card",
  unknown: "Unknown",
};

const CHANNEL_BADGE: Record<string, string> = {
  mobile_money: "bg-emerald-100 text-emerald-700",
  card: "bg-blue-100 text-blue-700",
  unknown: "bg-amber-100 text-amber-700",
};

function RevenueTile({
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
  subStat: React.ReactNode;
  icon: React.ReactNode;
  accent: Accent;
  delay?: number;
}) {
  const s = ACCENT_CONFIG[accent];
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
          <div className="mt-2 text-xs font-medium text-slate-500">{subStat}</div>
        </div>
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", s.icon)}>
          {icon}
        </span>
      </div>
    </motion.div>
  );
}

export function AdminRevenueCards({
  summary,
  withdrawalRevenueSummary,
}: {
  summary: RevenueSummary;
  withdrawalRevenueSummary?: WithdrawalRevenueSummary;
}) {
  const hasData = summary.feePaymentCount > 0;
  const hasWithdrawalData = (withdrawalRevenueSummary?.withdrawalFeesCollected ?? 0) > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <TrendingUp className="size-4 text-[#19A254]" />
        <h2 className="text-base font-bold text-[#071a0e]">SarafuPay Platform Earnings</h2>
        <span className="text-xs text-slate-400">· fee-tracked completed payments only</span>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <RevenueTile
          label="Net Platform Revenue"
          value={summary.netPlatformRevenue}
          formatValue={(v) => formatMoney(Math.round(v))}
          subStat={`This month: ${formatMoney(summary.netPlatformRevenueThisMonth)}`}
          icon={<TrendingUp className="size-6" />}
          accent="gold"
          delay={0}
        />
        <RevenueTile
          label="Service Fees Collected"
          value={summary.grossPlatformFees}
          formatValue={(v) => formatMoney(Math.round(v))}
          subStat={`This month: ${formatMoney(summary.grossPlatformFeesThisMonth)}`}
          icon={<DollarSign className="size-6" />}
          accent="green"
          delay={0.06}
        />
        <RevenueTile
          label="Provider Costs"
          value={summary.providerCosts}
          formatValue={(v) => formatMoney(Math.round(v))}
          subStat={`This month: ${formatMoney(summary.providerCostsThisMonth)}`}
          icon={<Receipt className="size-6" />}
          accent="orange"
          delay={0.12}
        />
        <RevenueTile
          label="Fee-Tracked Payments"
          value={summary.feePaymentCount}
          subStat={
            summary.unknownChannelCount > 0 ? (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="size-3 shrink-0" />
                {summary.unknownChannelCount} channel{summary.unknownChannelCount !== 1 ? "s" : ""} need review
              </span>
            ) : (
              hasData ? "All channels confirmed" : "No fee-tracked payments yet"
            )
          }
          icon={<Hash className="size-6" />}
          accent="blue"
          delay={0.18}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
        <div className="border-b border-[#e5e0d6] px-5 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenue by Channel</p>
        </div>

        {!hasData ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-400">No fee-tracked payments yet.</p>
            <p className="mt-1 text-xs text-slate-300">Revenue data appears here once FEES_ENABLED payments complete.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f5f2ed]">
            {(["mobile_money", "card", "unknown"] as const).map((ch) => {
              const row = summary.byChannel.find((r) => r.channel === ch);
              const count = row?.count ?? 0;
              const isUnknown = ch === "unknown";
              return (
                <div key={ch} className="flex flex-col gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-44">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", CHANNEL_BADGE[ch])}>
                      {CHANNEL_LABEL[ch]}
                    </span>
                    {isUnknown && count > 0 && <AlertTriangle className="size-3.5 text-amber-500" />}
                    <span className="text-xs font-semibold text-slate-500">
                      {count.toLocaleString()} payment{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400">Service fee</p>
                      <p className="text-sm font-semibold text-[#071a0e]">{formatMoney(row?.serviceFee ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Provider cost</p>
                      <p className="text-sm font-medium text-slate-500">{formatMoney(row?.providerFee ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Net revenue</p>
                      <p className={cn(
                        "text-sm font-bold",
                        isUnknown && count > 0 ? "text-amber-600" : "text-[#035034]",
                      )}>
                        {formatMoney(row?.netRevenue ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Withdrawal Earnings subsection ── */}
      {withdrawalRevenueSummary !== undefined && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ArrowDownToLine className="size-4 text-amber-500" />
            <h3 className="text-base font-bold text-[#071a0e]">Withdrawal Earnings</h3>
            <span className="text-xs text-slate-400">· paid withdrawals only</span>
          </div>

          {!hasWithdrawalData ? (
            <div className="rounded-2xl border border-[#e5e0d6] bg-white px-6 py-8 text-center shadow-sm shadow-[#0a1f12]/4">
              <p className="text-sm text-slate-400">No paid withdrawals yet.</p>
              <p className="mt-1 text-xs text-slate-300">Withdrawal fee revenue appears here once an admin marks a withdrawal as paid.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <RevenueTile
                label="Withdrawal Fees Collected"
                value={withdrawalRevenueSummary.withdrawalFeesCollected}
                formatValue={(v) => formatMoney(Math.round(v))}
                subStat={`This month: ${formatMoney(withdrawalRevenueSummary.withdrawalFeesThisMonth)}`}
                icon={<Banknote className="size-6" />}
                accent="gold"
                delay={0}
              />
              <RevenueTile
                label="Payout Costs"
                value={withdrawalRevenueSummary.withdrawalProviderCosts}
                formatValue={(v) => formatMoney(Math.round(v))}
                subStat={`This month: ${formatMoney(withdrawalRevenueSummary.withdrawalCostsThisMonth)}`}
                icon={<ArrowDownToLine className="size-6" />}
                accent="orange"
                delay={0.06}
              />
              <RevenueTile
                label="Net Withdrawal Margin"
                value={withdrawalRevenueSummary.netWithdrawalMargin}
                formatValue={(v) => formatMoney(Math.round(v))}
                subStat={`Volume paid out: ${formatMoney(withdrawalRevenueSummary.paidWithdrawalVolume)}`}
                icon={<TrendingUp className="size-6" />}
                accent="green"
                delay={0.12}
              />
            </div>
          )}

          {/* Combined platform net */}
          {hasWithdrawalData && (
            <div className="flex items-center justify-between rounded-2xl border border-[#e5e0d6] bg-[#f9f7f4] px-5 py-3.5 shadow-sm shadow-[#0a1f12]/4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[#19A254]" />
                <p className="text-sm font-bold text-[#071a0e]">Combined Platform Net</p>
                <span className="text-xs text-slate-400">payments + withdrawals</span>
              </div>
              <p className="text-lg font-extrabold text-[#035034]">
                {formatMoney(Math.round(summary.netPlatformRevenue + withdrawalRevenueSummary.netWithdrawalMargin))}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
