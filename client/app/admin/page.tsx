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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FolderKanban,
  FolderPlus,
  History,
  Info,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { AdminDashboardData, Payment, Project, RecentUser } from "@/types";

// ─── constants ─────────────────────────────────────────────────────────────

const STATUS_ORDER = [
  "completed", "active", "pending", "paused",
  "failed", "expired", "cancelled", "closed", "draft",
];

const TODAY = new Intl.DateTimeFormat("en-TZ", {
  weekday: "short", month: "short", day: "numeric", year: "numeric",
}).format(new Date());

const ENV_LABEL = process.env.NODE_ENV === "production" ? "Production" : "Development";
const ENV_STYLE = process.env.NODE_ENV === "production"
  ? "bg-emerald-500/10 text-emerald-700"
  : "bg-yellow-400/15 text-yellow-800";

// ─── helpers ───────────────────────────────────────────────────────────────

function sortedByStatus(items: { status: string; count: number }[]) {
  return [...items].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
}

function payerName(p: Payment): string {
  if (p.userId && typeof p.userId === "object" && "fullName" in p.userId)
    return (p.userId as { fullName: string }).fullName;
  return p.customerName ?? "Unknown";
}

function projectTitle(p: Payment): string {
  if (p.projectId && typeof p.projectId === "object" && "title" in p.projectId)
    return (p.projectId as { title: string }).title;
  return "";
}

async function downloadCsv() {
  try {
    const res = await fetch(`${apiUrl}/api/admin/export/payments`, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sarafupay-payments.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // silently fail — user can retry from the payments page
  }
}

// ─── Needs Attention ───────────────────────────────────────────────────────

type AlertLevel = "error" | "warning" | "info";
type AttentionAlert = { level: AlertLevel; label: string; hint: string; href: string };

function buildAlerts(data: AdminDashboardData): AttentionAlert[] {
  const inactiveUsers = data.totalUsers - data.activeUsers;
  const pausedOrClosed =
    (data.projectsByStatus.find((s) => s.status === "paused")?.count ?? 0) +
    (data.projectsByStatus.find((s) => s.status === "closed")?.count ?? 0);

  return [
    data.failedPayments > 0 && {
      level: "error" as const,
      label: `${data.failedPayments} failed payment${data.failedPayments !== 1 ? "s" : ""}`,
      hint: "These may need investigation or member follow-up.",
      href: "/admin/payments",
    },
    data.pendingPayments > 0 && {
      level: "warning" as const,
      label: `${data.pendingPayments} pending payment${data.pendingPayments !== 1 ? "s" : ""}`,
      hint: "Awaiting payment gateway confirmation.",
      href: "/admin/payments",
    },
    inactiveUsers > 0 && {
      level: "info" as const,
      label: `${inactiveUsers} inactive user${inactiveUsers !== 1 ? "s" : ""}`,
      hint: "Accounts with isActive: false on the platform.",
      href: "/admin/members",
    },
    pausedOrClosed > 0 && {
      level: "info" as const,
      label: `${pausedOrClosed} paused or closed collection${pausedOrClosed !== 1 ? "s" : ""}`,
      hint: "These collections are not currently accepting payments.",
      href: "/admin/projects",
    },
  ].filter(Boolean) as AttentionAlert[];
}

const ALERT_ICON: Record<AlertLevel, React.ReactNode> = {
  error: <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />,
  warning: <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" />,
  info: <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />,
};

const ALERT_STYLE: Record<AlertLevel, string> = {
  error: "border-red-100 bg-red-50 text-red-700",
  warning: "border-yellow-100 bg-yellow-50 text-yellow-800",
  info: "border-blue-100 bg-blue-50 text-blue-700",
};

function NeedsAttention({ data }: { data: AdminDashboardData }) {
  const alerts = buildAlerts(data);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700">
          All systems look good — no issues need attention.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-yellow-100/80 bg-yellow-50/40 shadow-xl shadow-slate-900/5">
      <CardHeader className="flex-row items-center gap-3 pb-3">
        <AlertTriangle className="size-5 shrink-0 text-yellow-600" />
        <CardTitle className="text-base text-yellow-900">Needs Attention</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2.5">
          {alerts.map(({ level, label, hint, href }) => (
            <Link key={label} href={href}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-opacity hover:opacity-80",
                  ALERT_STYLE[level],
                )}
              >
                {ALERT_ICON[level]}
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-0.5 text-xs opacity-70">{hint}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Activity timeline ─────────────────────────────────────────────────────

type TimelineKind = "user" | "project" | "payment";
type TimelineItem = {
  kind: TimelineKind;
  title: string;
  subtitle: string;
  meta: string;
  date: string;
};

const TIMELINE_ICON: Record<TimelineKind, { bg: string; icon: React.ReactNode }> = {
  user: { bg: "bg-blue-100 text-blue-600", icon: <UserPlus className="size-3.5" /> },
  project: { bg: "bg-amber-100 text-amber-600", icon: <FolderPlus className="size-3.5" /> },
  payment: { bg: "bg-emerald-100 text-emerald-600", icon: <CheckCircle2 className="size-3.5" /> },
};

function buildTimeline(
  recentUsers: RecentUser[],
  projects: Project[],
  completedPayments: Payment[],
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...recentUsers.map((u) => ({
      kind: "user" as const,
      title: u.fullName,
      subtitle: "New user registered",
      meta: u.email,
      date: u.createdAt,
    })),
    ...projects.slice(0, 5).map((p) => ({
      kind: "project" as const,
      title: p.title,
      subtitle: "New collection created",
      meta: `${formatMoney(p.monthlyContributionAmount)}/mo · ${p.status}`,
      date: p.createdAt ?? p.startDate ?? "",
    })),
    ...completedPayments.slice(0, 5).map((p) => ({
      kind: "payment" as const,
      title: payerName(p),
      subtitle: "Payment completed",
      meta: `${formatMoney(p.amount)} · ${projectTitle(p)}`,
      date: p.paidAt ?? p.createdAt,
    })),
  ]
    .filter((i) => Boolean(i.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 9);

  return items;
}

// ─── Status bar row ────────────────────────────────────────────────────────

function StatusBar({ status, count, total }: { status: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <StatusBadge status={status} className="w-28 justify-center text-xs" />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status === "completed" || status === "active"
              ? "bg-emerald-500"
              : status === "pending" || status === "paused"
                ? "bg-yellow-400"
                : status === "failed" || status === "closed"
                  ? "bg-red-400"
                  : "bg-slate-300",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-sm font-semibold text-[#0B1F3A]">{count}</span>
      <span className="w-9 text-right text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

// ─── Quick actions config ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    kind: "link" as const,
    href: "/admin/members",
    label: "Manage Members",
    desc: "View and manage platform users",
    icon: <Users className="size-5" />,
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    kind: "link" as const,
    href: "/admin/projects",
    label: "Review Collections",
    desc: "Monitor all active collections",
    icon: <FolderKanban className="size-5" />,
    accent: "bg-amber-500/10 text-amber-600",
  },
  {
    kind: "link" as const,
    href: "/admin/payments",
    label: "Monitor Payments",
    desc: "Search and filter all transactions",
    icon: <History className="size-5" />,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    kind: "link" as const,
    href: "/admin#health",
    label: "System Health",
    desc: "Backend status and uptime",
    icon: <Shield className="size-5" />,
    accent: "bg-purple-500/10 text-purple-600",
  },
  {
    kind: "link" as const,
    href: "/admin/audit",
    label: "System Audit",
    desc: "Production readiness checklist",
    icon: <ShieldCheck className="size-5" />,
    accent: "bg-slate-500/10 text-slate-600",
  },
  {
    kind: "link" as const,
    href: "/admin/settings",
    label: "Platform Settings",
    desc: "Config, URLs, and secret status",
    icon: <Settings className="size-5" />,
    accent: "bg-indigo-500/10 text-indigo-600",
  },
  {
    kind: "link" as const,
    href: "/admin/activity",
    label: "Activity Feed",
    desc: "Latest platform events",
    icon: <Activity className="size-5" />,
    accent: "bg-teal-500/10 text-teal-600",
  },
];

// ─── Guide steps config ────────────────────────────────────────────────────

const GUIDE_STEPS = [
  {
    label: "Review new users",
    hint: "Check recent registrations for any suspicious accounts.",
    href: "/admin/members",
  },
  {
    label: "Monitor failed payments",
    hint: "Failed payments may need investigation or member follow-up.",
    href: "/admin/payments",
  },
  {
    label: "Check system health",
    hint: "Confirm backend and database are operational before peak hours.",
    href: "/admin#health",
  },
  {
    label: "Export payment report",
    hint: "Download a CSV of all payments for reconciliation or records.",
    href: null,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data, loading, error, refresh } = useAdminDashboard();

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Platform Admin
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0B1F3A] md:text-4xl">
              Platform Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Monitor SarafuPay users, collections, payments, and system health.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="active" className="bg-blue-500/12 text-blue-700">
                Admin only
              </StatusBadge>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", ENV_STYLE)}>
                {ENV_LABEL}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {TODAY}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="mt-1 gap-1.5 rounded-2xl text-xs"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              {loading ? "Refreshing…" : "Refresh dashboard"}
            </Button>
          </div>
        </div>

        {/* ── States ── */}
        {loading && <LoadingState label="Loading platform overview…" />}
        {error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={refresh}>
                Retry
              </Button>
            }
          />
        )}

        {data && (
          <>
            {/* ── Needs Attention ── */}
            <NeedsAttention data={data} />

            {/* ── 8 KPI cards ── */}
            <AdminStatsCards data={data} />

            {/* ── Monthly Revenue Chart ── */}
            <Card className="border-amber-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">Monthly revenue (completed payments)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {data.monthlyChart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2">
                    <CreditCard className="size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No payment data yet.</p>
                  </div>
                ) : (
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
                        contentStyle={{
                          borderRadius: "1rem",
                          border: "1px solid #e2e8f0",
                          backdropFilter: "blur(12px)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fill="url(#revenueGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Activity Timeline + Status Breakdowns ── */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Activity timeline */}
              <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#0B1F3A]">Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const items = buildTimeline(data.recentUsers, data.projects, data.latestCompletedPayments);
                    if (items.length === 0) {
                      return (
                        <div className="py-10 text-center">
                          <p className="text-sm font-medium text-muted-foreground">No activity yet.</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Activity will appear once users register, collections are created, or payments complete.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <ol className="relative ml-3 border-l border-slate-100">
                        {items.map((item, i) => {
                          const { bg, icon } = TIMELINE_ICON[item.kind];
                          return (
                            <li key={i} className="mb-5 ml-5 last:mb-0">
                              <span
                                className={cn(
                                  "absolute -left-3 flex size-6 items-center justify-center rounded-full ring-4 ring-white",
                                  bg,
                                )}
                              >
                                {icon}
                              </span>
                              <p className="text-sm font-semibold text-[#0B1F3A]">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                              {item.meta && (
                                <p className="text-xs text-muted-foreground">{item.meta}</p>
                              )}
                              {item.date && (
                                <p className="mt-0.5 text-xs text-muted-foreground/50">
                                  {formatDate(item.date)}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Status breakdowns */}
              <div className="flex flex-col gap-6">
                <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[#0B1F3A]">Payments by status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.paymentsByStatus.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">No payments yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sortedByStatus(data.paymentsByStatus).map(({ status, count }) => (
                          <StatusBar key={status} status={status} count={count} total={data.totalPayments} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[#0B1F3A]">Collections by status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.projectsByStatus.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">No collections yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sortedByStatus(data.projectsByStatus).map(({ status, count }) => (
                          <StatusBar key={status} status={status} count={count} total={data.totalCollections} />
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
                <h2 className="text-2xl font-bold text-[#0B1F3A]">Latest completed payments</h2>
                <Link href="/admin/payments">
                  <Button variant="outline" size="sm" className="rounded-2xl text-xs">
                    View all
                  </Button>
                </Link>
              </div>
              {data.latestCompletedPayments.length === 0 ? (
                <Card className="border-slate-100/60 bg-white/80">
                  <CardContent className="py-12 text-center">
                    <CreditCard className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No completed payments yet.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Payments will appear here once members complete transactions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <AdminPaymentsTable payments={data.latestCompletedPayments} />
              )}
            </section>

            {/* ── Quick Actions ── */}
            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-[#0B1F3A]">Quick actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {QUICK_ACTIONS.map(({ href, label, desc, icon, accent }) => (
                  <Link key={href} href={href}>
                    <Card className="h-full cursor-pointer border-slate-100/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
                      <CardContent className="flex flex-col gap-4 pb-6 pt-6">
                        <span className={cn("flex size-12 items-center justify-center rounded-2xl", accent)}>
                          {icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#0B1F3A]">{label}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {/* Export CSV — action card, no navigation */}
                <Card
                  className="h-full cursor-pointer border-dashed border-slate-200 bg-white/60 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                  onClick={downloadCsv}
                >
                  <CardContent className="flex flex-col gap-4 pb-6 pt-6">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-600">
                      <Download className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0B1F3A]">Export Payments CSV</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        Download all payment records
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── Admin Next Steps Guide ── */}
            <Card className="border-blue-100/60 bg-blue-50/40 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <CardHeader className="flex-row items-center gap-3 pb-3">
                <BookOpen className="size-5 shrink-0 text-blue-600" />
                <CardTitle className="text-base text-blue-900">Admin next steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {GUIDE_STEPS.map(({ label, hint, href }) => (
                    <li key={label} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
                      <div>
                        {href ? (
                          <Link
                            href={href}
                            className="text-sm font-medium text-blue-800 hover:underline"
                          >
                            {label}
                          </Link>
                        ) : (
                          <button
                            onClick={downloadCsv}
                            className="text-left text-sm font-medium text-blue-800 hover:underline"
                          >
                            {label}
                          </button>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* ── System Health ── */}
            <section id="health" className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-[#0B1F3A]">System health</h2>
              <SystemHealthCard />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
