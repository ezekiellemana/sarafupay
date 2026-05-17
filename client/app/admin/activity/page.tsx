"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Activity,
  CreditCard,
  FolderKanban,
  Loader2,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import type { ActivityEvent, ActivityEventType, ActivityFeedData } from "@/types";

// ─── Config ───────────────────────────────────────────────────────────────────

type FilterType = "all" | ActivityEventType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "user_registered", label: "Registrations" },
  { key: "collection_created", label: "Collections" },
  { key: "payment_completed", label: "Payments" },
];

const EVENT_CONFIG: Record<
  ActivityEventType,
  { icon: React.ReactNode; color: string; border: string; bg: string; dot: string }
> = {
  user_registered: {
    icon: <UserPlus className="size-4" />,
    color: "text-blue-700",
    border: "border-blue-100",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  collection_created: {
    icon: <FolderKanban className="size-4" />,
    color: "text-amber-700",
    border: "border-amber-100",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  payment_completed: {
    icon: <CreditCard className="size-4" />,
    color: "text-emerald-700",
    border: "border-emerald-100",
    bg: "bg-emerald-50",
    dot: "bg-emerald-400",
  },
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(timestamp);
}

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const cfg = EVENT_CONFIG[event.type];

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border",
            cfg.bg,
            cfg.border,
            cfg.color,
          )}
        >
          {cfg.icon}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-slate-100" />}
      </div>

      {/* Content */}
      <div className={cn("min-w-0 flex-1 pb-6", isLast && "pb-0")}>
        <p className="text-sm font-medium text-[#0B1F3A]">{event.description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span title={formatDate(event.timestamp)}>{relativeTime(event.timestamp)}</span>
          {" · "}
          <span className={cn("font-medium", cfg.color)}>
            {event.type === "user_registered"
              ? "Registration"
              : event.type === "collection_created"
                ? "Collection"
                : "Payment"}
          </span>
        </p>
        {event.type === "user_registered" && Boolean(event.meta.email) && (
          <p className="mt-0.5 text-xs text-muted-foreground">{String(event.meta.email)}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const [data, setData] = useState<ActivityFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      api<ActivityFeedData>("/api/admin/activity")
        .then((res) => {
          setData(res.data);
          setError("");
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(getApiErrorMessage(err, "Unable to load activity feed."));
          setLoading(false);
        });
    }
    load();
  }, [refreshKey]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const filtered =
    !data || typeFilter === "all"
      ? (data?.events ?? [])
      : data.events.filter((e) => e.type === typeFilter);

  const total = data?.events.length ?? 0;

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Derived from existing data"
          title="Activity Feed"
          description="Latest platform events — registrations, collections, and completed payments."
          action={
            <Button
              variant="outline"
              className="h-11 gap-2 rounded-2xl bg-white/80"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
          }
        />

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                typeFilter === key
                  ? "bg-[#0B1F3A] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              {label}
            </button>
          ))}
          {data && (
            <span className="ml-auto text-xs text-muted-foreground">
              {total} event{total !== 1 ? "s" : ""} (latest 50)
            </span>
          )}
        </div>

        {/* Loading initial */}
        {loading && !data && (
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-6 py-8 text-muted-foreground shadow">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Loading activity…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && data && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/70 bg-white/80 py-16 text-center shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <Activity className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity found for this filter.</p>
          </div>
        )}

        {/* Event timeline */}
        {filtered.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 px-6 py-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            {filtered.map((event, i) => (
              <EventRow key={event.id} event={event} isLast={i === filtered.length - 1} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
