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
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  FolderKanban,
  Loader2,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import type { AdminCollection, AdminCollectionDetail, Payment } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  monthly_contribution: "Monthly contribution",
  event: "Event",
  wedding: "Wedding",
  birthday: "Birthday",
  charity: "Charity",
  emergency: "Emergency",
  school: "School",
  church: "Church",
  mosque: "Mosque",
  trip: "Trip",
  business: "Business",
  custom: "Custom",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-[#071a0e]">{value ?? "—"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </p>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      title="Copy"
      className="ml-1.5 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
    >
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
    </button>
  );
}

function paymentUserName(p: Payment): string {
  if (p.userId && typeof p.userId === "object" && "fullName" in p.userId)
    return (p.userId as { fullName: string }).fullName;
  return p.customerName ?? "—";
}

interface CollectionDetailDrawerProps {
  collection: AdminCollection | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (collectionId: string, status: AdminCollection["status"]) => void;
}

export function CollectionDetailDrawer({
  collection,
  open,
  onClose,
  onStatusChange,
}: CollectionDetailDrawerProps) {
  const [detail, setDetail] = useState<AdminCollectionDetail | null>(null);
  const [error, setError] = useState("");
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const collectionId = collection?._id ?? null;
  const isLoading = Boolean(collectionId && loadedForId !== collectionId);

  useEffect(() => {
    if (!collectionId) return;
    api<AdminCollectionDetail>(`/api/admin/collections/${collectionId}`)
      .then((res) => {
        setDetail(res.data);
        setConfirmClose(false);
        setActionError("");
        setError("");
        setLoadedForId(collectionId);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Unable to load collection details."));
        setConfirmClose(false);
        setLoadedForId(collectionId);
      });
  }, [collectionId]);

  const handleAction = (newStatus: AdminCollection["status"]) => {
    if (!collectionId) return;
    setActionLoading(true);
    setActionError("");
    api<{ collection: AdminCollection }>(`/api/admin/collections/${collectionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    })
      .then(() => {
        setDetail((prev) =>
          prev
            ? { ...prev, collection: { ...prev.collection, status: newStatus } }
            : prev
        );
        setConfirmClose(false);
        setActionLoading(false);
        onStatusChange(collectionId, newStatus);
      })
      .catch((err: unknown) => {
        setActionError(getApiErrorMessage(err, "Action failed. Please try again."));
        setActionLoading(false);
      });
  };

  const currentStatus = detail?.collection.status ?? collection?.status ?? "active";
  const isActionable = currentStatus !== "closed" && currentStatus !== "completed";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto p-0 sm:max-w-md">

        {/* Header */}
        <SheetHeader className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
              <FolderKanban className="size-6 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base font-bold text-[#071a0e]">
                {collection?.title ?? "Collection"}
              </SheetTitle>
              <SheetDescription className="truncate text-xs">
                {collection?.slug ? `/${collection.slug}` : "No slug"}
              </SheetDescription>
            </div>
            <StatusBadge status={currentStatus} className="shrink-0 text-xs" />
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">

          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading collection details…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && detail && (
            <>
              {/* Details */}
              <section>
                <SectionTitle>Details</SectionTitle>
                <div className="divide-y divide-slate-100">
                  <InfoRow
                    label="Owner"
                    value={
                      detail.collection.owner
                        ? `${detail.collection.owner.fullName} (${detail.collection.owner.email})`
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Slug"
                    value={detail.collection.slug ? `/${detail.collection.slug}` : "—"}
                  />
                  {detail.collection.slug && (
                    <InfoRow
                      label="Public link"
                      value={
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <a
                            href={`https://sarafupay.app/pay/${detail.collection.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#035034] hover:underline underline-offset-2"
                          >
                            <ExternalLink className="size-3 shrink-0" />
                            <span>Open</span>
                          </a>
                          <CopyBtn value={`https://sarafupay.app/pay/${detail.collection.slug}`} />
                        </span>
                      }
                    />
                  )}
                  <InfoRow
                    label="Type"
                    value={
                      TYPE_LABELS[detail.collection.collectionType ?? ""] ??
                      detail.collection.collectionType ??
                      "—"
                    }
                  />
                  <InfoRow label="Visibility" value={detail.collection.visibility} />
                  <InfoRow label="Currency" value={detail.collection.currency} />
                  <InfoRow
                    label="Monthly amt"
                    value={
                      detail.collection.monthlyContributionAmount
                        ? formatMoney(detail.collection.monthlyContributionAmount)
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Suggested"
                    value={
                      detail.collection.suggestedAmount
                        ? formatMoney(detail.collection.suggestedAmount)
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Target"
                    value={
                      detail.collection.targetAmount
                        ? formatMoney(detail.collection.targetAmount)
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Start date"
                    value={
                      detail.collection.startDate
                        ? formatDate(detail.collection.startDate)
                        : "—"
                    }
                  />
                  <InfoRow
                    label="End date"
                    value={
                      detail.collection.endDate
                        ? formatDate(detail.collection.endDate)
                        : "—"
                    }
                  />
                  <InfoRow label="Created" value={formatDate(detail.collection.createdAt)} />
                </div>
              </section>

              {/* Activity */}
              <section>
                <SectionTitle>Activity</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500">Total collected</p>
                    <p className="mt-1.5 text-lg font-bold text-emerald-700">
                      {formatMoney(detail.collection.totalCollected)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500">Contributors</p>
                    <p className="mt-1.5 text-lg font-bold text-blue-700">
                      {detail.collection.contributorCount}
                    </p>
                  </div>
                </div>
              </section>

              {/* Recent payments */}
              <section>
                <SectionTitle>Recent payments</SectionTitle>
                {detail.recentPayments.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                    No payments yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.recentPayments.map((p: Payment) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#071a0e]">
                            {paymentUserName(p)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.monthPaidFor} · {formatDate(p.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-[#071a0e]">
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

        {/* Footer */}
        {!isLoading && !error && detail && (
          <div className="shrink-0 border-t border-slate-100 px-6 py-4">
            {actionError && (
              <p className="mb-3 text-xs text-red-500">{actionError}</p>
            )}

            {!isActionable && (
              <p className="text-center text-sm text-muted-foreground">
                This collection is <strong>{currentStatus}</strong> and cannot be modified.
              </p>
            )}

            {isActionable && !confirmClose && (
              <div className="flex gap-2">
                {currentStatus === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => handleAction("paused")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PauseCircle className="size-4" />
                    )}
                    Pause
                  </Button>
                )}
                {(currentStatus === "paused" || currentStatus === "draft") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleAction("active")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PlayCircle className="size-4" />
                    )}
                    Activate
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setConfirmClose(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="size-4" />
                  Close
                </Button>
              </div>
            )}

            {isActionable && confirmClose && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">
                    Close <strong>{detail.collection.title}</strong>? Members will no longer be
                    able to make payments to this collection.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmClose(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleAction("closed")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    Confirm close
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
