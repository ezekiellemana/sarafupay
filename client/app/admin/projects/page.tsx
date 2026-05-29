"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CollectionsTable } from "@/components/admin/CollectionsTable";
import { CollectionDetailDrawer } from "@/components/admin/CollectionDetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { api, getApiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FolderKanban } from "lucide-react";
import type { AdminCollection } from "@/types";

const LIMIT = 25;

type StatusFilter = "all" | "active" | "paused" | "draft" | "closed";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  paused: "Paused",
  draft: "Draft",
  closed: "Closed",
};

export default function AdminProjectsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminCollection | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  // Reset to page 1 whenever search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Fetch on any dependency change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    api<{ collections: AdminCollection[]; total: number; page: number; totalPages: number; limit: number }>(
      `/api/admin/collections?${params}`
    )
      .then((res) => {
        setCollections(res.data.collections);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load collections."));
        setLoading(false);
      });
  }, [debouncedSearch, statusFilter, page, refreshKey]);

  const handleStatusChange = (collectionId: string, status: AdminCollection["status"]) => {
    setCollections((prev) =>
      prev.map((c) => (c._id === collectionId ? { ...c, status } : c))
    );
    setSelected((prev) =>
      prev?._id === collectionId ? { ...prev, status } : prev
    );
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd   = Math.min(page * LIMIT, total);

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Platform collections"
          title="Collections"
          description="Search, filter, and manage all platform collections."
        />

        {/* Search + filter row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            className="h-11 max-w-md rounded-2xl"
            placeholder="Search by title, slug, or owner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full px-4 py-2.5 text-xs font-semibold transition-colors",
                  statusFilter === f
                    ? "bg-[#071a0e] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        {!loading && !error && total > 0 && (
          <p className="text-sm text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {total} collection{total !== 1 ? "s" : ""}
          </p>
        )}

        {loading && <LoadingState label="Loading collections…" />}
        {!loading && error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
                Retry
              </Button>
            }
          />
        )}
        {!loading && !error && collections.length === 0 && (
          <EmptyState
            icon={<FolderKanban />}
            title="No collections found."
            description={
              statusFilter !== "all"
                ? `No ${statusFilter} collections match your search.`
                : "Platform collections will appear here."
            }
          />
        )}
        {!loading && !error && collections.length > 0 && (
          <CollectionsTable
            collections={collections}
            onView={(col) => setSelected(col)}
          />
        )}

        {/* Pagination controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-2xl"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-2xl"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer — always mounted for smooth animation */}
      <CollectionDetailDrawer
        collection={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />
    </DashboardShell>
  );
}
