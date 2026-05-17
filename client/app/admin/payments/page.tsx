"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable";
import { PaymentDetailDrawer } from "@/components/admin/PaymentDetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { api, apiUrl, getApiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import type { Payment } from "@/types";

const PAGE_LIMIT = 50;

type StatusFilter = "all" | "completed" | "pending" | "failed" | "expired" | "cancelled";

const STATUS_FILTERS: StatusFilter[] = ["all", "completed", "pending", "failed", "expired", "cancelled"];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
};

type PaymentsResponse = {
  payments: Payment[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const debouncedAmountMin = useDebouncedValue(amountMin, 600);
  const debouncedAmountMax = useDebouncedValue(amountMax, 600);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/export/payments`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed — check that you are still logged in as admin.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "sarafupay-payments.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to export payments.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (debouncedAmountMin) params.set("amountMin", debouncedAmountMin);
      if (debouncedAmountMax) params.set("amountMax", debouncedAmountMax);

      api<PaymentsResponse>(`/api/admin/payments?${params}`)
        .then((res) => {
          setPayments(res.data.payments);
          setTotalPages(res.data.totalPages);
          setTotal(res.data.total);
          setError("");
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(getApiErrorMessage(err, "Unable to load payments."));
          setLoading(false);
        });
    }
    load();
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, debouncedAmountMin, debouncedAmountMax, page]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    if (page !== 1) setPage(1);
  };

  const handleStatusFilter = (f: StatusFilter) => {
    setStatusFilter(f);
    setPage(1);
  };

  const handleDateFrom = (v: string) => {
    setDateFrom(v);
    setPage(1);
  };

  const handleDateTo = (v: string) => {
    setDateTo(v);
    setPage(1);
  };

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Payment operations"
          title="Payments"
          description="Filter, inspect, and export platform payments."
          action={
            <Button
              className="h-11 rounded-2xl bg-white/80"
              variant="outline"
              disabled={exporting}
              onClick={handleExport}
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          }
        />

        {/* Search row */}
        <Input
          className="max-w-md"
          placeholder="Search by payer, reference, or collection title"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleStatusFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === f
                  ? "bg-[#0B1F3A] text-white"
                  : "bg-white text-muted-foreground ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Date + amount range row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">From</span>
            <Input
              type="date"
              className="h-9 w-40 text-xs"
              value={dateFrom}
              onChange={(e) => handleDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">To</span>
            <Input
              type="date"
              className="h-9 w-40 text-xs"
              value={dateTo}
              onChange={(e) => handleDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Min</span>
            <Input
              type="number"
              placeholder="0"
              className="h-9 w-28 text-xs"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Max</span>
            <Input
              type="number"
              placeholder="∞"
              className="h-9 w-28 text-xs"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
            />
          </div>
          {(dateFrom || dateTo || amountMin || amountMax) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setAmountMin("");
                setAmountMax("");
                setPage(1);
              }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {loading && <LoadingState label="Loading payments…" />}
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
        {!loading && !error && payments.length === 0 && (
          <EmptyState
            icon={<CreditCard />}
            title="No payments found."
            description="Try adjusting your search or filters."
          />
        )}
        {!loading && !error && payments.length > 0 && (
          <>
            <AdminPaymentsTable payments={payments} onView={(p) => setSelected(p)} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{total.toLocaleString()} payment{total !== 1 ? "s" : ""} total</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-8 rounded-xl px-3 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </Button>
                <span className="tabular-nums">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  className="h-8 rounded-xl px-3 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment detail drawer — always mounted for smooth animation */}
      <PaymentDetailDrawer
        payment={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </DashboardShell>
  );
}
