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
import { Users } from "lucide-react";
import type { Member } from "@/types";

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
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter === "active") params.set("isActive", "true");
    if (statusFilter === "inactive") params.set("isActive", "false");
    const path = `/api/admin/members${params.toString() ? `?${params}` : ""}`;

    api<{ members: Member[] }>(path)
      .then((res) => {
        setMembers(res.data.members);
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load members."));
        setLoading(false);
      });
  }, [debouncedSearch, statusFilter]);

  const handleStatusChange = (memberId: string, isActive: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m._id === memberId ? { ...m, isActive } : m)),
    );
    setSelectedMember((prev) =>
      prev?._id === memberId ? { ...prev, isActive } : prev,
    );
  };

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
            className="max-w-md"
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                  statusFilter === f
                    ? "bg-[#0B1F3A] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && <LoadingState label="Loading members…" />}
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
