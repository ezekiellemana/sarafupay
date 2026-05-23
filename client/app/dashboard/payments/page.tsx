"use client";

import { useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { GradientButton } from "@/components/shared/GradientButton";
import { api, apiUrl, getApiErrorMessage } from "@/lib/api";
import { usePayments } from "@/hooks/usePayments";
import { formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

type RetryPaymentResponse = {
  paymentUrl?: string;
  checkoutUrl?: string;
  checkout_url?: string;
  payment_url?: string;
};

const STATUS_OPTIONS = [
  { value: "all",       label: "All statuses" },
  { value: "completed", label: "Completed"    },
  { value: "pending",   label: "Pending"      },
  { value: "failed",    label: "Failed"       },
  { value: "expired",   label: "Expired"      },
  { value: "cancelled", label: "Cancelled"    },
];

export default function PaymentsPage() {
  const [status, setStatus] = useState("all");
  const [month,  setMonth]  = useState("");
  const [search, setSearch] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (month)  params.set("month",  month);
    if (search) params.set("search", search);
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [status, month, search]);

  const { payments, loading, error } = usePayments(query);

  const hasFilters = status !== "all" || month !== "" || search !== "";

  const totalCompleted = useMemo(
    () => payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const currency = payments[0]?.currency ?? "TZS";

  const reset = () => {
    setSearch("");
    setMonth("");
    setStatus("all");
  };

  const retry = async (payment: Payment) => {
    try {
      const response = await api<RetryPaymentResponse>(`/api/payments/retry/${payment._id}`, { method: "POST" });
      const url = response.data.paymentUrl ?? response.data.checkoutUrl ?? response.data.checkout_url ?? response.data.payment_url;
      if (url) window.location.href = url;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Unable to retry payment."));
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">Wallet activity</p>
            <h1 className="text-2xl font-extrabold text-[#071a0e] sm:text-3xl">Payment History</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {!loading && !error && payments.length > 0
                ? `${payments.length} payment${payments.length !== 1 ? "s" : ""} · ${formatMoney(totalCompleted, currency)} completed`
                : "Your contribution payment records."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-2xl text-muted-foreground"
              onClick={() => window.open(`${apiUrl}/api/payments/export/csv`, "_blank")}
              disabled={loading || payments.length === 0}
            >
              <Download className="size-3.5" /> Export CSV
            </Button>
            <a href="/payment/start">
              <GradientButton>Pay Contribution</GradientButton>
            </a>
          </div>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#e5e0d6] bg-white p-4 shadow-sm shadow-[#0a1f12]/4">
          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Search — full-width on mobile, flex-1 on desktop */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-2xl border-[#e5e0d6] bg-white pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#071a0e]"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Month + Status + Clear — side by side */}
            <div className="flex gap-2">
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-2xl border-[#e5e0d6] bg-white sm:w-40 sm:flex-none"
              />
              <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
                <SelectTrigger className="h-10 min-w-0 flex-1 rounded-2xl sm:w-40 sm:flex-none">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectGroup>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 shrink-0 gap-1 rounded-2xl px-3 text-muted-foreground hover:text-destructive"
                  onClick={reset}
                >
                  <X className="size-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── States ──────────────────────────────────────────────────── */}
        {loading && <LoadingState />}

        {error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        )}

        {!loading && !error && (
          payments.length > 0 ? (
            <PaymentTable payments={payments} onRetry={retry} />
          ) : hasFilters ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No payments match your filters."
              description="Try a different month, status, or search term."
              action={
                <Button variant="outline" className="gap-1.5 rounded-2xl" onClick={reset}>
                  <X className="size-4" /> Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No payments yet"
              description="Start by paying your monthly contribution."
              action={
                <a href="/payment/start">
                  <GradientButton>Pay Contribution</GradientButton>
                </a>
              }
            />
          )
        )}
      </div>
    </DashboardShell>
  );
}
