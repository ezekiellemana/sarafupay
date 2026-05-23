"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters";
import type { Payment, PaymentStatus } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatMonthPaidFor(monthStr: string): string {
  const parts = monthStr.split("-");
  if (parts.length === 2 && parts[0].length === 4) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1).toLocaleString("en", {
      month: "long",
      year: "numeric",
    });
  }
  return monthStr;
}

function StatusIcon({ status }: { status: PaymentStatus }) {
  if (status === "completed") return <CheckCircle2 className="size-4 shrink-0" />;
  if (status === "pending")   return <Clock3 className="size-4 shrink-0" />;
  return <XCircle className="size-4 shrink-0" />;
}

export function ActivityFeed({ payments }: { payments: Payment[] }) {
  if (!payments.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-bold text-[#071a0e]">Recent Payments</p>
        <Link href="/dashboard/payments">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-xl text-xs text-[#16a34a] hover:bg-green-50 hover:text-[#16a34a]"
          >
            View all <ArrowRight className="size-3" />
          </Button>
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {payments.slice(0, 5).map((p) => {
          const isCompleted = p.status === "completed";
          const collectionTitle =
            p.projectId && typeof p.projectId === "object" && "title" in p.projectId
              ? (p.projectId as { title: string }).title
              : null;
          return (
            <div key={p._id} className="flex items-center gap-3 px-5 py-3.5">
              <span className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                p.status === "completed" ? "bg-green-50 text-[#16a34a]"
                : p.status === "pending"  ? "bg-amber-50 text-amber-600"
                :                          "bg-red-50 text-red-500"
              )}>
                <StatusIcon status={p.status} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#071a0e]">
                  {formatMonthPaidFor(p.monthPaidFor)} contribution
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {collectionTitle ? `${collectionTitle} · ` : ""}{timeAgo(p.createdAt)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p
                  className={`text-sm font-bold ${
                    isCompleted ? "text-[#16a34a]" : "text-slate-600"
                  }`}
                >
                  {formatMoney(p.amount, p.currency)}
                </p>
                {!isCompleted && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      p.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {p.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
