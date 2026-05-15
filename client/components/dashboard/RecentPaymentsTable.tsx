import { EmptyState } from "@/components/shared/EmptyState";
import { PaymentTable } from "@/components/payments/PaymentTable";
import type { Payment } from "@/types";

export function RecentPaymentsTable({ payments }: { payments: Payment[] }) {
  if (!payments.length) {
    return <EmptyState title="No payments yet." description="Start by paying your monthly contribution." />;
  }
  return <PaymentTable payments={payments} />;
}
