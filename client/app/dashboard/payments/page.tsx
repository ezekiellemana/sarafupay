"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { api, getApiErrorMessage } from "@/lib/api";
import { usePayments } from "@/hooks/usePayments";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradientButton } from "@/components/shared/GradientButton";
import type { Payment } from "@/types";

type RetryPaymentResponse = {
  paymentUrl?: string;
  checkoutUrl?: string;
  checkout_url?: string;
  payment_url?: string;
};

export default function PaymentsPage() {
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (month) params.set("month", month);
    if (search) params.set("search", search);
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [status, month, search]);
  const { payments, loading, error } = usePayments(query);

  const retry = async (payment: Payment) => {
    try {
      const response = await api<RetryPaymentResponse>(`/api/payments/retry/${payment._id}`, { method: "POST" });
      const url = response.data.paymentUrl ?? response.data.checkoutUrl ?? response.data.checkout_url ?? response.data.payment_url;
      if (url) window.location.href = url;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to retry payment."));
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Wallet activity" title="Payment history" description="Filter by status, month, or reference." action={<a href="/payment/start"><GradientButton>Pay Contribution</GradientButton></a>} />
        <div className="grid gap-3 rounded-3xl border border-white/70 bg-white/75 p-4 shadow-xl shadow-slate-900/5 backdrop-blur md:grid-cols-4">
          <Input
            placeholder="Search reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-2xl"
          />
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-11 rounded-2xl"
          />
          <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
            <SelectTrigger className="h-11 w-full rounded-2xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectGroup>
                {[
                  { value: "all", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" },
                  { value: "failed", label: "Failed" },
                  { value: "expired", label: "Expired" },
                  { value: "cancelled", label: "Cancelled" },
                ].map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-11 rounded-2xl"
            onClick={() => { setSearch(""); setMonth(""); setStatus("all"); }}
          >
            Reset filters
          </Button>
        </div>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>} />}
        {!loading && !error && (payments.length ? <PaymentTable payments={payments as Payment[]} onRetry={retry} /> : <EmptyState title="No payments yet" description="Start by paying your monthly contribution." action={<a href="/payment/start"><GradientButton>Pay Contribution</GradientButton></a>} />)}
      </div>
    </DashboardShell>
  );
}
