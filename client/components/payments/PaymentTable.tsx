import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PaymentReceiptDialog } from "@/components/payments/PaymentReceiptDialog";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

export function PaymentTable({ payments, onRetry }: { payments: Payment[]; onRetry?: (payment: Payment) => void }) {
  return (
    <>
    <div className="hidden overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment._id}>
              <TableCell>{formatDate(payment.paidAt ?? payment.createdAt)}</TableCell>
              <TableCell>{payment.monthPaidFor}</TableCell>
              <TableCell>{formatMoney(payment.amount, payment.currency)}</TableCell>
              <TableCell><PaymentStatusBadge status={payment.status} /></TableCell>
              <TableCell>{payment.paymentMethod ?? "Snippe"}</TableCell>
              <TableCell className="max-w-40 truncate">{payment.snippeReference ?? payment.externalReference}</TableCell>
              <TableCell className="text-right">
                {payment.status === "completed" ? <PaymentReceiptDialog payment={payment} /> : onRetry ? <Button size="sm" variant="outline" onClick={() => onRetry(payment)}>Retry</Button> : <span className="text-sm text-muted-foreground">-</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <div className="grid gap-3 md:hidden">
      {payments.map((payment) => (
        <div key={payment._id} className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{payment.monthPaidFor}</p>
              <p className="mt-1 text-xl font-bold text-[#0B1F3A]">{formatMoney(payment.amount, payment.currency)}</p>
            </div>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <p>Date: <span className="font-medium text-foreground">{formatDate(payment.paidAt ?? payment.createdAt)}</span></p>
            <p>Method: <span className="font-medium text-foreground">{payment.paymentMethod ?? "Snippe"}</span></p>
            <p className="truncate">Reference: <span className="font-medium text-foreground">{payment.snippeReference ?? payment.externalReference}</span></p>
          </div>
          <div className="mt-4">
            {payment.status === "completed" ? <PaymentReceiptDialog payment={payment} /> : onRetry ? <Button size="sm" variant="outline" onClick={() => onRetry(payment)}>Retry payment</Button> : null}
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
