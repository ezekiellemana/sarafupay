"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Copy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters";
import type { CollectionActivity, PaymentStatus } from "@/types";

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

function StatusIcon({ status }: { status: PaymentStatus }) {
  if (status === "completed") return <CheckCircle2 className="size-4 shrink-0" />;
  if (status === "pending")   return <Clock3 className="size-4 shrink-0" />;
  return <XCircle className="size-4 shrink-0" />;
}

type Props = {
  activity: CollectionActivity[];
  loading: boolean;
  activeCollectionLink?: string;
};

export function CollectionActivityFeed({ activity, loading, activeCollectionLink }: Props) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="h-4 w-48 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-100">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="size-9 shrink-0 animate-pulse rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-bold text-[#071a0e]">Recent Collection Activity</p>
        <Link href="/dashboard/collections">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-xl text-xs text-[#16a34a] hover:bg-green-50 hover:text-[#16a34a]"
          >
            My Collections <ArrowRight className="size-3" />
          </Button>
        </Link>
      </div>

      {activity.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[#071a0e]">No collection payments yet.</p>
          <p className="text-xs text-muted-foreground">Share your payment link to start receiving contributions.</p>
          {activeCollectionLink && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 rounded-2xl text-xs"
              onClick={() => {
                navigator.clipboard.writeText(activeCollectionLink);
                toast.success("Payment link copied!");
              }}
            >
              <Copy className="size-3.5" /> Copy Payment Link
            </Button>
          )}
        </div>
      ) : (
        /* Activity rows */
        <div className="divide-y divide-slate-100">
          {activity.map((item) => (
            <div key={item._id} className="flex items-center gap-3 px-5 py-3.5">

              {/* Status icon */}
              <span className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                item.status === "completed" ? "bg-green-50 text-[#16a34a]"
                : item.status === "pending"  ? "bg-amber-50 text-amber-600"
                :                              "bg-red-50 text-red-500"
              )}>
                <StatusIcon status={item.status} />
              </span>

              {/* Name + collection */}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-[#071a0e]">
                    {item.customerName ?? "Anonymous"}
                  </p>
                  {item.paymentMethod && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                      {item.paymentMethod}
                    </span>
                  )}
                </div>
                {item.collectionId ? (
                  <Link
                    href={`/dashboard/collections/${item.collectionId}`}
                    className="block truncate text-xs text-muted-foreground hover:text-[#16a34a]"
                  >
                    {item.collectionTitle} →
                  </Link>
                ) : (
                  <p className="truncate text-xs text-muted-foreground">{item.collectionTitle}</p>
                )}
              </div>

              {/* Amount + time ago */}
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <p className={cn(
                  "text-sm font-bold",
                  item.status === "completed" ? "text-[#16a34a]" : "text-slate-500"
                )}>
                  {formatMoney(item.amount, item.currency)}
                </p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
