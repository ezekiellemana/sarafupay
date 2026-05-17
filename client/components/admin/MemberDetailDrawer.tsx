"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, FolderKanban, Loader2, UserX, UserCheck } from "lucide-react";
import type { Member, MemberDetail, Payment, Project } from "@/types";

// ─── helpers ───────────────────────────────────────────────────────────────

function paymentProjectTitle(p: Payment): string {
  if (p.projectId && typeof p.projectId === "object" && "title" in p.projectId)
    return (p.projectId as { title: string }).title;
  return "—";
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-[#0B1F3A]">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface MemberDetailDrawerProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (memberId: string, isActive: boolean) => void;
}

export function MemberDetailDrawer({
  member,
  open,
  onClose,
  onStatusChange,
}: MemberDetailDrawerProps) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [error, setError] = useState("");
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const memberId = member?._id ?? null;
  const isLoading = Boolean(memberId && loadedForId !== memberId);

  useEffect(() => {
    if (!memberId) return;
    api<MemberDetail>(`/api/admin/members/${memberId}`)
      .then((res) => {
        setDetail(res.data);
        setConfirmPending(false);
        setActionError("");
        setError("");
        setLoadedForId(memberId);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load member details."));
        setConfirmPending(false);
        setLoadedForId(memberId);
      });
  }, [memberId]);

  const handleToggleStatus = async (newIsActive: boolean) => {
    if (!memberId) return;
    setActionLoading(true);
    setActionError("");
    api<{ user: Member }>(`/api/admin/members/${memberId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: newIsActive }),
    })
      .then(() => {
        setDetail((prev) =>
          prev ? { ...prev, user: { ...prev.user, isActive: newIsActive } } : prev,
        );
        setConfirmPending(false);
        setActionLoading(false);
        onStatusChange(memberId, newIsActive);
      })
      .catch((err: unknown) => {
        setActionError(getApiErrorMessage(err, "Action failed. Please try again."));
        setActionLoading(false);
      });
  };

  const currentIsActive = detail?.user.isActive ?? member?.isActive ?? true;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto p-0 sm:max-w-md">

        {/* Header */}
        <SheetHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold",
                currentIsActive
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-slate-200 text-slate-500",
              )}
            >
              {member?.fullName.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-base font-bold text-[#0B1F3A]">
                {member?.fullName ?? "Member"}
              </SheetTitle>
              <SheetDescription className="truncate text-xs">
                {member?.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading member details…</p>
            </div>
          )}

          {/* Fetch error */}
          {!isLoading && error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Detail content */}
          {!isLoading && !error && detail && (
            <>
              {/* Profile info */}
              <section>
                <SectionTitle>Profile</SectionTitle>
                <div className="divide-y divide-slate-50">
                  <InfoRow label="Name" value={detail.user.fullName} />
                  <InfoRow label="Email" value={detail.user.email} />
                  <InfoRow label="Phone" value={detail.user.phoneNumber} />
                  <InfoRow
                    label="Role"
                    value={
                      <StatusBadge status={detail.user.role === "admin" ? "active" : "draft"}>
                        {detail.user.role}
                      </StatusBadge>
                    }
                  />
                  <InfoRow
                    label="Status"
                    value={
                      <StatusBadge status={detail.user.isActive ? "active" : "closed"}>
                        {detail.user.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                    }
                  />
                  <InfoRow
                    label="Joined"
                    value={(detail.user as Member & { createdAt?: string }).createdAt
                      ? formatDate((detail.user as Member & { createdAt?: string }).createdAt)
                      : "—"}
                  />
                </div>
              </section>

              {/* Payment summary */}
              <section>
                <SectionTitle>Payment activity</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Total paid</p>
                    <p className="mt-1 text-base font-bold text-emerald-700">
                      {formatMoney(detail.user.totalPaid ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Months paid</p>
                    <p className="mt-1 text-base font-bold text-amber-700">
                      {detail.user.paidMonths?.length ?? 0}
                    </p>
                  </div>
                </div>
              </section>

              {/* Collections owned */}
              <section>
                <SectionTitle>
                  Collections owned ({detail.collections.length})
                </SectionTitle>
                {detail.collections.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                    No collections created by this member.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.collections.map((col: Project) => (
                      <div
                        key={col._id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5"
                      >
                        <FolderKanban className="size-4 shrink-0 text-amber-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#0B1F3A]">
                            {col.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(col.monthlyContributionAmount)}/mo
                          </p>
                        </div>
                        <StatusBadge status={col.status} className="text-xs" />
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5">
                      <p className="text-xs text-muted-foreground">
                        Total collected by collections
                      </p>
                      <p className="text-sm font-bold text-emerald-700">
                        {formatMoney(detail.totalCollectedByCollections)}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Recent payments */}
              <section>
                <SectionTitle>Recent payments</SectionTitle>
                {detail.recentPayments.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                    No payment history yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.recentPayments.map((p: Payment) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#0B1F3A]">
                            {paymentProjectTitle(p)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.monthPaidFor} · {formatDate(p.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-[#0B1F3A]">
                            {formatMoney(p.amount)}
                          </span>
                          <StatusBadge status={p.status} className="text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer — status action */}
        {!isLoading && !error && detail && (
          <div className="shrink-0 border-t border-slate-100 px-6 py-4">
            {actionError && (
              <p className="mb-3 text-xs text-red-500">{actionError}</p>
            )}

            {!confirmPending ? (
              /* Initial action button */
              currentIsActive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setConfirmPending(true)}
                >
                  <UserX className="size-4" />
                  Deactivate member
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleToggleStatus(true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserCheck className="size-4" />
                  )}
                  Reactivate member
                </Button>
              )
            ) : (
              /* Confirmation section */
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">
                    Deactivate <strong>{detail.user.fullName}</strong>? They will not be able
                    to log in until reactivated.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmPending(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleToggleStatus(false)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
