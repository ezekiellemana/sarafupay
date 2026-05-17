"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <BrandLogo variant="light" height={44} />
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
