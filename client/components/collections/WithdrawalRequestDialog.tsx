"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { collectionsApi } from "@/lib/collections";
import { formatMoney } from "@/lib/formatters";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const WITHDRAWAL_FEE = 2_000;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  collectionId: string;
  currency: string;
  availableForWithdrawal: number;
  onSuccess: () => void;
}

type Dest = "mobile_money" | "bank";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

export function WithdrawalRequestDialog({
  open,
  onOpenChange,
  collectionId,
  currency,
  availableForWithdrawal,
  onSuccess,
}: Props) {
  const [amountStr, setAmountStr] = useState("");
  const [dest, setDest] = useState<Dest>("mobile_money");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ownerNote, setOwnerNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const requestedNum = parseInt(amountStr, 10);
  const validAmount = !isNaN(requestedNum) && requestedNum >= 1;
  const totalDeducted = validAmount ? requestedNum + WITHDRAWAL_FEE : null;
  const canAfford = totalDeducted !== null && totalDeducted <= availableForWithdrawal;

  function resetForm() {
    setAmountStr("");
    setDest("mobile_money");
    setRecipientName("");
    setRecipientPhone("");
    setBankName("");
    setBankAccount("");
    setOwnerNote("");
    setConfirmed(false);
    setErrors({});
  }

  function handleOpenChange(v: boolean) {
    if (!v) resetForm();
    onOpenChange(v);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const num = parseInt(amountStr, 10);

    if (isNaN(num) || num <= 0) {
      errs.amount = "Enter a valid whole-number TZS amount.";
    } else if (num < 10_000) {
      errs.amount = "Minimum withdrawal amount is TZS 10,000.";
    } else if (num + WITHDRAWAL_FEE > availableForWithdrawal) {
      errs.amount = `Total deducted (${formatMoney(num + WITHDRAWAL_FEE, currency)}) exceeds your available balance (${formatMoney(availableForWithdrawal, currency)}).`;
    }

    if (!recipientName.trim()) errs.recipientName = "Recipient name is required.";

    if (dest === "mobile_money") {
      if (!recipientPhone.trim()) errs.recipientPhone = "Phone number is required for mobile money.";
    } else {
      if (!bankName.trim()) errs.bankName = "Bank name is required.";
      if (!bankAccount.trim()) errs.bankAccount = "Account number is required.";
    }

    if (!confirmed) errs.confirmed = "Please confirm before submitting.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await collectionsApi.createWithdrawal(collectionId, {
        requestedAmount: parseInt(amountStr, 10),
        destinationType: dest,
        recipientName: recipientName.trim(),
        recipientPhone: dest === "mobile_money" ? recipientPhone.trim() : undefined,
        bankName: dest === "bank" ? bankName.trim() : undefined,
        bankAccountNumber: dest === "bank" ? bankAccount.trim() : undefined,
        ownerNote: ownerNote.trim() || undefined,
      });
      toast.success("Withdrawal request submitted successfully.");
      handleOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to submit withdrawal request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#071a0e]">Request Withdrawal</DialogTitle>
          <DialogDescription>
            Funds will be reviewed before payout. The TZS {WITHDRAWAL_FEE.toLocaleString()} service fee is deducted from your balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">

          {/* Amount */}
          <div>
            <FieldLabel>Amount to withdraw (TZS)</FieldLabel>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 50000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              min={10000}
              step={1}
              aria-invalid={!!errors.amount}
            />
            <FieldError msg={errors.amount} />
          </div>

          {/* Live breakdown */}
          {validAmount && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">You request</span>
                <span className="font-semibold text-[#071a0e]">{formatMoney(requestedNum, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Withdrawal fee</span>
                <span className="font-medium text-amber-700">{formatMoney(WITHDRAWAL_FEE, currency)}</span>
              </div>
              <div className="h-px bg-amber-200/60" />
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total deducted from balance</span>
                <span className={cn("font-semibold", canAfford ? "text-[#071a0e]" : "text-red-600")}>
                  {formatMoney(requestedNum + WITHDRAWAL_FEE, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#071a0e]">You will receive</span>
                <span className="text-[#035034]">{formatMoney(requestedNum, currency)}</span>
              </div>
              {!canAfford && totalDeducted !== null && (
                <p className="text-xs text-red-500 pt-0.5">
                  Exceeds available balance ({formatMoney(availableForWithdrawal, currency)}).
                </p>
              )}
            </div>
          )}

          {/* Destination type */}
          <div>
            <FieldLabel>Payout method</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {(["mobile_money", "bank"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDest(d)}
                  className={cn(
                    "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                    dest === d
                      ? "border-[#19A254] bg-emerald-50 text-[#19A254]"
                      : "border-[#e5e0d6] bg-white text-slate-500 hover:border-slate-300"
                  )}
                >
                  {d === "mobile_money" ? "Mobile Money" : "Bank Transfer"}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient name */}
          <div>
            <FieldLabel>Recipient name</FieldLabel>
            <Input
              placeholder="Full name on account"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              aria-invalid={!!errors.recipientName}
            />
            <FieldError msg={errors.recipientName} />
          </div>

          {/* Mobile money fields */}
          {dest === "mobile_money" && (
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <Input
                type="tel"
                placeholder="e.g. 0712345678"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                aria-invalid={!!errors.recipientPhone}
              />
              <FieldError msg={errors.recipientPhone} />
            </div>
          )}

          {/* Bank fields */}
          {dest === "bank" && (
            <>
              <div>
                <FieldLabel>Bank name</FieldLabel>
                <Input
                  placeholder="e.g. CRDB Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  aria-invalid={!!errors.bankName}
                />
                <FieldError msg={errors.bankName} />
              </div>
              <div>
                <FieldLabel>Account number</FieldLabel>
                <Input
                  placeholder="Account number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  aria-invalid={!!errors.bankAccount}
                />
                <FieldError msg={errors.bankAccount} />
              </div>
            </>
          )}

          {/* Owner note */}
          <div>
            <FieldLabel>Note (optional)</FieldLabel>
            <textarea
              placeholder="Any instructions for the team…"
              value={ownerNote}
              onChange={(e) => setOwnerNote(e.target.value)}
              maxLength={500}
              rows={2}
              className="h-auto w-full rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-sm shadow-sm shadow-slate-900/5 transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-primary/15 resize-none"
            />
          </div>

          {/* Confirmation */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[#19A254]"
              />
              <span className="text-sm text-slate-600">
                I confirm the destination details are correct. I understand the TZS 2,000 service fee will be deducted from my balance.
              </span>
            </label>
            <FieldError msg={errors.confirmed} />
          </div>

          <DialogFooter className="!mx-0 !-mb-5 gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-2xl border border-[#e5e0d6] bg-white px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-2xl bg-[#19A254] px-6 text-sm font-semibold text-white hover:bg-[#16a34a]"
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Submitting…</span>
              ) : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
