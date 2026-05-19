"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { PlatformSettings } from "@/types";

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-2 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

// ─── Row helpers ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </p>
  );
}

function UrlRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="w-36 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      <code className="flex-1 truncate rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-[#0B1F3A]">
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  );
}

function ConfigRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="w-36 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      <span className="text-sm font-medium text-[#0B1F3A]">{value}</span>
    </div>
  );
}

function SecretRow({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="w-48 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {configured ? (
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="size-3.5" /> Configured
        </span>
      ) : (
        <span className="flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          <XCircle className="size-3.5" /> Missing
        </span>
      )}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-slate-100 px-6">{children}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      api<PlatformSettings>("/api/admin/settings")
        .then((res) => {
          setSettings(res.data);
          setError("");
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(getApiErrorMessage(err, "Unable to load settings."));
          setLoading(false);
        });
    }
    load();
  }, [refreshKey]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const envBadge = settings?.environment === "production" ? (
    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      production
    </span>
  ) : (
    <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      {settings?.environment ?? "—"}
    </span>
  );

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Read-only configuration"
          title="Platform Settings"
          description="Safe platform configuration. Secret values are never shown."
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
        {loading && !settings && (
          <div className="flex min-h-40 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#035034]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {settings && (
          <div className="flex flex-col gap-6">
            {/* ── Safe URLs ── */}
            <section>
              <SectionTitle>Safe URLs</SectionTitle>
              <Card>
                <CardBody>
                  <UrlRow label="Frontend URL" value={settings.clientUrl} />
                  <UrlRow label="Backend URL" value={settings.serverUrl} />
                  <UrlRow label="Snippe base" value={settings.snippeBaseUrl} />
                  <UrlRow label="Webhook URL" value={settings.webhookUrl} />
                  <UrlRow label="Return URL" value={settings.returnUrl} />
                </CardBody>
              </Card>
            </section>

            {/* ── General Config ── */}
            <section>
              <SectionTitle>General configuration</SectionTitle>
              <Card>
                <CardBody>
                  <ConfigRow label="Environment" value={envBadge} />
                  <ConfigRow label="Cookie name" value={settings.cookieName} />
                  <ConfigRow label="JWT expires in" value={settings.jwtExpiresIn} />
                  <ConfigRow
                    label="Support email"
                    value={
                      settings.supportEmail ?? (
                        <span className="text-sm text-muted-foreground">
                          Not configured
                        </span>
                      )
                    }
                  />
                  <ConfigRow
                    label="App version"
                    value={
                      settings.appVersion ?? (
                        <span className="text-sm text-muted-foreground">
                          Not configured (set APP_VERSION env var)
                        </span>
                      )
                    }
                  />
                </CardBody>
              </Card>
            </section>

            {/* ── Secret Status ── */}
            <section>
              <SectionTitle>Secret keys — configured / missing only</SectionTitle>
              <Card>
                <CardBody>
                  <SecretRow label="MongoDB URI" configured={settings.mongoConfigured} />
                  <SecretRow label="JWT secret" configured={settings.jwtSecretConfigured} />
                  <SecretRow label="Snippe API key" configured={settings.snippeApiKeyConfigured} />
                  <SecretRow
                    label="Snippe webhook secret"
                    configured={settings.snippeWebhookSecretConfigured}
                  />
                </CardBody>
              </Card>
              <p className="mt-2 text-xs font-medium text-slate-500">
                Secret values are never returned by the API. Only their presence is checked.
              </p>
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
