"use client";

import { useState } from "react";
import { Loader2, Banknote, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { collectionsApi } from "@/lib/collections";
import { formatMoney, formatDate } from "@/lib/formatters";
import { getApiErrorMessage } from "@/lib/api";
import type { WithdrawalRecord } from "@/types";

interface Props {
  collectionId: string;
  withdrawals: WithdrawalRecord[];
  currency: string;
  onSuccess: () => void;
}

function WithdrawalRow({
  w,
  collectionId,
  currency,
  onSuccess,
}: {
  w: WithdrawalRecord;
  collectionId: string;
  currency: string;
  onSuccess: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await collectionsApi.cancelWithdrawal(collectionId, w.id);
      toast.success("Withdrawal request cancelled.");
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to cancel withdrawal."));
    } finally {
      setCancelling(false);
    }
  };

  const destLabel = w.destinationType === "mobile_money" ? "Mobile Money" : "Bank Transfer";
  const DestIcon = w.destinationType === "mobile_money" ? Smartphone : Banknote;
  const maskedDest = w.destinationType === "mobile_money"
    ? w.maskedRecipientPhone
    : w.maskedBankAccountNumber;

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:gap-4">
      {/* Top row: status + amount */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={w.status} className="text-xs" />
          <span className="text-sm font-semibold text-[#071a0e]">
            {formatMoney(w.requestedAmount, w.currency ?? currency)} requested
          </span>
        </div>
        {w.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={cancelling}
            className="h-8 shrink-0 rounded-2xl border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"
          >
            {cancelling ? <Loader2 className="size-3 animate-spin" /> : "Cancel"}
          </Button>
        )}
      </div>

      {/* Fee breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Total deducted</p>
          <p className="font-semibold text-[#071a0e]">{formatMoney(w.totalDeducted, w.currency ?? currency)}</p>
        </div>
        <div>
          <p className="text-slate-400">You receive</p>
          <p className="font-semibold text-emerald-700">{formatMoney(w.ownerReceives, w.currency ?? currency)}</p>
        </div>
        <div>
          <p className="text-slate-400">Fee</p>
          <p className="font-medium text-amber-700">{formatMoney(w.withdrawalFee, w.currency ?? currency)}</p>
        </div>
      </div>

      {/* Destination */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <DestIcon className="size-3.5 shrink-0" />
        <span>{destLabel} · {w.recipientName}</span>
        {maskedDest && <span className="font-mono">{maskedDest}</span>}
        {w.bankName && <span>· {w.bankName}</span>}
      </div>

      {/* Dates */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>Requested: {formatDate(w.requestedAt)}</span>
        {w.approvedAt && <span>Approved: {formatDate(w.approvedAt)}</span>}
        {w.processingAt && <span>Processing: {formatDate(w.processingAt)}</span>}
        {w.paidAt && <span>Paid: {formatDate(w.paidAt)}</span>}
        {w.rejectedAt && <span>Rejected: {formatDate(w.rejectedAt)}</span>}
        {w.failedAt && <span>Failed: {formatDate(w.failedAt)}</span>}
        {w.cancelledAt && <span>Cancelled: {formatDate(w.cancelledAt)}</span>}
      </div>

      {/* Payout reference — only when paid */}
      {w.status === "paid" && w.payoutReference && (
        <p className="text-xs text-slate-500">
          Payout ref: <span className="font-mono font-medium">{w.payoutReference}</span>
        </p>
      )}

      {/* Rejection reason */}
      {w.rejectionReason && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          Rejection: {w.rejectionReason}
        </div>
      )}

      {/* Admin note */}
      {w.adminNote && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Note: {w.adminNote}
        </div>
      )}
    </div>
  );
}

export function WithdrawalHistoryList({ collectionId, withdrawals, currency, onSuccess }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <div className="border-b border-[#e5e0d6] px-5 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Withdrawal History
        </p>
      </div>

      {withdrawals.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-500">No withdrawal requests yet.</p>
          <p className="mt-1 text-xs text-slate-400">Your withdrawal history will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f5f2ed]">
          {withdrawals.map((w) => (
            <WithdrawalRow
              key={w.id}
              w={w}
              collectionId={collectionId}
              currency={currency}
              onSuccess={onSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}
