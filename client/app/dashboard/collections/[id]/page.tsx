"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/formatters";
import { ArrowLeft, Copy, Download, Pause, Pencil, Play, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CollectionStats } from "@/components/collections/CollectionStats";
import { ContributorTable } from "@/components/collections/ContributorTable";
import { PaymentLinkCard } from "@/components/collections/PaymentLinkCard";
import { PaymentStatusChart } from "@/components/collections/PaymentStatusChart";
import { SafeChartContainer } from "@/components/shared/SafeChartContainer";
import { TopContributors } from "@/components/collections/TopContributors";
import { collectionsApi, COLLECTION_TYPE_EMOJIS, COLLECTION_TYPE_LABELS } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import { useCollectionSummary, useCollectionPayments, useWithdrawalData } from "@/hooks/useCollections";
import { WithdrawalSummaryCard } from "@/components/collections/WithdrawalSummaryCard";
import { WithdrawalHistoryList } from "@/components/collections/WithdrawalHistoryList";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { summary, loading, error, reload } = useCollectionSummary(id);
  const { payments } = useCollectionPayments(id);
  const { summary: withdrawalSummary, withdrawals, reload: reloadWithdrawal } = useWithdrawalData(id);
  const [closing, setClosing] = useState(false);
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

  const handleClose = async () => {
    setClosing(true);
    try {
      await collectionsApi.close(id);
      toast.success("Collection closed.");
      window.location.href = "/dashboard/collections";
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to close collection."));
      setClosing(false);
    }
  };

  const copyPaymentLink = () => {
    const link = summary?.collection.publicPaymentLink;
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Payment link copied!");
    } else {
      toast.error("No payment link available.");
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">

        {/* Back link */}
        <div>
          <Link href="/dashboard/collections">
            <Button variant="ghost" className="gap-2 rounded-2xl text-muted-foreground hover:text-[#071a0e]">
              <ArrowLeft className="size-4" /> My Collections
            </Button>
          </Link>
        </div>

        {loading && !summary && <LoadingState variant="detail" />}
        {error && <ErrorState message={error} />}

        {summary && (
          <>
            {/* ── Zone A: Identity + action chips ─────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Identity */}
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl ring-1 ring-amber-200/60">
                  {COLLECTION_TYPE_EMOJIS[summary.collection.collectionType] ?? "💰"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-extrabold leading-tight text-[#071a0e] sm:text-2xl">
                      {summary.collection.title}
                    </h1>
                    <StatusBadge status={summary.collection.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {COLLECTION_TYPE_LABELS[summary.collection.collectionType] ?? "Custom"}
                    {summary.collection.description ? ` · ${summary.collection.description}` : ""}
                  </p>
                </div>
              </div>

              {/* Action chips — scrollable row on mobile */}
              <div className="-mb-0.5 overflow-x-auto pb-0.5">
                <div className="flex items-center gap-2" style={{ flexWrap: "nowrap" }}>

                  <Link href={`/dashboard/collections/${id}/edit`} className="shrink-0">
                    <Button size="sm" variant="outline" className="h-9 whitespace-nowrap rounded-2xl gap-1.5 px-4">
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 shrink-0 whitespace-nowrap rounded-2xl gap-1.5 px-4"
                    onClick={handleExportCsv}
                  >
                    <Download className="size-3.5" /> Export CSV
                  </Button>

                  {summary.collection.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 min-w-30 shrink-0 whitespace-nowrap rounded-2xl gap-1.5 px-4 text-amber-600 hover:bg-amber-50"
                      onClick={handlePause}
                      disabled={updating}
                    >
                      <Pause className="size-3.5" /> {updating ? "Updating…" : "Pause"}
                    </Button>
                  )}

                  {summary.collection.status === "paused" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 min-w-32 shrink-0 whitespace-nowrap rounded-2xl gap-1.5 px-4 text-[#16a34a] hover:bg-green-50"
                      onClick={handleReactivate}
                      disabled={updating}
                    >
                      <Play className="size-3.5" /> {updating ? "Updating…" : "Reactivate"}
                    </Button>
                  )}

                  {summary.collection.status !== "closed" && (
                    <Dialog>
                      <DialogTrigger
                        disabled={closing}
                        className="inline-flex h-9 min-w-28 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border border-input bg-background px-4 text-sm font-medium text-destructive shadow-xs hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Power className="size-3.5" /> {closing ? "Closing…" : "Close"}
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
                          <Button variant="destructive" onClick={handleClose} disabled={closing}>
                            {closing ? "Closing…" : "Yes, close it"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>

            {/* ── Zone B: Key metrics panel ────────────────────────────────── */}
            <CollectionStats summary={summary} />

            {/* ── Zone C: Payment link panel ───────────────────────────────── */}
            <div className="flex flex-col gap-2">
              {summary.collection.status === "paused" && (
                <p className="px-1 text-xs text-amber-700">
                  ⚠️ This collection is paused — the payment link is inactive. Reactivate to accept new payments.
                </p>
              )}
              {summary.collection.status === "closed" && (
                <p className="px-1 text-xs text-red-600">
                  ⛔ This collection is closed — the payment link is no longer active.
                </p>
              )}
              <PaymentLinkCard collection={summary.collection} />
            </div>

            {/* ── Zone D: Analytics ────────────────────────────────────────── */}
            {payments.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <PaymentStatusChart payments={payments} />
                <TopContributors payments={payments} currency={summary.collection.currency} />
              </div>
            )}

            {summary.monthlyChart.length > 0 && (
              <Card className="border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
                <CardHeader>
                  <CardTitle className="text-[#071a0e]">Collections Over Time</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {summary.monthlyChart.length} month{summary.monthlyChart.length !== 1 ? "s" : ""} of completed payment data
                  </p>
                </CardHeader>
                <CardContent>
                  <SafeChartContainer className="h-64 w-full">
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
                          contentStyle={{ borderRadius: "1rem", border: "1px solid #e5e0d6" }}
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
                  </SafeChartContainer>
                </CardContent>
              </Card>
            )}

            {/* ── Zone E: Contributors ─────────────────────────────────────── */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#071a0e]">
                Contributors{" "}
                <span className="ml-1 text-base font-normal text-muted-foreground">({payments.length})</span>
              </h2>
              <ContributorTable
                payments={payments}
                emptyAction={
                  summary.collection.publicPaymentLink ? (
                    <Button variant="outline" className="gap-2 rounded-2xl" onClick={copyPaymentLink}>
                      <Copy className="size-4" /> Copy Payment Link
                    </Button>
                  ) : undefined
                }
              />
            </section>

            {/* ── Zone F: Withdrawal ───────────────────────────────────────── */}
            {withdrawalSummary && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#071a0e]">Withdraw Funds</h2>
                <WithdrawalSummaryCard
                  summary={withdrawalSummary}
                  collectionId={id}
                  currency={summary.collection.currency}
                  onSuccess={reloadWithdrawal}
                />
                <WithdrawalHistoryList
                  collectionId={id}
                  withdrawals={withdrawals}
                  currency={summary.collection.currency}
                  onSuccess={reloadWithdrawal}
                />
              </section>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
