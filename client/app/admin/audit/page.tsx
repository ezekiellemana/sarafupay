"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import type { AuditCheck, AuditCheckStatus, SystemAuditData } from "@/types";

type StatusConfig = {
  icon: React.ReactNode;
  label: string;
  color: string;
  border: string;
  bg: string;
};

const STATUS_CONFIG: Record<AuditCheckStatus, StatusConfig> = {
  passed: {
    icon: <CheckCircle2 className="size-4" />,
    label: "Passed",
    color: "text-emerald-700",
    border: "border-emerald-100",
    bg: "bg-emerald-50",
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    label: "Warning",
    color: "text-amber-700",
    border: "border-amber-100",
    bg: "bg-amber-50",
  },
  missing: {
    icon: <XCircle className="size-4" />,
    label: "Missing",
    color: "text-red-700",
    border: "border-red-100",
    bg: "bg-red-50",
  },
  failed: {
    icon: <XCircle className="size-4" />,
    label: "Failed",
    color: "text-red-700",
    border: "border-red-100",
    bg: "bg-red-50",
  },
};

function CheckRow({ check }: { check: AuditCheck }) {
  const cfg = STATUS_CONFIG[check.status];
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border",
          cfg.bg,
          cfg.border,
          cfg.color,
        )}
      >
        {cfg.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#0B1F3A]">{check.label}</p>
        {check.note && (
          <p className="mt-0.5 text-xs text-muted-foreground">{check.note}</p>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
          cfg.bg,
          cfg.border,
          cfg.color,
        )}
      >
        {cfg.label}
      </span>
    </div>
  );
}

export default function AdminAuditPage() {
  const [data, setData] = useState<SystemAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      api<SystemAuditData>("/api/admin/system-audit")
        .then((res) => {
          setData(res.data);
          setLastChecked(new Date());
          setError("");
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(getApiErrorMessage(err, "Unable to load audit results."));
          setLoading(false);
        });
    }
    load();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const passed = data?.checks.filter((c) => c.status === "passed").length ?? 0;
  const warnings = data?.checks.filter((c) => c.status === "warning").length ?? 0;
  const failures = data?.checks.filter(
    (c) => c.status === "missing" || c.status === "failed",
  ).length ?? 0;

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Pre-launch checklist"
          title="System Audit"
          description="Boolean production-readiness checks. No secret values are shown."
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

        {/* Loading (initial) */}
        {loading && !data && (
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-6 py-8 text-muted-foreground shadow">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Running checks…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  {passed} passed
                </span>
              </div>
              {warnings > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-2.5">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">
                    {warnings} warning{warnings !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {failures > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-4 py-2.5">
                  <XCircle className="size-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">
                    {failures} missing / failed
                  </span>
                </div>
              )}
              {lastChecked && (
                <p className="ml-auto text-xs text-muted-foreground">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Check list */}
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <div className="divide-y divide-slate-50">
                {data.checks.map((check) => (
                  <CheckRow key={check.key} check={check} />
                ))}
              </div>
            </div>

            {/* All-clear message */}
            {failures === 0 && warnings === 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-center">
                <p className="text-sm font-semibold text-emerald-700">
                  All checks passed — system is production-ready.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
