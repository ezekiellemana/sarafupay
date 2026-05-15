"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { data, loading, error } = useAdminDashboard();
  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Admin console" title="Admin Dashboard" description="Monitor contributions, members, and project progress." action={<StatusBadge status="active" className="bg-blue-500/12 text-blue-700">Admin only</StatusBadge>} />
        {loading && <LoadingState />}
        {error && <ErrorState message={error} action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>} />}
        {data && (
          <>
            <AdminStatsCards data={data} />
            <Card className="border-amber-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-[#0B1F3A]">Monthly revenue</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyChart}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                        <stop offset="60%" stopColor="#2563EB" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", backdropFilter: "blur(12px)" }} />
                    <Area type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <section className="flex flex-col gap-4"><h2 className="text-xl font-bold text-[#0B1F3A]">Latest payments</h2><AdminPaymentsTable payments={data.latestPayments} /></section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
