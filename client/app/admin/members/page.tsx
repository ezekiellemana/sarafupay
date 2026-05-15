"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MembersTable } from "@/components/admin/MembersTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { api, getApiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { PageHeader } from "@/components/shared/PageHeader";
import type { Member } from "@/types";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    const path = `/api/admin/members${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`;
    api<{ members: Member[] }>(path)
      .then((res) => {
        setMembers(res.data.members);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load members.")))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Member records" title="Members" description="Search members and review payment coverage." />
        <Input className="max-w-md" placeholder="Search by name, email, phone" value={search} onChange={(event) => setSearch(event.target.value)} />
        {loading && <LoadingState label="Loading members..." />}
        {error && <ErrorState message={error} action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>} />}
        {!loading && !error && (members.length ? <MembersTable members={members} /> : <EmptyState title="No members found." description="Registered members will appear here." />)}
      </div>
    </DashboardShell>
  );
}
