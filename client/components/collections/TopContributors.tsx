"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function TopContributors({ payments, currency }: { payments: Payment[]; currency: string }) {
  const top = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const p of payments) {
      if (p.status !== "completed") continue;
      const key = p.customerPhone ?? p.customerEmail ?? p.customerName ?? p._id;
      const name = p.customerName ?? p.customerPhone ?? "Anonymous";
      const existing = map.get(key);
      if (existing) {
        existing.total += p.amount;
        existing.count++;
      } else {
        map.set(key, { name, total: p.amount, count: 1 });
      }
    }
    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [payments]);

  return (
    <Card className="border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-[#071a0e]">
          <Trophy className="size-4 text-amber-500" /> Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-2xl">🏆</p>
            <p className="text-sm text-muted-foreground">No completed payments yet.</p>
          </div>
        ) : (
          <ol className="flex flex-col divide-y divide-slate-100">
            {top.map(({ name, total, count }, i) => (
              <li key={`${name}-${i}`} className="flex items-center gap-3 py-3">
                <span className="text-xl leading-none" aria-hidden>
                  {MEDALS[i] ?? `#${i + 1}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#071a0e]">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {count === 1 ? "1 payment" : `${count} payments`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#16a34a]">
                  {formatMoney(total, currency)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
