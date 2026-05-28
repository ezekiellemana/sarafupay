"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminRevenueCards } from "@/components/admin/AdminRevenueCards";
import { SystemHealthCard } from "@/components/admin/SystemHealthCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { SafeChartContainer } from "@/components/shared/SafeChartContainer";
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
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m === 1 ? "1 min ago" : `${m} min ago`;
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

// ── B: Needs Attention ─────────────────────────────────────────────────────

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
      hint: "May need investigation or member follow-up.",
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
      hint: "Accounts with isActive: false.",
      href: "/admin/members",
    },
    pausedOrClosed > 0 && {
      level: "info" as const,
      label: `${pausedOrClosed} paused or closed collection${pausedOrClosed !== 1 ? "s" : ""}`,
      hint: "Not currently accepting payments.",
      href: "/admin/projects",
    },
  ].filter(Boolean) as AttentionAlert[];
}

const ALERT_ICON: Record<AlertLevel, React.ReactNode> = {
  error:   <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />,
  warning: <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" />,
  info:    <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />,
};
const ALERT_BG: Record<AlertLevel, string> = {
  error:   "border-red-100 bg-red-50/80 text-red-700",
  warning: "border-yellow-100 bg-yellow-50/80 text-yellow-800",
  info:    "border-blue-100 bg-blue-50/80 text-blue-700",
};

function NeedsAttention({ data }: { data: AdminDashboardData }) {
  const alerts = buildAlerts(data);
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700">
          All systems look good — no issues need attention.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {alerts.map(({ level, label, hint, href }) => (
        <Link key={label} href={href} className="min-w-0 flex-1">
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl border px-4 py-3 transition-opacity hover:opacity-80",
              ALERT_BG[level],
            )}
          >
            {ALERT_ICON[level]}
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">{label}</p>
              <p className="mt-0.5 line-clamp-1 text-xs opacity-70">{hint}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── D: Analytics Panel ─────────────────────────────────────────────────────

function AnimatedBar({
  pct,
  color,
  mounted,
}: {
  pct: number;
  color: string;
  mounted: boolean;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full"
        style={{
          width: mounted ? `${pct}%` : "0%",
          backgroundColor: color,
          transitionProperty: "width",
          transitionDuration: "0.85s",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

function StatusBarsGroup({
  title,
  subtitle,
  items,
  total,
  mounted,
}: {
  title: string;
  subtitle: string;
  items: { status: string; count: number }[];
  total: number;
  mounted: boolean;
}) {
  const sorted = sortedByStatus(items);
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
        <p className="text-[10px] text-slate-300">·</p>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {sorted.map(({ status, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const color = STATUS_COLORS[status] ?? "#94a3b8";
          return (
            <div key={status}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium capitalize text-slate-600">{status}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-bold text-[#071a0e]">{count.toLocaleString()}</span>
                  <span className="w-7 text-right text-[10px] text-slate-400">{pct}%</span>
                </div>
              </div>
              <AnimatedBar pct={pct} color={color} mounted={mounted} />
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="py-2 text-xs text-slate-400">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function AnalyticsPanel({ data }: { data: AdminDashboardData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const chartTotal = data.monthlyChart.reduce((s, m) => s + m.total, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">

      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[#e5e0d6] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Live</span>
          <span className="mx-1 text-slate-200">·</span>
          <span className="text-sm font-bold text-[#071a0e]">Analytics Overview</span>
        </div>
        {chartTotal > 0 && (
          <p className="hidden text-xs text-slate-400 sm:block">
            12-month revenue:{" "}
            <span className="font-semibold text-[#035034]">{formatMoney(chartTotal)}</span>
          </p>
        )}
      </div>

      {/* Two-column body: chart left, status bars right */}
      <div className="grid lg:grid-cols-[1fr_268px]">

        {/* Left — Monthly Revenue Chart */}
        <div className="border-b border-[#e5e0d6] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Monthly Contribution Volume — Completed Payments (last 12 months)
          </p>
          <div className="h-48 lg:h-64">
            {data.monthlyChart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <CreditCard className="size-7 text-muted-foreground/25" />
                <p className="text-sm text-muted-foreground">No payment data yet.</p>
              </div>
            ) : (
              <SafeChartContainer className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlyChart}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#19A254" stopOpacity={0.32} />
                      <stop offset="75%"  stopColor="#035034" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="#035034" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1_000
                          ? `${(v / 1_000).toFixed(0)}K`
                          : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.875rem",
                      border: "1px solid #e5e0d6",
                      fontSize: 12,
                    }}
                    formatter={(value) => [formatMoney(Number(value)), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#035034"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={{ r: 3, fill: "#035034", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#035034", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </SafeChartContainer>
            )}
          </div>
          {/* Mobile total — shown below chart on small screens */}
          {chartTotal > 0 && (
            <p className="mt-3 text-xs text-slate-400 sm:hidden">
              12-month total:{" "}
              <span className="font-semibold text-[#035034]">{formatMoney(chartTotal)}</span>
            </p>
          )}
        </div>

        {/* Right — Status Bars */}
        <div className="flex flex-col gap-5 p-5 lg:p-6">
          <StatusBarsGroup
            title="Payments"
            subtitle={`${data.totalPayments.toLocaleString()} total`}
            items={data.paymentsByStatus}
            total={data.totalPayments}
            mounted={mounted}
          />
          <div className="border-t border-[#e5e0d6]" />
          <StatusBarsGroup
            title="Collections"
            subtitle={`${data.totalCollections.toLocaleString()} total`}
            items={data.projectsByStatus}
            total={data.totalCollections}
            mounted={mounted}
          />
        </div>
      </div>
    </div>
  );
}

// ── E: Top Collections (ranked horizontal bars) ────────────────────────────

function TopCollections({
  collections,
}: {
  collections: { title: string; slug: string; total: number; count: number }[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = collections.length > 0 ? Math.max(...collections.map((c) => c.total)) : 1;

  const rankStyle = [
    "bg-[#C4A237]/20 text-[#C4A237]",
    "bg-slate-200/80 text-slate-500",
    "bg-orange-100 text-orange-500",
    "bg-slate-100 text-slate-400",
    "bg-slate-100 text-slate-400",
  ];
  const barColor = ["#C4A237", "#19A254", "#19A254", "#94a3b8", "#94a3b8"];

  return (
    <Card className="border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <CardHeader className="flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#071a0e]">
          <Trophy className="size-4 text-[#C4A237]" />
          Top Collections by Revenue
        </CardTitle>
        <Link href="/admin/projects">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-xl px-2 text-xs text-slate-500"
          >
            View all <ArrowRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {collections.length === 0 ? (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-2 size-7 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No completed payments yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {collections.map((col, i) => {
              const pct = max > 0 ? (col.total / max) * 100 : 0;
              return (
                <div key={col.title}>
                  <div className="mb-2 flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold",
                        rankStyle[i] ?? rankStyle[4],
                      )}
                    >
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#071a0e]">
                      {col.title}
                    </p>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold text-[#035034]">
                        {formatMoney(col.total)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {col.count} payment{col.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: mounted ? `${pct}%` : "0%",
                        backgroundColor: barColor[i] ?? "#94a3b8",
                        transitionProperty: "width",
                        transitionDuration: "1s",
                        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── E: Latest Payments Feed ────────────────────────────────────────────────

function LatestPaymentsFeed({ payments }: { payments: Payment[] }) {
  return (
    <Card className="border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <CardHeader className="flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#071a0e]">
          <CreditCard className="size-4 text-emerald-500" />
          Latest Payments
        </CardTitle>
        <Link href="/admin/payments">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-xl px-2 text-xs text-slate-500"
          >
            View all <ArrowRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="py-8 text-center">
            <CreditCard className="mx-auto mb-2 size-7 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No completed payments yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payments.map((p) => {
              const name = payerName(p);
              const initial = (name[0] ?? "?").toUpperCase();
              return (
                <div
                  key={p._id}
                  className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#071a0e]">{name}</p>
                    <p className="truncate text-[11px] text-slate-400">{projectTitle(p)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-bold text-[#035034]">
                      {formatMoney(p.amount, p.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── F: Live Activity Panel ─────────────────────────────────────────────────

const EVENT_META: Record<string, { bg: string; icon: React.ReactNode }> = {
  user_registered:    { bg: "bg-blue-100 text-blue-600",    icon: <UserPlus className="size-3.5" /> },
  collection_created: { bg: "bg-amber-100 text-amber-600",  icon: <FolderPlus className="size-3.5" /> },
  payment_completed:  { bg: "bg-emerald-100 text-emerald-600", icon: <CheckCircle2 className="size-3.5" /> },
};

function ActivityPanel({
  events,
  loading,
}: {
  events: ActivityEvent[];
  loading: boolean;
}) {
  return (
    <Card className="border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <CardHeader className="flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <span className="size-2 animate-pulse rounded-full bg-teal-400" />
          <CardTitle className="text-sm font-bold text-[#071a0e]">Live Activity</CardTitle>
        </div>
        <Link href="/admin/activity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-xl px-2 text-xs text-slate-500"
          >
            View all <ArrowRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-slate-100 border-t-[#035034]" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="mx-auto mb-2 size-7 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.slice(0, 10).map((event) => {
              const meta = EVENT_META[event.type] ?? EVENT_META.user_registered;
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      meta.bg,
                    )}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug text-[#071a0e]">
                      {event.description}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── G: Quick Actions ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: "/admin/members",  label: "Members",       desc: "View and manage users",          icon: <Users className="size-4.5" />,    accent: "bg-blue-500/10 text-blue-600" },
  { href: "/admin/projects", label: "Collections",   desc: "Monitor active collections",     icon: <FolderKanban className="size-4.5" />, accent: "bg-amber-500/10 text-amber-600" },
  { href: "/admin/payments", label: "Payments",      desc: "Search and filter transactions", icon: <History className="size-4.5" />,  accent: "bg-emerald-500/10 text-emerald-600" },
  { href: "/admin/activity", label: "Activity",      desc: "Latest platform events",         icon: <Activity className="size-4.5" />, accent: "bg-teal-500/10 text-teal-600" },
  { href: "/admin/audit",    label: "Audit",         desc: "Production readiness",           icon: <ShieldCheck className="size-4.5" />, accent: "bg-slate-500/10 text-slate-600" },
  { href: "/admin/settings", label: "Settings",      desc: "Config and secret status",       icon: <Settings className="size-4.5" />, accent: "bg-indigo-500/10 text-indigo-600" },
  { href: "/admin#health",   label: "System Health", desc: "Backend status and uptime",      icon: <Shield className="size-4.5" />,   accent: "bg-purple-500/10 text-purple-600" },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data, loading, error, refresh, refreshedAt } = useAdminDashboard();
  const { data: activityData, loading: activityLoading } = useAdminActivity();

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-7">

        {/* A: Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#19A254]">
              Platform Admin
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#071a0e] sm:text-3xl">
              Command Centre
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Real-time overview of SarafuPay — users, collections, payments, system health.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", ENV_STYLE)}>
              {ENV_LABEL}
            </span>
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

        {/* Initial loading spinner */}
        {loading && !data && (
          <div className="flex min-h-80 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#035034]" />
          </div>
        )}

        {/* Error state */}
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
            {/* B: Needs Attention */}
            <NeedsAttention data={data} />

            {/* C: Executive KPI Row */}
            <AdminStatsCards data={data} />

            {/* D: Main Analytics Panel */}
            <AnalyticsPanel data={data} />

            {/* E: Platform Revenue */}
            <AdminRevenueCards
              summary={data.revenueSummary}
              withdrawalRevenueSummary={data.withdrawalRevenueSummary}
            />

            {/* F: Performance / Ranking Panel */}
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <TopCollections collections={data.topCollections ?? []} />
              <LatestPaymentsFeed payments={data.latestCompletedPayments} />
            </div>

            {/* G: Live Activity Panel (full width) */}
            <ActivityPanel
              events={activityData?.events ?? []}
              loading={activityLoading}
            />

            {/* H: Quick Actions */}
            <section>
              <h2 className="mb-4 text-base font-bold text-[#071a0e]">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {QUICK_ACTIONS.map(({ href, label, desc, icon, accent }) => (
                  <Link key={href} href={href}>
                    <div className="flex h-full cursor-pointer flex-col gap-3 rounded-2xl border border-[#e5e0d6] bg-white p-4 shadow-sm shadow-[#0a1f12]/4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl",
                          accent,
                        )}
                      >
                        {icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#071a0e]">{label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Export CSV — action card */}
                <div
                  className="flex h-full cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-[#e5e0d6] bg-white p-4 shadow-sm shadow-[#0a1f12]/4 transition-all duration-200 hover:-translate-y-1 hover:border-[#c9c3b9] hover:shadow-md"
                  onClick={downloadCsv}
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Download className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#071a0e]">Export CSV</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Download all payment records</p>
                  </div>
                </div>
              </div>
            </section>

            {/* System Health */}
            <section id="health">
              <h2 className="mb-4 text-base font-bold text-[#071a0e]">System Health</h2>
              <SystemHealthCard />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
