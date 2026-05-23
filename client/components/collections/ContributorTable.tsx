"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Payment, PaymentStatus } from "@/types";

const STATUS_OPTIONS: { value: "all" | PaymentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" }
];

export function ContributorTable({ payments, emptyAction }: { payments: Payment[]; emptyAction?: ReactNode }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || amountMin || amountMax;

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const filtered = useMemo(() => payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.customerName?.toLowerCase().includes(q) ||
      p.customerPhone?.toLowerCase().includes(q) ||
      p.customerEmail?.toLowerCase().includes(q) ||
      p.snippeReference?.toLowerCase().includes(q) ||
      p.externalReference.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    const paymentDate = new Date(p.createdAt);
    const matchesDateFrom = !dateFrom || paymentDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || paymentDate <= new Date(`${dateTo}T23:59:59`);

    const matchesAmountMin = !amountMin || p.amount >= Number(amountMin);
    const matchesAmountMax = !amountMax || p.amount <= Number(amountMax);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
  }), [payments, search, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

  if (!payments.length) {
    return (
      <EmptyState
        title="No contributors yet."
        description="Share your payment link to start collecting."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email or reference…"
            className="pl-9 rounded-2xl border-[#e5e0d6] bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-2xl gap-1.5 ${hasActiveFilters ? "border-[#16a34a] text-[#16a34a]" : ""}`}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {showAdvanced ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>
      </div>

      {/* Status pills */}
      <div className="flex overflow-x-auto gap-2 pb-0.5">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === value
                ? "bg-[#16a34a] text-white"
                : "border border-[#e5e0d6] bg-white text-muted-foreground hover:border-[#16a34a]/50 hover:text-[#071a0e]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Advanced filters (date + amount) */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[#e5e0d6] bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Date from</Label>
                  <Input type="date" className="rounded-xl text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Date to</Label>
                  <Input type="date" className="rounded-xl text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Min amount</Label>
                  <Input type="number" placeholder="e.g. 1000" className="rounded-xl text-sm" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Max amount</Label>
                  <Input type="number" placeholder="e.g. 50000" className="rounded-xl text-sm" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
                </div>
              </div>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="mt-3 text-xs text-muted-foreground underline hover:text-destructive">
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-[#071a0e]">{filtered.length}</span>
        {" "}of{" "}
        <span className="font-medium text-[#071a0e]">{payments.length}</span>
        {" "}payments
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="ml-2 text-xs text-[#16a34a] underline hover:text-[#15803d]">
            Clear filters
          </button>
        )}
      </p>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e0d6] bg-[#faf7f2]">
              {["Payer", "Phone", "Amount", "Status", "Message", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p._id}
                className="border-b border-[#e5e0d6] hover:bg-green-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[#071a0e]">{p.customerName ?? "—"}</p>
                  {p.customerEmail && <p className="text-xs text-muted-foreground">{p.customerEmail}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.customerPhone ?? "—"}</td>
                <td className="px-4 py-3 font-semibold text-[#16a34a]">{formatMoney(p.amount, p.currency)}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                <td className="px-4 py-3 max-w-40 truncate text-muted-foreground">{p.payerMessage ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">No payments match your filters.</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((p) => (
          <div key={p._id} className="rounded-2xl border border-[#e5e0d6] bg-white p-4 shadow-sm shadow-[#0a1f12]/4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#071a0e]">{p.customerName ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{p.customerPhone ?? "—"}</p>
                {p.customerEmail && <p className="text-xs text-muted-foreground">{p.customerEmail}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-[#16a34a]">{formatMoney(p.amount, p.currency)}</p>
                <div className="mt-1"><PaymentStatusBadge status={p.status} /></div>
              </div>
            </div>
            {p.payerMessage && (
              <p className="mt-2 text-xs text-muted-foreground italic">&ldquo;{p.payerMessage}&rdquo;</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDate(p.createdAt)}</span>
              {(p.snippeReference || p.externalReference) && (
                <span className="font-mono">Ref: {p.snippeReference ?? p.externalReference}</span>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && (
          <p className="py-4 text-center text-sm text-muted-foreground">No payments match your filters.</p>
        )}
      </div>
    </div>
  );
}
