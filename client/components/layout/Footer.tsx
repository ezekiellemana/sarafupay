import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-[#035034]/20 bg-[#035034] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-8">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="inline-flex">
              <BrandLogo variant="dark" height={38} />
            </Link>
            <p className="max-w-55 text-sm leading-6 text-white/65">
              Simple, secure payment collection for groups, events, and projects across Tanzania.
            </p>
            <p className="text-xs text-white/45">
              © {new Date().getFullYear()} SarafuPay. All rights reserved.
            </p>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Product</p>
            <Link href="#features" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Features</Link>
            <Link href="#how" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">How it works</Link>
            <Link href="#uses" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Use cases</Link>
          </div>

          {/* Account links */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Account</p>
            <Link href="/login" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Login</Link>
            <Link href="/register" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Create Account</Link>
            <Link href="/dashboard" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Dashboard</Link>
          </div>

          {/* Company links */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Company</p>
            <Link href="/about" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">About</Link>
            <Link href="/terms" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Terms of Service</Link>
            <Link href="/privacy" className="text-sm text-white/75 transition-colors hover:text-[#F2D37A]">Privacy Policy</Link>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-6 sm:flex-row">
          <span className="rounded-full border border-[#C4A237]/40 bg-[#C4A237]/10 px-3 py-1 text-xs font-medium text-[#F2D37A]">
            Payments powered by Snippe
          </span>
          <p className="text-xs text-white/45">
            Powering Payments. Empowering People.
          </p>
        </div>
      </div>
    </footer>
  );
}
