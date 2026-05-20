"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Folders, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { GradientButton } from "@/components/shared/GradientButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { useCollections } from "@/hooks/useCollections";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "paused" | "closed" | "completed" | "draft";
type SortBy       = "newest" | "collected" | "contributors" | "name";

// ── Static data ───────────────────────────────────────────────────────────────

const STATUS_PILLS: { label: string; value: StatusFilter }[] = [
  { label: "All",       value: "all"       },
  { label: "Active",    value: "active"    },
  { label: "Paused",    value: "paused"    },
  { label: "Closed",    value: "closed"    },
  { label: "Completed", value: "completed" },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: "Newest first",      value: "newest"       },
  { label: "Most collected",    value: "collected"    },
  { label: "Most contributors", value: "contributors" },
  { label: "Name A–Z",          value: "name"         },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const { collections, loading, error, reload } = useCollections();
  const [query,        setQuery]        = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy,       setSortBy]       = useState<SortBy>("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return collections.filter((c) => {
      const matchesQuery  = !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [collections, query, statusFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "newest":       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "collected":    return b.totalCollected - a.totalCollected;
          case "contributors": return b.contributorCount - a.contributorCount;
          case "name":         return a.title.localeCompare(b.title);
          default:             return 0;
        }
      }),
    [filtered, sortBy]
  );

  const hasFilters = query.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
              Your workspace
            </p>
            <h1 className="text-2xl font-extrabold text-[#071a0e] sm:text-3xl">My Collections</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Each collection gets a unique payment link you can share.
            </p>
          </div>
          <Link href="/dashboard/collections/new">
            <GradientButton className="gap-2">
              <Plus className="size-4" /> Create Collection
            </GradientButton>
          </Link>
        </div>

        {/* ── Loading / error ───────────────────────────────────────────── */}
        {loading && <LoadingState variant="cards" />}

        {error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={reload}>
                Retry
              </Button>
            }
          />
        )}

        {/* ── Empty (no collections at all) ─────────────────────────────── */}
        {!loading && !error && collections.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <EmptyState
              icon={<Folders className="size-10 text-muted-foreground/40" />}
              title="No collections yet."
              description="Create your first collection to start raising money and sharing a payment link."
              action={
                <Link href="/dashboard/collections/new">
                  <GradientButton className="gap-2">
                    <Plus className="size-4" /> Create your first collection
                  </GradientButton>
                </Link>
              }
            />
          </motion.div>
        )}

        {/* ── Main list (when collections exist) ──────────────────────────── */}
        {!loading && collections.length > 0 && (
          <div className="flex flex-col gap-4">

            {/* Filter + sort panel */}
            <div className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl">

              {/* Row 1: search input + sort select */}
              <div className="flex flex-col gap-3 sm:flex-row">

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search collections…"
                    className="rounded-2xl border-white/70 bg-white/60 pl-9 pr-9"
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

                {/* Sort */}
                <div className="relative w-full sm:w-48 sm:shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="h-10 w-full appearance-none rounded-2xl border border-input bg-white/70 px-3 pr-8 text-sm font-medium text-[#071a0e] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Row 2: status pills (mobile-scrollable) + clear */}
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 overflow-x-auto pb-0.5">
                  <div className="flex gap-2" style={{ flexWrap: "nowrap" }}>
                    {STATUS_PILLS.map(({ label, value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatusFilter(value)}
                        className={cn(
                          "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                          statusFilter === value
                            ? "bg-[#16a34a] text-white shadow-sm shadow-green-700/20"
                            : "bg-white/70 text-muted-foreground ring-1 ring-border hover:bg-white hover:text-[#071a0e]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear — fixed outside scrollable area */}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Result count */}
            <p className="px-1 text-sm text-muted-foreground">
              {sorted.length === collections.length
                ? `${collections.length} collection${collections.length !== 1 ? "s" : ""}`
                : `${sorted.length} of ${collections.length} collections`}
            </p>

            {/* No-match state or card grid */}
            <AnimatePresence mode="wait">
              {sorted.length === 0 ? (
                <motion.div
                  key="no-match"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    icon={<Search className="size-10 text-muted-foreground/40" />}
                    title="No collections match your filters."
                    description="Try a different search term or status filter."
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
                  className="grid gap-5 sm:grid-cols-2"
                >
                  {sorted.map((c, i) => (
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
