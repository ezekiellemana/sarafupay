import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { CoinStack } from "@/components/shared/illustrations/CoinStack";
import { FloatingCoins } from "@/components/shared/illustrations/FloatingCoins";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <FloatingBlobBackground />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/65 shadow-2xl shadow-slate-900/10 backdrop-blur-xl ring-1 ring-amber-200/20 lg:grid-cols-[0.9fr_1.1fr]">

        {/* Left panel — dark vault */}
        <div className="relative hidden overflow-hidden bg-[#071a0e] p-10 text-white lg:flex lg:flex-col">
          {/* Background blobs inside panel */}
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#4ade80]/15 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 size-40 rounded-full bg-[#F59E0B]/12 blur-3xl" />
          <div className="absolute bottom-1/4 -left-8 size-32 rounded-full bg-[#F59E0B]/10 blur-2xl" />

          <FloatingCoins count={4} opacity={0.12} />

          <Link href="/" className="relative z-10 flex items-center">
            <BrandLogo variant="dark" height={46} />
          </Link>

          <div className="relative z-10 mt-16 flex-1">
            <p className="text-sm text-white/60">Welcome back</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight leading-snug">
              Secure contribution records in one calm dashboard.
            </h1>

            {/* Gold stat box */}
            <div className="mt-8 glass-gold rounded-3xl p-5">
              <p className="text-sm text-amber-800/80 font-medium">Secure contributions</p>
              <p className="mt-2 text-3xl font-bold sarafu-gradient-text-gold">Per project</p>
              <div className="mt-3 flex items-center gap-2">
                <GoldCoin size={18} animate={false} />
                <span className="text-xs text-amber-700/70">Webhook-verified payments</span>
              </div>
            </div>
          </div>

          {/* Coin stack at the bottom */}
          <div className="relative z-10 flex justify-center pt-6">
            <CoinStack size={100} animate={true} />
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-col items-center justify-center p-6 md:p-10">
          <div className="mb-6 flex items-center lg:hidden">
            <Link href="/" className="flex items-center">
              <BrandLogo variant="light" height={38} />
            </Link>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
