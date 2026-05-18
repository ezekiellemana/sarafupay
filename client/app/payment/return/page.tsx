"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Clock3, Copy, Printer } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { SuccessAnimation } from "@/components/shared/SuccessAnimation";
import { GradientButton } from "@/components/shared/GradientButton";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Collection, Payment, PaymentStatus } from "@/types";

type VerifyResponse = { status: PaymentStatus; reference: string; payment: Payment };

function ReceiptRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-right font-medium text-[#071a0e] ${mono ? "break-all font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function PaymentReturnContent() {
  const params = useSearchParams();
  const { user, hydrated } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [message, setMessage] = useState("Your payment is being verified securely.");
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);
  const reference = useMemo(
    () => params.get("reference") ?? params.get("payment_reference") ?? params.get("session_id") ?? params.get("transaction_id") ?? "",
    [params]
  );

  useEffect(() => {
    if (!reference) return;
    api<VerifyResponse>(`/api/payments/verify/${reference}`)
      .then((res) => {
        setStatus(res.data.status);
        setPayment(res.data.payment ?? null);
        if (res.data.status === "completed") {
          setMessage("Payment completed successfully. Your contribution has been recorded.");
          const project = res.data.payment?.projectId as { thankYouMessage?: string } | undefined;
          if (project?.thankYouMessage) setThankYouMessage(project.thankYouMessage);
        }
        if (res.data.status === "failed") setMessage("Payment failed. Please try again.");
        if (res.data.status === "pending") setMessage("Payment is still pending. We'll update your dashboard once confirmed.");
      })
      .catch(() => setMessage("Payment is being checked. Webhook confirmation may still be pending."));
  }, [reference]);

  const collectionTitle = payment?.projectId && typeof payment.projectId === "object"
    ? (payment.projectId as Pick<Collection, "title">).title
    : undefined;
  const paymentRef = payment?.snippeReference ?? payment?.externalReference ?? reference;

  const copyRef = () => {
    navigator.clipboard.writeText(paymentRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const state = status === "completed" ? "success" : status === "failed" ? "failed" : "pending";
  const isSuccess = state === "success";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* Decorative backgrounds — hidden on print */}
      <div className="print:hidden">
        <FloatingBlobBackground />
      </div>
      <div className="flex w-full max-w-lg flex-col gap-4">
        {/* Status card — hidden on print, receipt below takes over */}
        <Card className="glass-premium relative overflow-hidden border-0 text-center shadow-2xl shadow-slate-900/10 print:hidden">

          <CardHeader className="relative gap-4">
            <SuccessAnimation state={state} />
            <CardTitle className={`pt-2 text-2xl font-bold ${isSuccess ? "sarafu-gradient-text-gold" : "text-[#0B1F3A]"}`}>
              {status === "completed" ? "Payment completed!" : status === "failed" ? "Payment failed" : "Checking your payment..."}
            </CardTitle>
          </CardHeader>

          <CardContent className="relative flex flex-col items-center gap-4">
            <div><PaymentStatusBadge status={status} /></div>
            <p className="text-muted-foreground">{message}</p>

            {thankYouMessage && (
              <div className="w-full rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 backdrop-blur-sm">
                {thankYouMessage}
              </div>
            )}

            {!hydrated || !user ? (
              <div className="w-full rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">Login or create an account to view your contribution dashboard.</p>
                <div className="mt-3 flex justify-center gap-2">
                  <Link href="/login?next=/dashboard">
                    <Button className="rounded-2xl bg-[#0B1F3A] text-white">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="rounded-2xl">Create Account</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Link href="/dashboard">
                <GradientButton btnVariant={isSuccess ? "gold" : "default"}>Open Dashboard</GradientButton>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Receipt — visible on screen and on print */}
        {isSuccess && payment && (
          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 print:rounded-none print:border-0 print:shadow-none">
            {/* Receipt header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <BrandLogo variant="light" height={28} />
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Receipt</span>
              </div>
            </div>

            {/* Prominent amount */}
            <div className="bg-slate-50/60 px-6 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount paid</p>
              <p className="mt-1.5 text-4xl font-bold text-[#071a0e]">{formatMoney(payment.amount, payment.currency)}</p>
            </div>

            <div className="border-t border-dashed border-slate-200" />

            {/* Receipt rows */}
            <div className="divide-y divide-slate-100 px-6">
              <ReceiptRow label="Status" value={<PaymentStatusBadge status={status} />} />
              {payment.customerName && <ReceiptRow label="Payer" value={payment.customerName} />}
              {collectionTitle && <ReceiptRow label="Collection" value={collectionTitle} />}
              <ReceiptRow label="Date" value={formatDate(payment.createdAt)} />

              {/* Reference row with copy button */}
              <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
                <span className="shrink-0 text-muted-foreground">Reference</span>
                <div className="flex items-center gap-1.5">
                  <span className="break-all font-mono text-xs font-medium text-[#071a0e]">{paymentRef}</span>
                  <button
                    type="button"
                    onClick={copyRef}
                    title="Copy reference"
                    className="print:hidden shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-[#071a0e]"
                  >
                    {copied
                      ? <Check className="size-3 text-[#16a34a]" />
                      : <Copy className="size-3" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200" />

            <p className="px-6 py-4 text-center text-xs text-muted-foreground">
              Payment processed securely through Snippe · SarafuPay
            </p>
          </div>
        )}

        {/* Print button — hidden on print */}
        {isSuccess && payment && (
          <div className="flex justify-center print:hidden">
            <Button
              variant="outline"
              className="h-11 gap-2 rounded-2xl border-white/70 bg-white/80 px-6 backdrop-blur-sm hover:bg-white"
              onClick={() => window.print()}
            >
              <Printer className="size-4" /> Print / Save as PDF
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-4 py-10">
          <Card className="w-full max-w-lg sarafu-glass border-0 shadow-2xl">
            <CardHeader>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Clock3 />
              </div>
              <CardTitle className="pt-2">Checking your payment...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your payment is being verified securely.</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
