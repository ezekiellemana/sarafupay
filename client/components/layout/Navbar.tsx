"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className="sticky top-4 z-50 mx-3 mt-4 md:mx-6">
      <div
        className={`mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/75 bg-white/88 backdrop-blur-2xl transition-shadow duration-300 ${
          scrolled ? "shadow-2xl shadow-slate-900/12 ring-1 ring-white/60" : "shadow-lg shadow-slate-900/6"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2.5 md:px-5">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center">
            <BrandLogo variant="light" height={40} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="transition-colors duration-200 hover:text-[#035034]"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-[#035034]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex h-9 items-center gap-1.5 rounded-2xl bg-[#C4A237] px-5 text-sm font-bold text-[#035034] shadow-md shadow-[#C4A237]/25 transition-all hover:bg-[#d4af45] hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-2xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden border-t border-slate-100 md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#035034]"
                  >
                    {label}
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl bg-[#035034] px-4 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-[#035034]/20 transition-all hover:bg-[#024028]"
                  >
                    Get Started — Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
