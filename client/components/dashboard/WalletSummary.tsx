import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { formatMoney } from "@/lib/formatters";

export function WalletSummary({ totalPaid, remainingAmount, progress = 0 }: { totalPaid: number; remainingAmount: number; progress?: number }) {
  const coinsCollected = Math.round((progress / 100) * 12);

  return (
    <Card className="relative overflow-hidden border-0 bg-[#071a0e] text-white shadow-2xl shadow-green-950/25">
      {/* Enhanced glow blobs */}
      <div className="absolute -right-20 -top-20 size-80 rounded-full bg-[#4ade80]/25 blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 size-72 rounded-full bg-[#F59E0B]/12 blur-3xl" />
      <div className="absolute -left-10 top-1/2 size-56 rounded-full bg-[#F59E0B]/8 blur-3xl" />

      <CardContent className="relative z-10 flex flex-col gap-7 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15">
            <ShieldCheck className="size-3.5 text-amber-400" />
            Webhook verified wallet
          </span>
          <p className="mt-5 text-sm text-white/60">SarafuPay wallet summary</p>
          <div className="shimmer-gold relative mt-2 inline-block rounded-lg">
            <p className="text-4xl font-bold tracking-tight md:text-5xl">
              <AnimatedNumber value={totalPaid} format={(value) => formatMoney(value)} />
            </p>
          </div>
          <p className="mt-2 text-sm text-white/60">
            Remaining: <span className="font-medium text-amber-300">{formatMoney(remainingAmount)}</span>
          </p>
          <div className="mt-5 max-w-md">
            <div className="mb-2 flex justify-between text-xs text-white/60">
              <span>Contribution progress</span>
              <span className="font-semibold text-amber-300">{progress}%</span>
            </div>
            <AnimatedProgressBar value={progress} className="bg-white/12" variant="gold" />
            {/* Coin count row */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs text-white/50">{coinsCollected} of 12 coins collected</span>
              <div className="flex gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block size-2.5 rounded-full border ${i < coinsCollected ? "border-amber-400 bg-amber-400 shadow-sm shadow-amber-400/40" : "border-white/20 bg-white/5"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <Link href="/payment/start">
            <Button className="h-11 w-full rounded-2xl bg-linear-to-r from-amber-500 to-yellow-400 font-semibold text-amber-900 shadow-lg shadow-amber-500/30 transition-[filter] hover:brightness-105">
              Pay This Month <ArrowUpRight className="ml-1 size-4" />
            </Button>
          </Link>
          <Link href="/dashboard/payments">
            <Button className="h-11 w-full rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10" variant="outline">
              View History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
