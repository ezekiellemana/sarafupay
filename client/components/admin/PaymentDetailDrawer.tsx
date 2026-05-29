"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/formatters";
import { Check, Copy, CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { AdminPaymentDetail, Payment } from "@/types";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="break-all text-sm font-medium text-[#071a0e]">{value ?? "—"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </p>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      title="Copy"
      className="ml-1.5 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
    >
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
    </button>
  );
}

interface PaymentDetailDrawerProps {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}

export function PaymentDetailDrawer({ payment, open, onClose }: PaymentDetailDrawerProps) {
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null);
  const [error, setError] = useState("");
  const [loadedForId, setLoadedForId] = useState<string | null>(null);

  const paymentId = payment?._id ?? null;
  const isLoading = Boolean(paymentId && loadedForId !== paymentId);

  useEffect(() => {
    if (!paymentId) return;
    api<AdminPaymentDetail>(`/api/admin/payments/${paymentId}`)
      .then((res) => {
        setDetail(res.data);
        setError("");
        setLoadedForId(paymentId);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load payment details."));
        setLoadedForId(paymentId);
      });
  }, [paymentId]);

  const displayAmount = detail
    ? formatMoney(detail.amount, detail.currency)
    : payment
      ? formatMoney(payment.amount, payment.currency)
      : "—";

  const displayStatus = detail?.status ?? payment?.status ?? "pending";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto p-0 sm:max-w-md">

        {/* Header */}
        <SheetHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
              <CreditCard className="size-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-bold text-[#071a0e]">
                {displayAmount}
              </SheetTitle>
              <SheetDescription className="truncate text-xs">
                {payment?.snippeReference ?? payment?.externalReference ?? "—"}
              </SheetDescription>
            </div>
            <StatusBadge status={displayStatus} className="shrink-0 text-xs" />
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">

          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading payment details…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && detail && (
            <>
              {/* References */}
              <section>
                <SectionTitle>References</SectionTitle>
                <div className="divide-y divide-slate-100">
                  <InfoRow label="Snippe ref" value={
                    <span className="flex items-center">
                      <span>{detail.snippeReference ?? "—"}</span>
                      {detail.snippeReference && <CopyBtn value={detail.snippeReference} />}
                    </span>
                  } />
                  <InfoRow label="External ref" value={
                    <span className="flex items-center">
                      <span>{detail.externalReference}</span>
                      {detail.externalReference && <CopyBtn value={detail.externalReference} />}
                    </span>
                  } />
                  <InfoRow label="Month" value={detail.monthPaidFor} />
                  <InfoRow label="Method" value={detail.paymentMethod ?? "—"} />
                  <InfoRow
                    label="Webhook"
                    value={
                      detail.webhookReceived ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="size-3.5" /> Received
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <XCircle className="size-3.5" /> Not received
                        </span>
                      )
                    }
                  />
                </div>
              </section>

              {/* Payer */}
              <section>
                <SectionTitle>Payer</SectionTitle>
                <div className="divide-y divide-slate-50">
                  <InfoRow
                    label="Name"
                    value={detail.payer?.fullName ?? detail.customerName ?? "—"}
                  />
                  <InfoRow
                    label="Email"
                    value={detail.payer?.email ?? detail.customerEmail ?? "—"}
                  />
                  <InfoRow
                    label="Phone"
                    value={detail.payer?.phoneNumber ?? detail.customerPhone ?? "—"}
                  />
                  {detail.payerMessage && (
                    <InfoRow label="Message" value={detail.payerMessage} />
                  )}
                </div>
              </section>

              {/* Collection */}
              <section>
                <SectionTitle>Collection</SectionTitle>
                <div className="divide-y divide-slate-50">
                  <InfoRow label="Title" value={detail.collection?.title ?? "—"} />
                  <InfoRow
                    label="Slug"
                    value={detail.collection?.slug ? `/${detail.collection.slug}` : "—"}
                  />
                  <InfoRow
                    label="Owner"
                    value={
                      detail.collectionOwner
                        ? `${detail.collectionOwner.fullName} (${detail.collectionOwner.email})`
                        : "—"
                    }
                  />
                </div>
              </section>

              {/* Dates */}
              <section>
                <SectionTitle>Dates</SectionTitle>
                <div className="divide-y divide-slate-50">
                  <InfoRow label="Created" value={formatDate(detail.createdAt)} />
                  <InfoRow
                    label="Paid at"
                    value={detail.paidAt ? formatDate(detail.paidAt) : "—"}
                  />
                </div>
              </section>

              {/* Fee Accounting — admin only, feeVersion >= 1 */}
              {(detail.feeVersion ?? 0) >= 1 ? (
                <section>
                  <SectionTitle>Fee Accounting</SectionTitle>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 px-5 py-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Contribution amount</span>
                      <span className="font-medium text-[#071a0e]">{formatMoney(detail.contributionAmount, detail.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Service fee</span>
                      <span className="font-medium text-amber-700">{formatMoney(detail.serviceFee, detail.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Total charged to payer</span>
                      <span className="font-medium text-[#071a0e]">{formatMoney(detail.totalChargedAmount ?? detail.amount, detail.currency)}</span>
                    </div>
                    <div className="h-px bg-amber-200/50" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Provider cost</span>
                      <span className="font-medium text-slate-500">{formatMoney(detail.providerFee, detail.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-[#071a0e]">Net platform revenue</span>
                      <span className="text-[#035034]">{formatMoney(detail.serviceFee - detail.providerFee, detail.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                      <span>Channel · v{detail.feeVersion}</span>
                      <span className="capitalize">{(detail.paymentChannel ?? "unknown").replace("_", " ")}</span>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Amount */}
              <section>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-5">
                  <p className="text-xs font-semibold text-slate-500">Amount</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {formatMoney(detail.amount, detail.currency)}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
