"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types";

type MonthStatus = "paid" | "pending" | "missed" | "current-unpaid" | "upcoming";

type Props = {
  paidMonths: string[];
  missedMonths: string[];
  currentMonthPaymentStatus: PaymentStatus;
  startDate?: string;
  endDate?: string;
};

function getCurrentYM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function advanceMonth(ym: string, n: number): string {
  let [y, m] = ym.split("-").map(Number);
  m += n;
  while (m > 12) { m -= 12; y++; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function buildRange(start: string, end: string): string[] {
  const months: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function monthLabel(ym: string, thisYear: number): string {
  const [y, m] = ym.split("-").map(Number);
  const abbr = new Date(y, m - 1, 1).toLocaleString("en", { month: "short" });
  return y === thisYear ? abbr : `${abbr} '${String(y).slice(2)}`;
}

export function MonthCoverageGrid({
  paidMonths,
  missedMonths,
  currentMonthPaymentStatus,
  startDate,
  endDate,
}: Props) {
  const currentYM = getCurrentYM();
  const thisYear = new Date().getFullYear();

  const paidSet = useMemo(() => new Set(paidMonths), [paidMonths]);
  const missedSet = useMemo(() => new Set(missedMonths), [missedMonths]);

  const months = useMemo(() => {
    const allKnown = [...paidMonths, ...missedMonths].sort();
    const rangeStart = startDate?.slice(0, 7) ?? allKnown[0] ?? currentYM;
    const twoAhead = advanceMonth(currentYM, 2);
    const endYM = endDate?.slice(0, 7) ?? "";
    const rangeEnd = endYM > twoAhead ? endYM : twoAhead;
    return buildRange(rangeStart, rangeEnd);
  }, [paidMonths, missedMonths, startDate, endDate, currentYM]);

  const getStatus = (ym: string): MonthStatus => {
    if (ym === currentYM) {
      if (currentMonthPaymentStatus === "completed") return "paid";
      if (currentMonthPaymentStatus === "pending") return "pending";
      return "current-unpaid";
    }
    if (ym > currentYM) return "upcoming";
    if (paidSet.has(ym)) return "paid";
    if (missedSet.has(ym)) return "missed";
    // Past month not tracked as expected by the backend (e.g. startDate missing)
    return "upcoming";
  };

  if (months.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#e5e0d6] bg-white p-5 shadow-sm shadow-[#0a1f12]/4">

      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-green-50">
          <Calendar className="size-3.5 text-[#16a34a]" />
        </span>
        <p className="text-sm font-bold text-[#071a0e]">Contribution Coverage</p>
      </div>

      {/* Scrollable chip row */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1.5" style={{ flexWrap: "nowrap" }}>
          {months.map((ym) => {
            const status = getStatus(ym);
            const isCurrent = ym === currentYM;
            return (
              <div
                key={ym}
                className={cn(
                  "flex min-w-[3.25rem] shrink-0 flex-col items-center justify-center rounded-xl px-1.5 py-2",
                  status === "paid"           && "bg-green-100 text-green-800 ring-1 ring-green-300/60",
                  status === "pending"        && "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
                  status === "missed"         && "bg-red-100 text-red-700 ring-1 ring-red-200/60",
                  status === "current-unpaid" && "bg-[#faf7f2] text-[#071a0e] ring-1 ring-[#e5e0d6]",
                  status === "upcoming"       && "bg-white text-muted-foreground ring-1 ring-[#e5e0d6]",
                  isCurrent && "ring-2",
                )}
              >
                <span className={cn("text-[11px] leading-none", isCurrent ? "font-bold" : "font-semibold")}>
                  {monthLabel(ym, thisYear)}
                </span>
                {isCurrent && (
                  <span className="mt-1 block size-1 rounded-full bg-current opacity-50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-green-200 ring-1 ring-green-300/60" /> Paid
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-amber-200 ring-1 ring-amber-300/60" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-red-200 ring-1 ring-red-200/60" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-white ring-1 ring-[#e5e0d6]" /> Upcoming
        </span>
      </div>
    </div>
  );
}
