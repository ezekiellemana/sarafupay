import Link from "next/link";
import { WalletCards } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";
import { FloatingCoins } from "@/components/shared/illustrations/FloatingCoins";

export default function RegisterPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <FloatingBlobBackground />
      <FloatingCoins count={4} opacity={0.12} />

      {/* Logo bar */}
      <div className="mb-6 flex items-center gap-2 font-semibold text-[#0B1F3A]">
        <Link href="/" className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/75 px-4 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <span className="relative flex size-10 items-center justify-center rounded-xl bg-[#0B1F3A] text-white coin-glow">
            <WalletCards className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#0B1F3A]">SarafuPay</span>
            <span className="text-[10px] sarafu-gradient-text-gold font-semibold">Lipa kwa urahisi</span>
          </div>
          <GoldCoin size={20} animate={false} className="ml-1 opacity-70" />
        </Link>
      </div>

      <RegisterForm />
    </main>
  );
}
