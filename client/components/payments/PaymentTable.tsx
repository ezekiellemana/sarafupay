import { Button } from "@/components/ui/button";
import { PaymentReceiptDialog } from "@/components/payments/PaymentReceiptDialog";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

function formatMonth(monthStr: string): string {
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1).toLocaleString("en", {
      month: "long",
      year: "numeric",
    });
  }
  return monthStr;
}

export function PaymentTable({ payments, onRetry }: { payments: Payment[]; onRetry?: (payment: Payment) => void }) {
  return (
    <>
      {/* ── Desktop table ───────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e0d6] bg-[#faf7f2]">
              {["Date", "Month", "Amount", "Status", ""].map((h, i) => (
                <th
                  key={i}
                  className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${i === 4 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment._id}
                className="border-b border-[#e5e0d6] transition-colors hover:bg-green-50/50"
              >
                <td className="px-5 py-3.5">
                  <p className="font-medium text-[#071a0e]">{formatDate(payment.paidAt ?? payment.createdAt)}</p>
                  {(payment.snippeReference ?? payment.externalReference) && (
                    <p className="mt-0.5 max-w-40 truncate font-mono text-[10px] text-slate-400">
                      {payment.snippeReference ?? payment.externalReference}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[#071a0e]">{formatMonth(payment.monthPaidFor)}</td>
                <td className="px-5 py-3.5 font-bold text-[#16a34a]">{formatMoney(payment.amount, payment.currency)}</td>
                <td className="px-5 py-3.5"><PaymentStatusBadge status={payment.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  {payment.status === "completed" ? (
                    <PaymentReceiptDialog payment={payment} />
                  ) : onRetry ? (
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onRetry(payment)}>
                      Retry
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {payments.map((payment) => (
          <div
            key={payment._id}
            className="rounded-2xl border border-[#e5e0d6] bg-white p-4 shadow-sm shadow-[#0a1f12]/4"
          >
            {/* Amount + status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-extrabold text-[#16a34a]">{formatMoney(payment.amount, payment.currency)}</p>
                <p className="mt-0.5 text-sm font-medium text-[#071a0e]">{formatMonth(payment.monthPaidFor)}</p>
              </div>
              <PaymentStatusBadge status={payment.status} />
            </div>

            {/* Date + reference */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDate(payment.paidAt ?? payment.createdAt)}</span>
              {(payment.snippeReference ?? payment.externalReference) && (
                <span className="max-w-45 truncate font-mono">
                  {payment.snippeReference ?? payment.externalReference}
                </span>
              )}
            </div>

            {/* Action */}
            {(payment.status === "completed" || onRetry) && (
              <div className="mt-3 border-t border-[#e5e0d6] pt-3">
                {payment.status === "completed" ? (
                  <PaymentReceiptDialog payment={payment} />
                ) : onRetry ? (
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onRetry(payment)}>
                    Retry payment
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
