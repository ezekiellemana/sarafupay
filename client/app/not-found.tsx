import Link from "next/link";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { GradientButton } from "@/components/shared/GradientButton";
import { MoneyBag } from "@/components/shared/illustrations/MoneyBag";
import { FloatingCoins } from "@/components/shared/illustrations/FloatingCoins";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-center">
      <FloatingBlobBackground />
      <FloatingCoins count={6} opacity={0.15} />

      <div className="glass-premium relative z-10 flex flex-col items-center gap-6 rounded-3xl px-10 py-14 shadow-2xl shadow-slate-900/10">
        <MoneyBag size={140} animate={true} />
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black leading-tight sarafu-gradient-text-gold">Lost in the vault?</h1>
          <p className="text-lg text-[#0B1F3A] font-semibold mt-1">404 — Page not found</p>
          <p className="mt-2 max-w-sm text-muted-foreground leading-relaxed">
            These coins can&apos;t be found. Let&apos;s get you back to your wallet.
          </p>
        </div>
        <Link href="/">
          <GradientButton btnVariant="gold" className="px-8">
            Return to Wallet
          </GradientButton>
        </Link>
      </div>
    </main>
  );
}
