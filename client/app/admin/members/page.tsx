"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MembersTable } from "@/components/admin/MembersTable";
import { MemberDetailDrawer } from "@/components/admin/MemberDetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { api, getApiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { Member } from "@/types";

const LIMIT = 25;

type StatusFilter = "all" | "active" | "inactive";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  inactive: "Inactive",
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
    if (statusFilter === "active") params.set("isActive", "true");
    if (statusFilter === "inactive") params.set("isActive", "false");
    params.set("page", String(page));
    params.set("limit", String(LIMIT));

    api<{ members: Member[]; total: number; page: number; totalPages: number; limit: number }>(
      `/api/admin/members?${params}`
    )
      .then((res) => {
        setMembers(res.data.members);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load members."));
        setLoading(false);
      });
  }, [debouncedSearch, statusFilter, page]);

  const handleStatusChange = (memberId: string, isActive: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m._id === memberId ? { ...m, isActive } : m)),
    );
    setSelectedMember((prev) =>
      prev?._id === memberId ? { ...prev, isActive } : prev,
    );
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd   = Math.min(page * LIMIT, total);

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Member records"
          title="Members"
          description="Search, filter, and inspect all platform members."
        />

        {/* Search + filter row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            className="h-11 max-w-md rounded-2xl"
            placeholder="Search by name, email, or phone"
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
            Showing {rangeStart}–{rangeEnd} of {total} member{total !== 1 ? "s" : ""}
          </p>
        )}

        {/* States */}
        {loading && <LoadingState label="Loading members…" />}
        {!loading && error && (
          <ErrorState
            message={error}
            action={
              <Button className="rounded-2xl" variant="outline" onClick={() => setPage((p) => p)}>
                Retry
              </Button>
            }
          />
        )}
        {!loading && !error && members.length === 0 && (
          <EmptyState
            icon={<Users />}
            title="No members found."
            description={
              statusFilter !== "all"
                ? `No ${statusFilter} members match your search.`
                : "Registered members will appear here."
            }
          />
        )}
        {!loading && !error && members.length > 0 && (
          <MembersTable
            members={members}
            onView={(member) => setSelectedMember(member)}
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

      {/* Member detail drawer — always mounted for smooth animation */}
      <MemberDetailDrawer
        member={selectedMember}
        open={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        onStatusChange={handleStatusChange}
      />
    </DashboardShell>
  );
}
