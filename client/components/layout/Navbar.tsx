"use client";

import Link from "next/link";
import { ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-[#0B1F3A]">
          <span className="relative flex size-9 items-center justify-center rounded-xl bg-[#0B1F3A] text-white coin-glow">
            <WalletCards className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold">SarafuPay</span>
            <span className="text-[10px] sarafu-gradient-text-gold font-semibold tracking-wide">Lipa kwa urahisi</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/#features" className="hover:text-[#0B1F3A] transition-colors">Features</Link>
          <Link href="/#how" className="hover:text-[#0B1F3A] transition-colors">How it works</Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[#16A34A] ring-1 ring-emerald-200/60 text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            Secure records
          </span>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="rounded-2xl">Login</Button>
          </Link>
          <Link href="/payment/start">
            <GradientButton btnVariant="gold">
              <span className="hidden sm:inline">Pay </span>Contribution
            </GradientButton>
          </Link>
        </div>
      </div>
    </header>
  );
}
