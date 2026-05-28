"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  ArrowDownToLine,
  CheckCircle2,
  Banknote,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WithdrawalDetailDrawer } from "@/components/admin/WithdrawalDetailDrawer";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/formatters";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import type { AdminWithdrawalListItem, AdminWithdrawalSummary } from "@/types";

const PAGE_LIMIT = 20;

type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "failed"
  | "cancelled";

const STATUS_FILTERS: StatusFilter[] = [
  "all", "pending", "approved", "processing", "paid", "rejected", "failed", "cancelled",
];

type WithdrawalsResponse = {
  withdrawals: AdminWithdrawalListItem[];
  total: number;
  page: number;
  totalPages: number;
  summary: AdminWithdrawalSummary;
};

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: "amber" | "blue" | "green" | "slate";
}) {
  const styles = {
    amber: { card: "border-amber-200 bg-amber-50",   icon: "bg-amber-100 text-amber-700",   strip: "bg-amber-400" },
    blue:  { card: "border-blue-200 bg-blue-50",     icon: "bg-blue-100 text-blue-700",     strip: "bg-blue-500" },
    green: { card: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-100 text-emerald-700", strip: "bg-emerald-500" },
    slate: { card: "border-slate-200 bg-slate-50",   icon: "bg-slate-100 text-slate-600",   strip: "bg-slate-400" },
  }[accent];

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border shadow-sm shadow-[#0a1f12]/4", styles.card)}>
      <div className={cn("absolute inset-y-0 left-0 w-1 rounded-l-2xl", styles.strip)} />
      <div className="flex items-center gap-3 px-5 py-4">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl font-extrabold text-[#071a0e]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function WithdrawalCard({
  w,
  onView,
}: {
  w: AdminWithdrawalListItem;
  onView: () => void;
}) {
  const dest = w.destinationType === "mobile_money"
    ? (w.maskedRecipientPhone ?? "—")
    : (w.maskedBankAccountNumber ?? "—");

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-2xl border border-[#e5e0d6] bg-white p-4 text-left shadow-sm shadow-[#0a1f12]/4 transition-all hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#071a0e]">
            {formatMoney(w.requestedAmount, w.currency)}
          </p>
          <p className="text-xs text-slate-500">{w.ownerName} · {w.collectionTitle}</p>
        </div>
        <StatusBadge status={w.status} className="text-xs" />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>Total deducted: {formatMoney(w.totalDeducted, w.currency)}</span>
        <span className="capitalize">{w.destinationType.replace("_", " ")} · {dest}</span>
        <span>{formatDate(w.requestedAt)}</span>
        {w.paidAt && <span className="text-emerald-600">Paid {formatDate(w.paidAt)}</span>}
      </div>
    </button>
  );
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalListItem[]>([]);
  const [kpiSummary, setKpiSummary] = useState<AdminWithdrawalSummary | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AdminWithdrawalListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    api<WithdrawalsResponse>(`/api/admin/withdrawals?${params}`)
      .then((res) => {
        setWithdrawals(res.data.withdrawals);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
        setKpiSummary(res.data.summary);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load withdrawals.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, page]);

  function handleStatusFilter(f: StatusFilter) {
    setStatusFilter(f);
    setPage(1);
  }

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Finance operations"
          title="Withdrawals"
          description="Review, approve, and process collection owner withdrawal requests."
        />

        {/* KPI cards */}
        {kpiSummary && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <KpiCard
                label="Pending"
                value={kpiSummary.pendingCount}
                icon={<Clock className="size-4" />}
                accent="amber"
              />
              <KpiCard
                label="In Progress"
                value={kpiSummary.activeCount}
                icon={<ArrowDownToLine className="size-4" />}
                accent="blue"
              />
              <KpiCard
                label="Paid"
                value={kpiSummary.paidCount}
                icon={<CheckCircle2 className="size-4" />}
                accent="green"
              />
              <KpiCard
                label="Total Requested"
                value={formatMoney(kpiSummary.totalRequested)}
                icon={<Banknote className="size-4" />}
                accent="slate"
              />
            </div>

            {kpiSummary.paidCount > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <KpiCard
                    label="Paid Volume"
                    value={formatMoney(kpiSummary.paidVolume)}
                    icon={<ArrowDownToLine className="size-4" />}
                    accent="green"
                  />
                  <KpiCard
                    label="Fees Collected"
                    value={formatMoney(kpiSummary.feesCollected)}
                    icon={<Banknote className="size-4" />}
                    accent="amber"
                  />
                  <KpiCard
                    label="Provider Costs"
                    value={formatMoney(kpiSummary.providerCosts)}
                    icon={<Receipt className="size-4" />}
                    accent="slate"
                  />
                  <KpiCard
                    label="Net Margin"
                    value={formatMoney(kpiSummary.netMargin)}
                    icon={<TrendingUp className="size-4" />}
                    accent="green"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Paid withdrawals only.</p>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <Input
            placeholder="Search owner name, email, or collection…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />

          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleStatusFilter(f)}
                className={cn(
                  "h-7 rounded-full px-3 text-xs font-semibold capitalize transition-colors",
                  statusFilter === f
                    ? "bg-[#071a0e] text-white"
                    : "border border-[#e5e0d6] bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 w-40 text-xs"
            />
            <span className="self-center text-xs text-slate-400">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 w-40 text-xs"
            />
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                className="text-xs text-slate-400 underline hover:text-slate-600"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading withdrawals…</div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-xs text-slate-400">
              {total} withdrawal{total !== 1 ? "s" : ""} found
            </p>

            {withdrawals.length === 0 ? (
              <div className="rounded-2xl border border-[#e5e0d6] bg-white px-6 py-12 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-500">No withdrawals match your filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {withdrawals.map((w) => (
                  <WithdrawalCard
                    key={w.id}
                    w={w}
                    onView={() => setSelected(w)}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-2xl"
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-2xl"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <WithdrawalDetailDrawer
        item={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onActionSuccess={() => {
          setSelected(null);
          load();
        }}
      />
    </DashboardShell>
  );
}
