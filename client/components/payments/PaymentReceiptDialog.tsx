"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Payment } from "@/types";

export function PaymentReceiptDialog({ payment }: { payment: Payment }) {
  const printReceipt = () => window.print();
  const reference = payment.snippeReference ?? payment.externalReference;
  const copyReference = async () => {
    await navigator.clipboard.writeText(reference);
    toast.success("Reference copied.");
  };
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Receipt</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>SarafuPay receipt</DialogTitle>
          <DialogDescription>Lipa kwa urahisi.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <ReceiptRow label="Payer" value={payment.customerName ?? "Member"} />
          <ReceiptRow label="Amount" value={formatMoney(payment.amount, payment.currency)} />
          <ReceiptRow label="Status" value={payment.status} />
          <ReceiptRow label="Payment method" value={payment.paymentMethod ?? "Snippe"} />
          <ReceiptRow label="Reference" value={reference} />
          <ReceiptRow label="Month paid for" value={payment.monthPaidFor} />
          <ReceiptRow label="Paid date" value={formatDate(payment.paidAt ?? payment.createdAt)} />
        </div>
        <Separator />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button className="rounded-2xl" onClick={copyReference} variant="outline"><Copy data-icon="inline-start" /> Copy Reference</Button>
          <Button className="rounded-2xl bg-[#0B1F3A] text-white" onClick={printReceipt}>Print / Download Receipt</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-background/80 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
