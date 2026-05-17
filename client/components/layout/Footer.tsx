import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-emerald-900/40 bg-[#071a0e] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">

          {/* Brand */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link href="/" className="flex items-center">
              <BrandLogo variant="dark" height={38} />
            </Link>
            <p className="mt-1 max-w-[220px] text-center text-xs text-white/40 md:text-left">
              Simple, secure payment collection for events, groups, and projects.
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col items-center gap-3 text-sm md:items-start">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Company</span>
            <Link href="/about" className="text-white/60 transition-colors hover:text-amber-400">About</Link>
            <Link href="/terms" className="text-white/60 transition-colors hover:text-amber-400">Terms of Service</Link>
            <Link href="/privacy" className="text-white/60 transition-colors hover:text-amber-400">Privacy Policy</Link>
          </nav>

          {/* Right column */}
          <div className="flex flex-col items-center gap-3 md:items-end">
            <span className="rounded-full border border-emerald-800/60 bg-emerald-950/60 px-3 py-1 text-xs text-emerald-400">
              Payments powered by Snippe
            </span>
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} SarafuPay. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
