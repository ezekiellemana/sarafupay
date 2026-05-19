"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <BrandLogo variant="light" height={44} />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="#features" className="transition-colors hover:text-[#035034]">Features</Link>
          <Link href="#how" className="transition-colors hover:text-[#035034]">How it works</Link>
          <Link href="#uses" className="transition-colors hover:text-[#035034]">Use cases</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="rounded-2xl text-sm font-medium">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <GradientButton btnVariant="gold" className="text-sm font-semibold">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </GradientButton>
          </Link>
        </div>

      </div>
    </header>
  );
}
