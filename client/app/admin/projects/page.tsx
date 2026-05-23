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
import { FolderKanban } from "lucide-react";
import type { AdminCollection } from "@/types";

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
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const path = `/api/admin/collections${params.toString() ? `?${params}` : ""}`;

    api<{ collections: AdminCollection[] }>(path)
      .then((res) => {
        setCollections(res.data.collections);
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load collections."));
        setLoading(false);
      });
  }, [debouncedSearch, statusFilter]);

  const handleStatusChange = (collectionId: string, status: AdminCollection["status"]) => {
    setCollections((prev) =>
      prev.map((c) => (c._id === collectionId ? { ...c, status } : c))
    );
    setSelected((prev) =>
      prev?._id === collectionId ? { ...prev, status } : prev
    );
  };

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

        {loading && <LoadingState label="Loading collections…" />}
        {error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>
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
