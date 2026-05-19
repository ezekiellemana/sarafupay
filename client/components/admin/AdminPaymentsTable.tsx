import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

function payerName(p: Payment): string {
  if (p.userId && typeof p.userId === "object" && "fullName" in p.userId)
    return (p.userId as { fullName: string }).fullName;
  return p.customerName ?? "—";
}

function collectionTitle(p: Payment): string {
  if (p.projectId && typeof p.projectId === "object" && "title" in p.projectId)
    return (p.projectId as { title: string }).title;
  return "—";
}

interface AdminPaymentsTableProps {
  payments: Payment[];
  onView?: (payment: Payment) => void;
}

export function AdminPaymentsTable({ payments, onView }: AdminPaymentsTableProps) {
  return (
    <div>
      {/* Desktop table — shown at lg+ due to 8 columns */}
      <div className="hidden overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              {onView && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p._id} className="cursor-pointer" onClick={() => onView?.(p)}>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(p.paidAt ?? p.createdAt)}
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-[#0B1F3A]">{payerName(p)}</p>
                  {p.monthPaidFor && <p className="text-xs text-slate-500">{p.monthPaidFor}</p>}
                </TableCell>
                <TableCell className="max-w-36">
                  <p className="truncate text-sm font-semibold text-[#0B1F3A]">{collectionTitle(p)}</p>
                </TableCell>
                <TableCell className="font-semibold text-[#0B1F3A]">
                  {formatMoney(p.amount, p.currency)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status}>{p.status}</StatusBadge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {p.paymentMethod ?? "—"}
                </TableCell>
                <TableCell className="max-w-36">
                  <p className="truncate text-xs font-mono text-slate-500">
                    {p.snippeReference ?? p.externalReference ?? "—"}
                  </p>
                </TableCell>
                {onView && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-medium"
                      onClick={(e) => { e.stopPropagation(); onView(p); }}
                    >
                      View
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile + tablet cards — shown below lg */}
      <div className="flex flex-col gap-3 lg:hidden">
        {payments.map((p) => (
          <div
            key={p._id}
            className={`rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl ${onView ? "cursor-pointer active:opacity-80" : ""}`}
            onClick={() => onView?.(p)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#0B1F3A]">{payerName(p)}</p>
                <p className="truncate text-xs text-slate-500">{collectionTitle(p)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-[#0B1F3A]">{formatMoney(p.amount, p.currency)}</p>
                <div className="mt-1">
                  <StatusBadge status={p.status}>{p.status}</StatusBadge>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-medium text-slate-600">Date</p>
                <p className="font-medium text-[#0B1F3A]">{formatDate(p.paidAt ?? p.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-600">Method</p>
                <p className="font-medium text-[#0B1F3A]">{p.paymentMethod ?? "—"}</p>
              </div>
            </div>
            {(p.snippeReference ?? p.externalReference) && (
              <p className="mt-2 truncate text-xs font-mono text-slate-500">
                Ref: {p.snippeReference ?? p.externalReference}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
