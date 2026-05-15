"use client";

import { useEffect, useState } from "react";
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const path = `/api/admin/payments${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`;
    api<{ payments: Payment[] }>(path)
      .then((res) => {
        setPayments(res.data.payments);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load payments.")))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Payment operations" title="Payments" description="Filter and export contribution payments." action={<a href={`${apiUrl}/api/admin/export/payments`}><Button className="h-11 rounded-2xl bg-white/80" variant="outline">Export CSV</Button></a>} />
        <Input className="max-w-md" placeholder="Search member or reference" value={search} onChange={(event) => setSearch(event.target.value)} />
        {loading && <LoadingState label="Loading payments..." />}
        {error && <ErrorState message={error} action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>} />}
        {!loading && !error && (payments.length ? <AdminPaymentsTable payments={payments} /> : <EmptyState title="No payments found." description="Contribution payments will appear here after members start checkout." />)}
      </div>
    </DashboardShell>
  );
}
