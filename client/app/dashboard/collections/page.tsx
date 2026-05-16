"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Folders, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradientButton } from "@/components/shared/GradientButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { useCollections } from "@/hooks/useCollections";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "paused" | "closed" | "completed" | "draft";

const STATUS_PILLS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Closed", value: "closed" },
  { label: "Completed", value: "completed" },
];

export default function CollectionsPage() {
  const { collections, loading, error, reload } = useCollections();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return collections.filter((c) => {
      const matchesQuery = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [collections, query, statusFilter]);

  const hasFilters = query.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Your workspace"
          title="My Projects & Events"
          description="Create and manage your money collection projects. Each project gets a unique payment link you can share."
          action={
            <Link href="/dashboard/collections/new">
              <GradientButton>
                <Plus className="size-4" /> Create Project/Event
              </GradientButton>
            </Link>
          }
        />

        {loading && <LoadingState />}
        {error && (
          <ErrorState
            message={error}
            action={<Button className="rounded-2xl" variant="outline" onClick={reload}>Retry</Button>}
          />
        )}

        {!loading && !error && collections.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <EmptyState
              icon={<Folders className="size-10 text-muted-foreground/40" />}
              title="No projects yet."
              description="Create your first project or event to start collecting money and sharing a payment link."
              action={
                <Link href="/dashboard/collections/new">
                  <GradientButton>
                    <Plus className="size-4" /> Create your first project
                  </GradientButton>
                </Link>
              }
            />
          </motion.div>
        )}

        {!loading && collections.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Search + status filters */}
            <div className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              {/* Search input */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or description…"
                  className="rounded-2xl pl-9 pr-9 border-white/70 bg-white/60"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#071a0e]"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_PILLS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      "rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                      statusFilter === value
                        ? "bg-[#16a34a] text-white shadow-md shadow-green-700/20"
                        : "bg-white/70 text-muted-foreground ring-1 ring-border hover:bg-white hover:text-[#071a0e]"
                    )}
                  >
                    {label}
                  </button>
                ))}

                {/* Clear filters */}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Result count */}
            <p className="text-sm text-muted-foreground px-1">
              {filtered.length === collections.length
                ? `${collections.length} project${collections.length !== 1 ? "s" : ""}`
                : `${filtered.length} of ${collections.length} projects`}
            </p>

            {/* No-match empty state */}
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div
                  key="no-match"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    icon={<Search className="size-10 text-muted-foreground/40" />}
                    title="No projects match your filters."
                    description={`Try a different search term or status filter.`}
                    action={
                      <Button className="rounded-2xl" variant="outline" onClick={clearFilters}>
                        <X className="mr-1.5 size-4" /> Clear filters
                      </Button>
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {filtered.map((c, i) => (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <CollectionCard collection={c} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
