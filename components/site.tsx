import Link from "next/link";
import { Logo, SandboxBadge } from "@/components/brand";
import { waLink } from "@/lib/channels/whatsapp";

/** Shared public header: logo, a few links, and the one action that matters. */
export function SiteHeader({ cta = true, lang = "en" }: { cta?: boolean; lang?: "sw" | "en" }) {
  const wa = waLink(lang === "sw" ? "Habari SarafuPay 👋" : "Hi SarafuPay 👋");
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="hidden md:inline-flex">
          <SandboxBadge />
        </span>
      </div>
      <nav className="flex items-center gap-5 text-sm font-medium text-ink-soft">
        <Link href="/#how" className="hidden hover:text-ink sm:inline">How it works</Link>
        <Link href="/#trust" className="hidden hover:text-ink sm:inline">Safety</Link>
        <Link href="/pricing" className="hover:text-ink">Pricing</Link>
        {cta ? (
          wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-primary !px-4 !py-2 text-sm">
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start on WhatsApp</span>
            </a>
          ) : (
            <Link href="/chat" className="btn btn-primary !px-4 !py-2 text-sm">
              Try it
            </Link>
          )
        ) : null}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 text-sm sm:py-10 text-ink-soft sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs leading-relaxed">Michango, without the notebook.</p>
        </div>
        <div className="site-foot-cols space-y-2">
          <p className="font-semibold text-ink">Product</p>
          <p><Link href="/#how" className="hover:text-ink">How it works</Link></p>
          <p><Link href="/pricing" className="hover:text-ink">Pricing</Link></p>
          <p><Link href="/chat" className="hover:text-ink">Try it in your browser</Link></p>
        </div>
        <div className="site-foot-cols space-y-2">
          <p className="font-semibold text-ink">Company</p>
          <p>EPRIZE DIGITAL</p>
          <p><Link href="/privacy" className="hover:text-ink">Privacy</Link></p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-ink-soft sm:px-6">
          <p>© {new Date().getFullYear()} EPRIZE DIGITAL</p>
          <p className="flex gap-4 sm:hidden">
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
