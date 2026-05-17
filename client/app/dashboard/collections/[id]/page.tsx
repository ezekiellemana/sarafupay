"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/formatters";
import { ArrowLeft, Download, Pause, Pencil, Play, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CollectionStats } from "@/components/collections/CollectionStats";
import { ContributorTable } from "@/components/collections/ContributorTable";
import { PaymentLinkCard } from "@/components/collections/PaymentLinkCard";
import { PaymentStatusChart } from "@/components/collections/PaymentStatusChart";
import { TopContributors } from "@/components/collections/TopContributors";
import { collectionsApi, COLLECTION_TYPE_EMOJIS, COLLECTION_TYPE_LABELS } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import { useCollectionSummary, useCollectionPayments } from "@/hooks/useCollections";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { summary, loading, error, reload } = useCollectionSummary(id);
  const { payments } = useCollectionPayments(id);
  const [archiving, setArchiving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleExportCsv = () => {
    collectionsApi.exportCsv(id);
    toast.success("Downloading contributor list…");
  };

  const handlePause = async () => {
    setUpdating(true);
    try {
      await collectionsApi.update(id, { status: "paused" });
      toast.success("Collection paused.");
      reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to pause collection."));
    } finally {
      setUpdating(false);
    }
  };

  const handleReactivate = async () => {
    setUpdating(true);
    try {
      await collectionsApi.update(id, { status: "active" });
      toast.success("Collection reactivated.");
      reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to reactivate collection."));
    } finally {
      setUpdating(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await collectionsApi.archive(id);
      toast.success("Collection closed.");
      window.location.href = "/dashboard/collections";
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to close collection."));
      setArchiving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/dashboard/collections">
            <Button variant="ghost" className="gap-2 rounded-2xl text-muted-foreground hover:text-[#071a0e]">
              <ArrowLeft className="size-4" /> My Projects
            </Button>
          </Link>
        </div>

        {loading && <LoadingState variant="detail" />}
        {error && <ErrorState message={error} />}

        {summary && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl ring-1 ring-amber-200/60">
                  {COLLECTION_TYPE_EMOJIS[summary.collection.collectionType] ?? "💰"}
                </span>
                <div>
                  <PageHeader
                    eyebrow={COLLECTION_TYPE_LABELS[summary.collection.collectionType]}
                    title={summary.collection.title}
                    description={summary.collection.description || summary.collection.paymentPurpose || ""}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={summary.collection.status} />

                <Link href={`/dashboard/collections/${id}/edit`}>
                  <Button size="sm" variant="outline" className="rounded-2xl">
                    <Pencil className="mr-1.5 size-4" /> Edit
                  </Button>
                </Link>

                <Button size="sm" variant="outline" className="rounded-2xl" onClick={handleExportCsv}>
                  <Download className="mr-1.5 size-4" /> Export CSV
                </Button>

                {summary.collection.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-2xl text-amber-600 hover:bg-amber-50"
                    onClick={handlePause}
                    disabled={updating}
                  >
                    <Pause className="mr-1.5 size-4" /> {updating ? "Updating..." : "Pause"}
                  </Button>
                )}

                {summary.collection.status === "paused" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-2xl text-[#16a34a] hover:bg-green-50"
                    onClick={handleReactivate}
                    disabled={updating}
                  >
                    <Play className="mr-1.5 size-4" /> {updating ? "Updating..." : "Reactivate"}
                  </Button>
                )}

                {summary.collection.status !== "closed" && (
                  <Dialog>
                    <DialogTrigger
                      disabled={archiving}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-input bg-background px-3 py-1.5 text-sm font-medium text-destructive shadow-xs hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Power className="size-4" /> {archiving ? "Closing..." : "Close"}
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Close this collection?</DialogTitle>
                        <DialogDescription>
                          Contributors won&apos;t be able to pay anymore. All existing payments are preserved and stats remain visible.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                        <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
                          {archiving ? "Closing..." : "Yes, close it"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Payment link */}
            <PaymentLinkCard collection={summary.collection} />

            {/* Stats cards */}
            <CollectionStats summary={summary} />

            {/* Analytics: status breakdown + top contributors */}
            {payments.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <PaymentStatusChart payments={payments} />
                <TopContributors payments={payments} currency={summary.collection.currency} />
              </div>
            )}

            {/* Monthly chart */}
            {summary.monthlyChart.length > 0 && (
              <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-[#071a0e]">Collections Over Time</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {summary.monthlyChart.length} month{summary.monthlyChart.length !== 1 ? "s" : ""} of completed payment data
                  </p>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.monthlyChart}>
                      <defs>
                        <linearGradient id="collectionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => {
                          const parts = v.split("-");
                          if (parts.length < 2) return v;
                          return new Date(Number(parts[0]), Number(parts[1]) - 1)
                            .toLocaleString("en", { month: "short", year: "2-digit" });
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
                          : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k`
                          : String(v)
                        }
                        width={48}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", backdropFilter: "blur(12px)" }}
                        formatter={(value: unknown) => [
                          formatMoney(Number(value), summary.collection.currency),
                          "Collected"
                        ]}
                        labelFormatter={(label: unknown) => {
                          const parts = String(label).split("-");
                          if (parts.length < 2) return String(label);
                          return new Date(Number(parts[0]), Number(parts[1]) - 1)
                            .toLocaleString("en", { month: "long", year: "numeric" });
                        }}
                      />
                      <Area type="monotone" dataKey="total" name="Collected" stroke="#16a34a" strokeWidth={2} fill="url(#collectionGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Contributor list */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#071a0e]">
                  Contributors <span className="ml-2 text-base font-normal text-muted-foreground">({payments.length})</span>
                </h2>
                <Button size="sm" variant="outline" className="rounded-2xl" onClick={handleExportCsv}>
                  <Download className="mr-1.5 size-4" /> Export List
                </Button>
              </div>
              <ContributorTable payments={payments} />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
