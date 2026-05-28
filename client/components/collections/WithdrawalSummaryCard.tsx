"use client";

import { useState } from "react";
import { ArrowDownToLine, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters";
import { WithdrawalRequestDialog } from "./WithdrawalRequestDialog";
import type { WithdrawalSummary } from "@/types";

interface Props {
  summary: WithdrawalSummary;
  collectionId: string;
  currency: string;
  onSuccess: () => void;
}

function BalanceRow({
  label,
  value,
  currency,
  valueClass,
}: {
  label: string;
  value: number;
  currency: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass ?? "font-medium text-[#071a0e]"}>{formatMoney(value, currency)}</span>
    </div>
  );
}

export function WithdrawalSummaryCard({ summary, collectionId, currency, onSuccess }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const canRequest = summary.availableForWithdrawal >= summary.minimumBalanceRequired;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4"
      >
        {/* Amber accent strip */}
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-amber-400" />

        {/* Available balance */}
        <div className="border-b border-[#e5e0d6] px-6 pb-5 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Available for Withdrawal
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-700 sm:text-4xl">
            {formatMoney(summary.availableForWithdrawal, currency)}
          </p>
        </div>

        {/* Balance breakdown */}
        <div className="divide-y divide-slate-50 px-6">
          <BalanceRow
            label="Completed contributions"
            value={summary.completedContributions}
            currency={currency}
            valueClass="font-semibold text-[#071a0e]"
          />
          <BalanceRow
            label="Reserved (pending/approved/processing)"
            value={summary.lockedWithdrawals}
            currency={currency}
            valueClass={summary.lockedWithdrawals > 0 ? "font-medium text-amber-700" : "font-medium text-slate-400"}
          />
          <BalanceRow
            label="Paid out"
            value={summary.paidWithdrawals}
            currency={currency}
            valueClass="font-medium text-slate-400"
          />
        </div>

        {/* Fee constants */}
        <div className="border-t border-[#e5e0d6] bg-slate-50/60 px-6 py-3 text-xs text-slate-400">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Lock className="size-3" /> Fee: {formatMoney(summary.withdrawalFee, currency)}
            </span>
            <span>Min request: {formatMoney(summary.minimumWithdrawalAmount, currency)}</span>
            <span>Min balance needed: {formatMoney(summary.minimumBalanceRequired, currency)}</span>
          </div>
        </div>

        {/* Action */}
        <div className="px-6 py-5">
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={!canRequest}
            className="h-11 w-full rounded-2xl bg-[#19A254] font-semibold text-white hover:bg-[#16a34a] disabled:opacity-60"
          >
            <ArrowDownToLine className="mr-2 size-4" />
            Request Withdrawal
          </Button>

          {!canRequest && (
            <p className="mt-2.5 text-center text-xs text-slate-400">
              You need at least{" "}
              <span className="font-semibold text-slate-500">
                {formatMoney(summary.minimumBalanceRequired, currency)}
              </span>{" "}
              available to withdraw {formatMoney(summary.minimumWithdrawalAmount, currency)} after the fee.
            </p>
          )}

          {canRequest && (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="size-3.5" /> Ready to withdraw
            </p>
          )}
        </div>
      </motion.div>

      <WithdrawalRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collectionId={collectionId}
        currency={currency}
        availableForWithdrawal={summary.availableForWithdrawal}
        onSuccess={onSuccess}
      />
    </>
  );
}
