"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Payment } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed: { label: "Completed", color: "#16a34a" },
  pending:   { label: "Pending",   color: "#f59e0b" },
  failed:    { label: "Failed",    color: "#ef4444" },
  other:     { label: "Other",     color: "#94a3b8" }
};

// Server snapshot = false, client snapshot = true — no setState-in-effect needed
const subscribeNoop = () => () => {};

export function PaymentStatusChart({ payments }: { payments: Payment[] }) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const { data, total } = useMemo(() => {
    const counts = { completed: 0, pending: 0, failed: 0, other: 0 };
    for (const p of payments) {
      if (p.status === "completed") counts.completed++;
      else if (p.status === "pending") counts.pending++;
      else if (p.status === "failed") counts.failed++;
      else counts.other++;
    }
    const data = (Object.keys(counts) as Array<keyof typeof counts>)
      .filter((k) => counts[k] > 0)
      .map((k) => ({ key: k, value: counts[k], ...STATUS_CONFIG[k] }));
    return { data, total: payments.length };
  }, [payments]);

  if (!total) return null;

  return (
    <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#071a0e]">Payment Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="h-44 w-full max-w-[220px]">
            {isClient && <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={82}
                  strokeWidth={2}
                  stroke="#ffffff"
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                  <Label
                    value={String(total)}
                    position="center"
                    style={{ fontSize: "1.2rem", fontWeight: 700, fill: "#071a0e" }}
                  />
                  <Label
                    value="total"
                    position="center"
                    dy={18}
                    style={{ fontSize: "0.7rem", fill: "#94a3b8" }}
                  />
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: "0.8rem" }}
                  formatter={(value: unknown) => {
                    const n = Number(value);
                    return [`${n} (${total > 0 ? Math.round((n / total) * 100) : 0}%)`, ""];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>}
          </div>

          {/* Legend */}
          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-2">
            {data.map(({ key, label, value, color }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="ml-auto text-xs font-semibold text-[#071a0e]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
