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
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
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
            {onView && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p._id} className="cursor-pointer">
              <TableCell className="text-xs text-slate-500">
                {formatDate(p.paidAt ?? p.createdAt)}
              </TableCell>
              <TableCell>
                <p className="truncate text-sm font-semibold text-[#0B1F3A]">{payerName(p)}</p>
                <p className="truncate text-xs text-slate-500">{p.monthPaidFor}</p>
              </TableCell>
              <TableCell className="max-w-36 truncate text-sm font-medium text-[#0B1F3A]">
                {collectionTitle(p)}
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
              <TableCell className="max-w-36 truncate text-xs text-slate-500">
                {p.snippeReference ?? p.externalReference}
              </TableCell>
              {onView && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-medium"
                    onClick={() => onView(p)}
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
  );
}
