"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { SystemHealthCard } from "@/components/admin/SystemHealthCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminDashboard, useAdminActivity } from "@/hooks/useDashboard";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import type { ActivityEvent, AdminDashboardData, Payment } from "@/types";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
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
  Trophy,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

// ── constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  active:    "#22c55e",
  pending:   "#f59e0b",
  paused:    "#f59e0b",
  failed:    "#ef4444",
  expired:   "#94a3b8",
  cancelled: "#94a3b8",
  closed:    "#64748b",
  draft:     "#3b82f6",
};

const STATUS_ORDER = [
  "completed", "active", "pending", "paused",
  "failed", "expired", "cancelled", "closed", "draft",
];

const TODAY = new Intl.DateTimeFormat("en-TZ", {
  weekday: "short", month: "short", day: "numeric", year: "numeric",
}).format(new Date());

const ENV_LABEL = process.env.NODE_ENV === "production" ? "Production" : "Development";
const ENV_STYLE =
  process.env.NODE_ENV === "production"
    ? "bg-emerald-500/10 text-emerald-700"
    : "bg-yellow-400/15 text-yellow-800";

// ── helpers ────────────────────────────────────────────────────────────────

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
  return "—";
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1 min ago";
  return `${minutes} min ago`;
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
    // silently fail
  }
}

// ── Needs Attention ────────────────────────────────────────────────────────

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

// ── Status Donut Chart ─────────────────────────────────────────────────────

type DonutEntry = { status: string; count: number };

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-semibold capitalize text-slate-700">{item.name}</p>
      <p className="text-sm font-bold text-[#0B1F3A]">{item.value.toLocaleString()}</p>
    </div>
  );
}

function StatusDonut({
  title,
  data,
  total,
  emptyLabel,
}: {
  title: string;
  data: DonutEntry[];
  total: number;
  emptyLabel: string;
}) {
  const sorted = sortedByStatus(data);
  const pieData = sorted.map((d) => ({ name: d.status, value: d.count }));

  return (
    <Card className="border-slate-100/60 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-[#0B1F3A]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {pieData.length === 0 || total === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2">
            <CreditCard className="size-7 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Donut */}
            <div className="relative h-44 w-full shrink-0 sm:h-40 sm:w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="76%"
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-extrabold leading-none text-[#0B1F3A]">
                  {total.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  total
                </p>
              </div>
            </div>
            {/* Legend */}
            <div className="min-w-0 flex-1 space-y-2">
              {sorted.map(({ status, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-2.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[status] ?? "#94a3b8" }}
                    />
                    <StatusBadge status={status} className="py-0.5 text-[10px]" />
                    <span className="ml-auto text-xs font-semibold text-[#0B1F3A]">
                      {count.toLocaleString()}
                    </span>
                    <span className="w-8 text-right text-[10px] text-slate-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Revenue Chart ──────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: AdminDashboardData }) {
  return (
    <Card className="border-slate-100/60 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-[#0B1F3A]">
            Monthly revenue — completed payments (last 12 months)
          </CardTitle>
          {data.monthlyChart.length > 0 && (
            <p className="shrink-0 text-xs text-slate-400">
              Total:{" "}
              <span className="font-semibold text-[#035034]">
                {formatMoney(data.monthlyChart.reduce((s, m) => s + m.total, 0))}
              </span>
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-60">
        {data.monthlyChart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <CreditCard className="size-8 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No payment data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#19A254" stopOpacity={0.38} />
                  <stop offset="75%" stopColor="#035034" stopOpacity={0.07} />
                  <stop offset="100%" stopColor="#035034" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                }
                width={48}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "0.875rem",
                  border: "1px solid #e2e8f0",
                  backdropFilter: "blur(12px)",
                  fontSize: 12,
                }}
                formatter={(value) => [formatMoney(Number(value)), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#035034"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ r: 3, fill: "#035034", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#035034", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Activity Timeline ──────────────────────────────────────────────────────

const EVENT_META: Record<string, { bg: string; icon: React.ReactNode }> = {
  user_registered: { bg: "bg-blue-100 text-blue-600", icon: <UserPlus className="size-3.5" /> },
  collection_created: { bg: "bg-amber-100 text-amber-600", icon: <FolderPlus className="size-3.5" /> },
  payment_completed: { bg: "bg-emerald-100 text-emerald-600", icon: <CheckCircle2 className="size-3.5" /> },
};

function ActivityTimeline({
  events,
  loading,
}: {
  events: ActivityEvent[];
  loading: boolean;
}) {
  return (
    <Card className="border-slate-100/60 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
          <Activity className="size-4 text-teal-500" />
          Live activity
        </CardTitle>
        <Link href="/admin/activity">
          <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-xl px-2 text-xs text-slate-500">
            All <ArrowRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-slate-100 border-t-[#035034]" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </div>
        ) : (
          <ol className="relative ml-3 border-l border-slate-100">
            {events.slice(0, 8).map((event) => {
              const meta = EVENT_META[event.type] ?? EVENT_META.user_registered;
              return (
                <li key={event.id} className="mb-4 ml-5 last:mb-0">
                  <span
                    className={cn(
                      "absolute -left-3 flex size-6 items-center justify-center rounded-full ring-4 ring-white",
                      meta.bg,
                    )}
                  >
                    {meta.icon}
                  </span>
                  <p className="text-[13px] font-medium leading-snug text-[#0B1F3A]">
                    {event.description}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatDate(event.timestamp)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ── Mini Payments List ─────────────────────────────────────────────────────

function MiniPaymentsList({ payments }: { payments: Payment[] }) {
  return (
    <Card className="border-slate-100/60 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
          <CreditCard className="size-4 text-emerald-500" />
          Latest payments
        </CardTitle>
        <Link href="/admin/payments">
          <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-xl px-2 text-xs text-slate-500">
            All <ArrowRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No completed payments yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0B1F3A]">{payerName(p)}</p>
                  <p className="truncate text-[11px] text-slate-400">{projectTitle(p)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-[#035034]">
                    {formatMoney(p.amount, p.currency)}
                  </p>
                  <p className="text-[10px] text-slate-400">{formatDate(p.paidAt ?? p.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Top Collections ────────────────────────────────────────────────────────

function TopCollections({
  collections,
}: {
  collections: { title: string; slug: string; total: number; count: number }[];
}) {
  return (
    <Card className="border-slate-100/60 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
          <Trophy className="size-4 text-[#C4A237]" />
          Top collections
        </CardTitle>
        <Link href="/admin/projects">
          <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-xl px-2 text-xs text-slate-500">
            All <ArrowRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No completed payments yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {collections.map((col, i) => (
              <div key={col.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                    i === 0 && "bg-[#C4A237]/20 text-[#C4A237]",
                    i === 1 && "bg-slate-200/70 text-slate-500",
                    i === 2 && "bg-orange-100 text-orange-500",
                    i >= 3 && "bg-slate-100 text-slate-400",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#0B1F3A]">{col.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {col.count} payment{col.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <p className="shrink-0 text-[13px] font-bold text-[#035034]">
                  {formatMoney(col.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Quick Actions ──────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: "/admin/members", label: "Members", desc: "View and manage users", icon: <Users className="size-5" />, accent: "bg-blue-500/10 text-blue-600" },
  { href: "/admin/projects", label: "Collections", desc: "Monitor active collections", icon: <FolderKanban className="size-5" />, accent: "bg-amber-500/10 text-amber-600" },
  { href: "/admin/payments", label: "Payments", desc: "Search and filter transactions", icon: <History className="size-5" />, accent: "bg-emerald-500/10 text-emerald-600" },
  { href: "/admin/activity", label: "Activity", desc: "Latest platform events", icon: <Activity className="size-5" />, accent: "bg-teal-500/10 text-teal-600" },
  { href: "/admin/audit", label: "Audit", desc: "Production readiness", icon: <ShieldCheck className="size-5" />, accent: "bg-slate-500/10 text-slate-600" },
  { href: "/admin/settings", label: "Settings", desc: "Config and secret status", icon: <Settings className="size-5" />, accent: "bg-indigo-500/10 text-indigo-600" },
  { href: "/admin#health", label: "System Health", desc: "Backend status and uptime", icon: <Shield className="size-5" />, accent: "bg-purple-500/10 text-purple-600" },
];

const GUIDE_STEPS = [
  { label: "Review new users", hint: "Check recent registrations for suspicious accounts.", href: "/admin/members" },
  { label: "Monitor failed payments", hint: "Failed payments may need investigation or follow-up.", href: "/admin/payments" },
  { label: "Check system health", hint: "Confirm backend and database are operational.", href: "/admin#health" },
  { label: "Export payment report", hint: "Download a CSV of all payments for reconciliation.", href: null },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data, loading, error, refresh, refreshedAt } = useAdminDashboard();
  const { data: activityData, loading: activityLoading } = useAdminActivity();

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-7">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#19A254]">
              Platform Admin
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-3xl">
              Command Centre
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Real-time overview of SarafuPay — users, collections, payments, system health.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", ENV_STYLE)}>
                {ENV_LABEL}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {TODAY}
            </div>
            <div className="flex items-center gap-2">
              {refreshedAt && !loading && (
                <p className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="size-3" />
                  Updated {timeAgo(refreshedAt)}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="gap-1.5 rounded-2xl text-xs"
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-80 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#035034]" />
          </div>
        )}

        {/* Error */}
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
            {/* Needs Attention */}
            <NeedsAttention data={data} />

            {/* 4 Hero KPI Tiles */}
            <AdminStatsCards data={data} />

            {/* Monthly Revenue Chart */}
            <RevenueChart data={data} />

            {/* Donut Charts */}
            <div className="grid gap-6 sm:grid-cols-2">
              <StatusDonut
                title="Payments by status"
                data={data.paymentsByStatus}
                total={data.totalPayments}
                emptyLabel="No payments yet."
              />
              <StatusDonut
                title="Collections by status"
                data={data.projectsByStatus}
                total={data.totalCollections}
                emptyLabel="No collections yet."
              />
            </div>

            {/* 3-column: Activity | Payments | Top Collections */}
            <div className="grid gap-6 lg:grid-cols-3">
              <ActivityTimeline
                events={activityData?.events ?? []}
                loading={activityLoading}
              />
              <MiniPaymentsList payments={data.latestCompletedPayments} />
              <TopCollections collections={data.topCollections ?? []} />
            </div>

            {/* Quick Actions */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-[#0B1F3A]">Quick actions</h2>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {QUICK_ACTIONS.map(({ href, label, desc, icon, accent }) => (
                  <Link key={href} href={href}>
                    <div className="group flex h-full cursor-pointer flex-col gap-3 rounded-2xl border border-slate-100/60 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                      <span className={cn("flex size-10 items-center justify-center rounded-xl", accent)}>
                        {icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#0B1F3A]">{label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Export CSV */}
                <div
                  className="flex h-full cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                  onClick={downloadCsv}
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Download className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0B1F3A]">Export CSV</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Download all payment records</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Admin Guide */}
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
                          <Link href={href} className="text-sm font-medium text-blue-800 hover:underline">
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

            {/* System Health */}
            <section id="health">
              <h2 className="mb-4 text-lg font-bold text-[#0B1F3A]">System health</h2>
              <SystemHealthCard />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
