"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowDownToLine, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminWithdrawalDetail, AdminWithdrawalListItem } from "@/types";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-36 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="break-all text-sm font-medium text-[#071a0e]">{value ?? "—"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{children}</p>
  );
}

type ActionType = "approve" | "reject" | "processing" | "paid" | "failed" | null;

interface Props {
  item: AdminWithdrawalListItem | null;
  open: boolean;
  onClose: () => void;
  onActionSuccess: () => void;
}

export function WithdrawalDetailDrawer({ item, open, onClose, onActionSuccess }: Props) {
  const [detail, setDetail] = useState<AdminWithdrawalDetail | null>(null);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<ActionType>(null);
  const [actionInput, setActionInput] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);

  const withdrawalId = item?.id ?? null;
  const isLoading = Boolean(withdrawalId && loadedForId !== withdrawalId);

  useEffect(() => {
    if (!withdrawalId) return;
    api<AdminWithdrawalDetail>(`/api/admin/withdrawals/${withdrawalId}`)
      .then((res) => {
        setDetail(res.data);
        setError("");
        setLoadedForId(withdrawalId);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load withdrawal details."));
        setLoadedForId(withdrawalId);
      });
  }, [withdrawalId]);

  function closeAction() {
    setAction(null);
    setActionInput("");
    setActionNote("");
  }

  async function handleAction() {
    if (!withdrawalId) return;
    setActing(true);
    try {
      const url = `/api/admin/withdrawals/${withdrawalId}`;
      if (action === "approve") {
        await api(`${url}/approve`, { method: "PATCH", body: JSON.stringify({ adminNote: actionNote || undefined }) });
        toast.success("Withdrawal approved.");
      } else if (action === "reject") {
        if (!actionInput.trim()) { toast.error("Rejection reason is required."); setActing(false); return; }
        await api(`${url}/reject`, { method: "PATCH", body: JSON.stringify({ rejectionReason: actionInput }) });
        toast.success("Withdrawal rejected.");
      } else if (action === "processing") {
        await api(`${url}/mark-processing`, { method: "PATCH", body: "{}" });
        toast.success("Marked as processing.");
      } else if (action === "paid") {
        if (!actionInput.trim()) { toast.error("Payout reference is required."); setActing(false); return; }
        await api(`${url}/mark-paid`, { method: "PATCH", body: JSON.stringify({ payoutReference: actionInput, adminNote: actionNote || undefined }) });
        toast.success("Marked as paid.");
      } else if (action === "failed") {
        await api(`${url}/mark-failed`, { method: "PATCH", body: JSON.stringify({ adminNote: actionNote || undefined }) });
        toast.success("Marked as failed.");
      }
      closeAction();
      setLoadedForId(null); // force refetch of detail
      onActionSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Action failed."));
    } finally {
      setActing(false);
    }
  }

  const status = detail?.status ?? item?.status;

  function ActionButtons() {
    if (!status) return null;
    const canApprove     = status === "pending";
    const canReject      = status === "pending" || status === "approved";
    const canProcessing  = status === "approved";
    const canPaid        = status === "approved" || status === "processing";
    const canFailed      = status === "processing";

    if (!canApprove && !canReject && !canProcessing && !canPaid && !canFailed) {
      return (
        <p className="text-xs text-slate-400">
          This withdrawal is in a terminal state ({status}) — no further actions available.
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <Button size="sm" onClick={() => setAction("approve")} className="h-8 rounded-2xl bg-emerald-600 px-4 text-xs text-white hover:bg-emerald-700">
            Approve
          </Button>
        )}
        {canProcessing && (
          <Button size="sm" onClick={() => setAction("processing")} className="h-8 rounded-2xl bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700">
            Mark Processing
          </Button>
        )}
        {canPaid && (
          <Button size="sm" onClick={() => setAction("paid")} className="h-8 rounded-2xl bg-[#19A254] px-4 text-xs text-white hover:bg-[#16a34a]">
            Mark Paid
          </Button>
        )}
        {canFailed && (
          <Button size="sm" variant="outline" onClick={() => setAction("failed")} className="h-8 rounded-2xl border-red-200 px-4 text-xs text-red-600 hover:bg-red-50">
            Mark Failed
          </Button>
        )}
        {canReject && (
          <Button size="sm" variant="outline" onClick={() => setAction("reject")} className="h-8 rounded-2xl border-red-200 px-4 text-xs text-red-600 hover:bg-red-50">
            Reject
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="right" className="flex flex-col overflow-y-auto p-0 sm:max-w-lg">

          <SheetHeader className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
                <ArrowDownToLine className="size-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-bold text-[#071a0e]">
                  {item ? formatMoney(item.requestedAmount, item.currency) : "—"}
                </SheetTitle>
                <SheetDescription className="truncate text-xs">
                  {item?.ownerName ?? "—"} · {item?.collectionTitle ?? "—"}
                </SheetDescription>
              </div>
              {status && <StatusBadge status={status} className="shrink-0 text-xs" />}
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {isLoading && (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading details…</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!isLoading && !error && detail && (
              <>
                {/* Actions */}
                <section>
                  <SectionTitle>Admin Actions</SectionTitle>
                  <ActionButtons />
                </section>

                {/* Amounts */}
                <section>
                  <SectionTitle>Amounts</SectionTitle>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 px-5 py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Requested amount</span>
                      <span className="font-semibold text-[#071a0e]">{formatMoney(detail.requestedAmount, detail.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Withdrawal fee</span>
                      <span className="font-medium text-amber-700">{formatMoney(detail.withdrawalFee, detail.currency)}</span>
                    </div>
                    <div className="h-px bg-amber-200/50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total deducted</span>
                      <span className="font-semibold text-[#071a0e]">{formatMoney(detail.totalDeducted, detail.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[#071a0e]">Owner receives</span>
                      <span className="text-[#035034]">{formatMoney(detail.ownerReceives, detail.currency)}</span>
                    </div>
                    <div className="h-px bg-amber-200/50" />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Estimated provider fee</span>
                      <span>{formatMoney(detail.providerFee, detail.currency)}</span>
                    </div>
                  </div>
                </section>

                {/* Destination — full unmasked */}
                <section>
                  <SectionTitle>Destination</SectionTitle>
                  <div className="divide-y divide-slate-100">
                    <InfoRow label="Method" value={detail.destinationType === "mobile_money" ? "Mobile Money" : "Bank Transfer"} />
                    <InfoRow label="Recipient" value={detail.recipientName} />
                    {detail.recipientPhone && <InfoRow label="Phone" value={detail.recipientPhone} />}
                    {detail.bankName && <InfoRow label="Bank" value={detail.bankName} />}
                    {detail.bankAccountNumber && <InfoRow label="Account no." value={detail.bankAccountNumber} />}
                    {detail.ownerNote && <InfoRow label="Owner note" value={detail.ownerNote} />}
                  </div>
                </section>

                {/* Owner & Collection */}
                <section>
                  <SectionTitle>Owner</SectionTitle>
                  <div className="divide-y divide-slate-100">
                    <InfoRow label="Name" value={detail.owner.fullName} />
                    <InfoRow label="Email" value={detail.owner.email} />
                    {detail.owner.phoneNumber && <InfoRow label="Phone" value={detail.owner.phoneNumber} />}
                    <InfoRow label="Collection" value={detail.collection.title} />
                  </div>
                </section>

                {/* Live balance */}
                <section>
                  <SectionTitle>Live Balance</SectionTitle>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Completed contributions</span>
                      <span className="font-medium">{formatMoney(detail.liveBalance.completedContributions, detail.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reserved (locked)</span>
                      <span className="font-medium text-amber-700">{formatMoney(detail.liveBalance.lockedWithdrawals, detail.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paid out</span>
                      <span className="font-medium text-slate-400">{formatMoney(detail.liveBalance.paidWithdrawals, detail.currency)}</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between font-bold">
                      <span className="text-[#071a0e]">Available now</span>
                      <span className="text-emerald-700">{formatMoney(detail.liveBalance.availableForWithdrawal, detail.currency)}</span>
                    </div>
                  </div>
                </section>

                {/* Admin metadata */}
                {(detail.adminNote || detail.rejectionReason || detail.payoutReference) && (
                  <section>
                    <SectionTitle>Admin Notes</SectionTitle>
                    <div className="divide-y divide-slate-100">
                      {detail.adminNote && <InfoRow label="Note" value={detail.adminNote} />}
                      {detail.rejectionReason && (
                        <InfoRow
                          label="Rejection"
                          value={<span className="text-red-600">{detail.rejectionReason}</span>}
                        />
                      )}
                      {detail.payoutReference && <InfoRow label="Payout ref" value={<span className="font-mono">{detail.payoutReference}</span>} />}
                    </div>
                    <div className="mt-2 divide-y divide-slate-100">
                      {detail.approvedBy && <InfoRow label="Approved by" value={detail.approvedBy} />}
                      {detail.rejectedBy && <InfoRow label="Rejected by" value={detail.rejectedBy} />}
                      {detail.paidBy && <InfoRow label="Paid by" value={detail.paidBy} />}
                    </div>
                  </section>
                )}

                {/* Timeline */}
                <section>
                  <SectionTitle>Timeline</SectionTitle>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <TimelineRow icon={<Clock className="size-3.5" />} label="Requested" date={detail.requestedAt} />
                    {detail.approvedAt   && <TimelineRow icon={<CheckCircle2 className="size-3.5 text-blue-500" />}    label="Approved"   date={detail.approvedAt} />}
                    {detail.processingAt && <TimelineRow icon={<Clock className="size-3.5 text-indigo-500" />}          label="Processing" date={detail.processingAt} />}
                    {detail.paidAt       && <TimelineRow icon={<CheckCircle2 className="size-3.5 text-emerald-500" />}  label="Paid"       date={detail.paidAt} />}
                    {detail.rejectedAt   && <TimelineRow icon={<XCircle className="size-3.5 text-red-500" />}           label="Rejected"   date={detail.rejectedAt} />}
                    {detail.failedAt     && <TimelineRow icon={<XCircle className="size-3.5 text-red-500" />}           label="Failed"     date={detail.failedAt} />}
                    {detail.cancelledAt  && <TimelineRow icon={<XCircle className="size-3.5 text-slate-400" />}         label="Cancelled"  date={detail.cancelledAt} />}
                  </div>
                </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Action dialog */}
      <Dialog open={action !== null} onOpenChange={(o) => { if (!o) closeAction(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#071a0e]">
              {action === "approve"    ? "Approve Withdrawal"
               : action === "reject"  ? "Reject Withdrawal"
               : action === "processing" ? "Mark as Processing?"
               : action === "paid"    ? "Mark as Paid"
               : action === "failed"  ? "Mark as Failed"
               : ""}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"    ? "Withdrawal will move to 'approved' status. You can optionally leave a note."
               : action === "reject"  ? "Provide a reason — this will be shown to the collection owner."
               : action === "processing" ? "This will mark the withdrawal as being actively processed."
               : action === "paid"    ? "Provide the payout reference to confirm payment was sent."
               : action === "failed"  ? "Mark this withdrawal as failed. The balance reservation will be released."
               : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-1">
            {action === "reject" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rejection reason *
                </label>
                <textarea
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  rows={3}
                  placeholder="Explain why this withdrawal is rejected…"
                  className="w-full rounded-2xl border border-white/70 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 resize-none"
                />
              </div>
            )}
            {action === "paid" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payout reference *
                </label>
                <Input
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder="e.g. TXN-20240528-001"
                />
              </div>
            )}
            {(action === "approve" || action === "paid" || action === "failed") && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Admin note (optional)
                </label>
                <Input
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Internal note…"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={closeAction}
              className="h-10 rounded-2xl border border-[#e5e0d6] bg-white px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button
              onClick={handleAction}
              disabled={acting}
              className={
                action === "reject" || action === "failed"
                  ? "h-10 rounded-2xl bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700"
                  : "h-10 rounded-2xl bg-[#19A254] px-6 text-sm font-semibold text-white hover:bg-[#16a34a]"
              }
            >
              {acting ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TimelineRow({ icon, label, date }: { icon: React.ReactNode; label: string; date: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium text-[#071a0e]">{label}:</span>
      <span>{formatDate(date)}</span>
    </div>
  );
}
