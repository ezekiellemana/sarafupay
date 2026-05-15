import { PaymentTable } from "@/components/payments/PaymentTable";
import type { Payment } from "@/types";

export function AdminPaymentsTable({ payments }: { payments: Payment[] }) {
  return <PaymentTable payments={payments} />;
}
