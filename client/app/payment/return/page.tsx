"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { SuccessAnimation } from "@/components/shared/SuccessAnimation";
import { GradientButton } from "@/components/shared/GradientButton";
import { CoinStack } from "@/components/shared/illustrations/CoinStack";
import { FloatingCoins } from "@/components/shared/illustrations/FloatingCoins";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { PaymentStatus } from "@/types";

function PaymentReturnContent() {
  const params = useSearchParams();
  const { user, hydrated } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [message, setMessage] = useState("Your payment is being verified securely.");
  const reference = useMemo(() => params.get("reference") ?? params.get("payment_reference") ?? params.get("session_id") ?? params.get("transaction_id") ?? "", [params]);

  useEffect(() => {
    if (!reference) return;
    api<{ status: PaymentStatus }>(`/api/payments/verify/${reference}`)
      .then((res) => {
        setStatus(res.data.status);
        if (res.data.status === "completed") setMessage("Payment completed successfully. Your wallet has been updated.");
        if (res.data.status === "failed") setMessage("Payment failed. Please try again.");
        if (res.data.status === "pending") setMessage("Payment is still pending. We'll update your dashboard once confirmed.");
      })
      .catch(() => setMessage("Payment is being checked. Webhook confirmation may still be pending."));
  }, [reference]);

  const state = status === "completed" ? "success" : status === "failed" ? "failed" : "pending";
  const isSuccess = state === "success";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <FloatingBlobBackground />
      {isSuccess && <FloatingCoins count={6} opacity={0.22} />}

      <Card className={`glass-premium relative w-full max-w-lg border-0 text-center shadow-2xl shadow-slate-900/10 overflow-hidden`}>
        {/* Success coin decoration */}
        {isSuccess && (
          <motion.div
            className="absolute -right-4 -top-6 opacity-60"
            animate={{ y: [0, -8, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <CoinStack size={80} animate={false} />
          </motion.div>
        )}

        <CardHeader className="gap-4 relative">
          <SuccessAnimation state={state} />
          <CardTitle className={`pt-2 text-2xl font-bold ${isSuccess ? "sarafu-gradient-text-gold" : "text-[#0B1F3A]"}`}>
            {status === "completed" ? "Payment completed!" : status === "failed" ? "Payment failed" : "Checking your payment..."}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4 relative">
          <div><PaymentStatusBadge status={status} /></div>
          <p className="text-muted-foreground">{message}</p>

          {!hydrated || !user ? (
            <div className="w-full rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">Login or create an account to view your contribution dashboard.</p>
              <div className="mt-3 flex gap-2 justify-center">
                <Link href="/login?next=/dashboard">
                  <Button className="rounded-2xl bg-[#0B1F3A] text-white">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="rounded-2xl">Create Account</Button>
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/dashboard">
              <GradientButton btnVariant={isSuccess ? "gold" : "default"}>Open Dashboard</GradientButton>
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-4 py-10">
          <Card className="w-full max-w-lg sarafu-glass border-0 shadow-2xl">
            <CardHeader>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Clock3 />
              </div>
              <CardTitle className="pt-2">Checking your payment...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your payment is being verified securely.</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
