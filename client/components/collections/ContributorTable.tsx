"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

export function ContributorTable({ payments }: { payments: Payment[] }) {
  const [search, setSearch] = useState("");

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.customerName?.toLowerCase().includes(q) ||
      p.customerPhone?.toLowerCase().includes(q) ||
      p.customerEmail?.toLowerCase().includes(q) ||
      p.snippeReference?.toLowerCase().includes(q) ||
      p.externalReference.toLowerCase().includes(q)
    );
  });

  if (!payments.length) {
    return <EmptyState title="No contributors yet." description="Share your payment link to start collecting." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or reference..."
          className="pl-9 rounded-2xl border-white/70 bg-white/80 backdrop-blur-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/60 bg-slate-50/70">
              {["Payer", "Phone", "Amount", "Status", "Message", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <motion.tr
                key={p._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-slate-100/60 hover:bg-green-50/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[#071a0e]">{p.customerName ?? "—"}</p>
                  {p.customerEmail && <p className="text-xs text-muted-foreground">{p.customerEmail}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.customerPhone ?? "—"}</td>
                <td className="px-4 py-3 font-semibold text-[#16a34a]">
                  {formatMoney(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                <td className="px-4 py-3 max-w-[160px] truncate text-muted-foreground">{p.payerMessage ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(p.createdAt)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">No results for &quot;{search}&quot;</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((p) => (
          <div key={p._id} className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#071a0e]">{p.customerName ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{p.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#16a34a]">{formatMoney(p.amount, p.currency)}</p>
                <PaymentStatusBadge status={p.status} />
              </div>
            </div>
            {p.payerMessage && <p className="mt-2 text-xs text-muted-foreground italic">&ldquo;{p.payerMessage}&rdquo;</p>}
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
          </div>
        ))}
        {!filtered.length && <p className="text-center text-sm text-muted-foreground py-4">No results for &quot;{search}&quot;</p>}
      </div>
    </div>
  );
}
