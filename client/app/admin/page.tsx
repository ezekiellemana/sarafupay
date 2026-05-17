"use client";

import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable";
import { SystemHealthCard } from "@/components/admin/SystemHealthCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { History, Shield, Users, FolderKanban } from "lucide-react";
import type { RecentUser } from "@/types";

const STATUS_ORDER = ["completed", "active", "pending", "paused", "failed", "expired", "cancelled", "closed", "draft"];

function sortByStatus(items: { status: string; count: number }[]) {
  return [...items].sort(
    (a, b) => (STATUS_ORDER.indexOf(a.status) ?? 99) - (STATUS_ORDER.indexOf(b.status) ?? 99)
  );
}

function StatusBreakdownRow({ status, count, total }: { status: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <StatusBadge status={status} className="w-28 justify-center text-xs" />
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status === "completed" || status === "active" ? "bg-emerald-500" :
            status === "pending" || status === "paused" ? "bg-yellow-400" :
            status === "failed" || status === "closed" ? "bg-red-400" :
            "bg-slate-300"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold text-[#0B1F3A]">{count}</span>
      <span className="w-8 text-right text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

function RecentUserRow({ user }: { user: RecentUser }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">
        {user.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#0B1F3A]">{user.fullName}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge status={user.isActive ? "active" : "closed"} className="text-xs py-0.5 px-2">
          {user.isActive ? "Active" : "Inactive"}
        </StatusBadge>
        <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
      </div>
    </div>
  );
}

const quickLinks = [
  { href: "/admin/members", label: "Manage Members", description: "Search, view, and manage platform users", icon: <Users className="size-5" />, accent: "bg-blue-500/10 text-blue-600" },
  { href: "/admin/projects", label: "Manage Projects", description: "View all collections and platform projects", icon: <FolderKanban className="size-5" />, accent: "bg-amber-500/10 text-amber-600" },
  { href: "/admin/payments", label: "Manage Payments", description: "Search, filter, and export all payments", icon: <History className="size-5" />, accent: "bg-emerald-500/10 text-emerald-600" },
  { href: "/admin#health", label: "System Health", description: "Backend status, DB connection, uptime", icon: <Shield className="size-5" />, accent: "bg-purple-500/10 text-purple-600" },
];

export default function AdminPage() {
  const { data, loading, error } = useAdminDashboard();

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Platform Admin"
          title="Platform Admin Dashboard"
          description="Platform-wide view of all members, contributions, and projects."
          action={<StatusBadge status="active" className="bg-blue-500/12 text-blue-700">Admin only</StatusBadge>}
        />

        {loading && <LoadingState />}
        {error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        )}

        {data && (
          <>
            {/* ── 8 KPI Cards ── */}
            <AdminStatsCards data={data} />

            {/* ── Monthly Revenue Chart ── */}
            <Card className="border-amber-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">Monthly revenue</CardTitle>
              </CardHeader>
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
                    <Tooltip
                      contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", backdropFilter: "blur(12px)" }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Recent Activity + Status Breakdowns ── */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Recent Users + Recent Projects */}
              <div className="flex flex-col gap-6">
                {/* Recent Registrations */}
                <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[#0B1F3A]">Recent Registrations</CardTitle>
                    <Link href="/admin/members">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-[#0B1F3A]">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {data.recentUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users yet.</p>
                    ) : (
                      data.recentUsers.map((user) => <RecentUserRow key={user._id} user={user} />)
                    )}
                  </CardContent>
                </Card>

                {/* Recent Collections */}
                <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[#0B1F3A]">Recent Collections</CardTitle>
                    <Link href="/admin/projects">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-[#0B1F3A]">
                        View all
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {data.projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No collections yet.</p>
                    ) : (
                      data.projects.slice(0, 5).map((project) => (
                        <div
                          key={project._id}
                          className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#0B1F3A]">{project.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatMoney(project.monthlyContributionAmount)}/mo
                            </p>
                          </div>
                          <StatusBadge status={project.status} className="text-xs" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Status Breakdowns */}
              <div className="flex flex-col gap-6">
                {/* Payments by Status */}
                <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[#0B1F3A]">Payments by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.paymentsByStatus.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payments yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sortByStatus(data.paymentsByStatus).map(({ status, count }) => (
                          <StatusBreakdownRow
                            key={status}
                            status={status}
                            count={count}
                            total={data.totalPayments}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Collections by Status */}
                <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[#0B1F3A]">Collections by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.projectsByStatus.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No collections yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sortByStatus(data.projectsByStatus).map(({ status, count }) => (
                          <StatusBreakdownRow
                            key={status}
                            status={status}
                            count={count}
                            total={data.totalCollections}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Latest Completed Payments ── */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0B1F3A]">Latest completed payments</h2>
                <Link href="/admin/payments">
                  <Button variant="outline" size="sm" className="rounded-2xl text-xs">
                    View all payments
                  </Button>
                </Link>
              </div>
              <AdminPaymentsTable payments={data.latestCompletedPayments} />
            </section>

            {/* ── Quick Links ── */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#0B1F3A]">Quick actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map(({ href, label, description, icon, accent }) => (
                  <Link key={href} href={href}>
                    <Card className="h-full cursor-pointer border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
                      <CardContent className="flex flex-col gap-3 pt-6">
                        <span className={cn("flex size-10 items-center justify-center rounded-2xl", accent)}>
                          {icon}
                        </span>
                        <div>
                          <p className="font-semibold text-[#0B1F3A]">{label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── System Health (Phase E) ── */}
            <section id="health" className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#0B1F3A]">System health</h2>
              <SystemHealthCard />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
