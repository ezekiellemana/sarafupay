import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-[#035034]/20 bg-[#035034] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14">

        {/* Main grid: brand | links (3-col) */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8 md:grid-cols-[1.8fr_1fr_1fr_1fr] md:gap-10">

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <Link href="/" className="inline-flex">
              <BrandLogo variant="dark" height={48} />
            </Link>
            <p className="max-w-64 text-sm leading-6 text-white/85">
              Simple, secure payment collection for groups, events, and projects across Tanzania.
            </p>
          </div>

          {/* Link groups — sm: stacked beside brand; md: 4 equal cols */}
          <div className="flex flex-col gap-8 md:col-span-3 md:flex-row md:gap-10">

            {/* Product */}
            <div className="flex-1">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/60">Product</p>
              <div className="flex flex-col gap-0.5">
                <Link href="#features" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Features</Link>
                <Link href="#how" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">How it works</Link>
                <Link href="#uses" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Use cases</Link>
                <Link href="/pricing" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Pricing</Link>
                <Link href="/faq" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">FAQ</Link>
              </div>
            </div>

            {/* Account */}
            <div className="flex-1">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/60">Account</p>
              <div className="flex flex-col gap-0.5">
                <Link href="/login" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Login</Link>
                <Link href="/register" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Create Account</Link>
                <Link href="/dashboard" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Dashboard</Link>
              </div>
            </div>

            {/* Company */}
            <div className="flex-1">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/60">Company</p>
              <div className="flex flex-col gap-0.5">
                <Link href="/about" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">About</Link>
                <Link href="/contact" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Contact</Link>
                <Link href="/terms" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Terms of Service</Link>
                <Link href="/privacy" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Privacy Policy</Link>
                <Link href="/refund-policy" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Refund Policy</Link>
                <Link href="/withdrawal-policy" className="py-1.5 text-sm text-white/90 transition-colors hover:text-[#F2D37A]">Withdrawal Policy</Link>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} SarafuPay. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-full border border-[#C4A237]/40 bg-[#C4A237]/10 px-3 py-1 text-xs font-medium text-[#F2D37A]">
              Payments powered by Snippe
            </span>
            <p className="text-xs text-white/65">Powering Payments. Empowering People.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
