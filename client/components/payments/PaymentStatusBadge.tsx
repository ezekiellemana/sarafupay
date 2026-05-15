import { StatusBadge } from "@/components/shared/StatusBadge";
import type { PaymentStatus } from "@/types";

const labels: Record<PaymentStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
  unpaid: "Unpaid"
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge status={labels[status].toLowerCase()} />;
}
