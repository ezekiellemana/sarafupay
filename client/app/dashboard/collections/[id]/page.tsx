"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Download, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CollectionStats } from "@/components/collections/CollectionStats";
import { ContributorTable } from "@/components/collections/ContributorTable";
import { PaymentLinkCard } from "@/components/collections/PaymentLinkCard";
import { collectionsApi, COLLECTION_TYPE_EMOJIS, COLLECTION_TYPE_LABELS } from "@/lib/collections";
import { getApiErrorMessage } from "@/lib/api";
import { useCollectionSummary, useCollectionPayments } from "@/hooks/useCollections";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { summary, loading, error } = useCollectionSummary(id);
  const { payments } = useCollectionPayments(id);
  const [archiving, setArchiving] = useState(false);

  const handleExportCsv = () => {
    collectionsApi.exportCsv(id);
    toast.success("Downloading contributor list…");
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to close this collection? Contributors won't be able to pay anymore.")) return;
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

        {loading && <LoadingState />}
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
                <Button size="sm" variant="outline" className="rounded-2xl" onClick={handleExportCsv}>
                  <Download className="mr-1.5 size-4" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" className="rounded-2xl text-destructive hover:bg-destructive/5" onClick={handleArchive} disabled={archiving}>
                  <Power className="mr-1.5 size-4" /> {archiving ? "Closing..." : "Close Collection"}
                </Button>
              </div>
            </div>

            {/* Payment link */}
            <PaymentLinkCard collection={summary.collection} />

            {/* Stats cards */}
            <CollectionStats summary={summary} />

            {/* Monthly chart */}
            {summary.monthlyChart.length > 0 && (
              <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-[#071a0e]">Collections Over Time</CardTitle>
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
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", backdropFilter: "blur(12px)" }} />
                      <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} fill="url(#collectionGrad)" />
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
