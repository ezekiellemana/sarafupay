import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { ShieldCheck } from "lucide-react";
import type { PaymentStatus } from "@/types";

export function PaymentStatusCard({ status }: { status: PaymentStatus }) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>This Month Status</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <PaymentStatusBadge status={status} />
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Webhook verified</p>
      </CardContent>
    </Card>
  );
}
