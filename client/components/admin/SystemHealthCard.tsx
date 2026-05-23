"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

type HealthData = {
  status: "ok" | "degraded";
  uptime: number;
  environment: string;
  db: "connected" | "disconnected";
  timestamp: string;
};

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          ok === true && "text-emerald-600",
          ok === false && "text-red-500",
          ok === undefined && "text-[#071a0e]"
        )}
      >
        {ok !== undefined && (
          <span className={cn("size-2 shrink-0 rounded-full", ok ? "bg-emerald-500" : "bg-red-500")} />
        )}
        {value}
      </span>
    </div>
  );
}

export function SystemHealthCard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((res) => {
        if (!res.ok) throw new Error("degraded");
        return res.json() as Promise<HealthData>;
      })
      .then((data) => {
        setHealth(data);
        setLastChecked(new Date());
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setHealth(null);
        setLoading(false);
      });
  }, [refreshKey]);

  const handleRefresh = () => {
    setLoading(true);
    setError(false);
    setRefreshKey((k) => k + 1);
  };

  const isOk = !error && health?.status === "ok";

  return (
    <Card className="border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <CardHeader className="flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "size-2.5 rounded-full",
              loading && "animate-pulse bg-yellow-400",
              !loading && isOk && "bg-emerald-500",
              !loading && !isOk && "bg-red-500"
            )}
          />
          <CardTitle className="text-[#071a0e]">System Health</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-1.5 text-muted-foreground hover:text-[#071a0e]"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && !health && (
          <p className="text-sm text-red-500">Unable to reach backend. Check that the server is running.</p>
        )}
        {health && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatusRow
              label="Backend"
              value={health.status === "ok" ? "Operational" : "Degraded"}
              ok={health.status === "ok"}
            />
            <StatusRow
              label="Database"
              value={health.db === "connected" ? "Connected" : "Disconnected"}
              ok={health.db === "connected"}
            />
            <StatusRow label="Environment" value={health.environment} />
            <StatusRow label="Uptime" value={formatUptime(health.uptime)} />
          </div>
        )}
        {lastChecked && (
          <p className="mt-4 text-xs font-medium text-slate-500">Last checked at {lastChecked.toLocaleTimeString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
