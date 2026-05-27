"use client";

import { formatMoney } from "@/lib/formatters";
import type { FeePreview } from "@/types";

type Props = {
  preview: FeePreview | null;
  loading: boolean;
  currency: string;
};

export function FeeBreakdownCard({ preview, loading, currency }: Props) {
  // Only show skeleton when refreshing a visible preview — avoids flash on initial load
  // when FEES_ENABLED=false (response arrives quickly and renders nothing).
  if (loading && preview?.feesEnabled) {
    return (
      <div className="rounded-2xl border border-[#e5e0d6] bg-white px-4 py-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-32 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3.5 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-36 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3.5 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!preview || !preview.feesEnabled || preview.serviceFee === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Contribution amount</span>
        <span className="shrink-0 font-medium text-[#071a0e]">
          {formatMoney(preview.contributionAmount, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">SarafuPay service fee</span>
        <span className="shrink-0 font-medium text-amber-700">
          {formatMoney(preview.serviceFee, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-amber-200/40 pt-2 text-sm font-bold">
        <span className="text-[#071a0e]">Total to pay</span>
        <span className="shrink-0 text-[#071a0e]">
          {formatMoney(preview.totalChargedAmount, currency)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatMoney(preview.ownerReceivableAmount, currency)} goes to the collection.
      </p>
    </div>
  );
}
