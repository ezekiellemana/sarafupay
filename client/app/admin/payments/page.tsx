"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { api, apiUrl, getApiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { PageHeader } from "@/components/shared/PageHeader";
import type { Payment } from "@/types";

const PAGE_LIMIT = 50;

type PaymentsResponse = {
  payments: Payment[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Use fetch with credentials so the auth cookie is sent correctly in both
      // same-origin (dev proxy) and cross-origin (production) deployments.
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

  // Reset to page 1 whenever the search query changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch whenever page or search changes. When search changes, the effect above
  // resets page to 1 first, which triggers this effect again at page 1.
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (debouncedSearch) params.set("search", debouncedSearch);

    api<PaymentsResponse>(`/api/admin/payments?${params}`)
      .then((res) => {
        setPayments(res.data.payments);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load payments.")))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Payment operations"
          title="Payments"
          description="Filter and export contribution payments."
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
        <Input
          className="max-w-md"
          placeholder="Search member or reference"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {loading && <LoadingState label="Loading payments..." />}
        {error && (
          <ErrorState
            message={error}
            action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>}
          />
        )}
        {!loading && !error && (
          payments.length ? (
            <>
              <AdminPaymentsTable payments={payments} />
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
          ) : (
            <EmptyState
              title="No payments found."
              description="Contribution payments will appear here after members start checkout."
            />
          )
        )}
      </div>
    </DashboardShell>
  );
}
