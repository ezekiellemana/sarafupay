import Link from "next/link";
import { Suspense } from "react";
import { Logo, SandboxBadge } from "@/components/brand";
import { waLink } from "@/lib/channels/whatsapp";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";
import { LangSwitch } from "@/components/lang-switch";

/** Shared public header: logo, a few links, the language switch, and the one action that matters. */
/** `ctaOnPhone={false}` on pages whose hero already shows the same button right below. */
export async function SiteHeader({ cta = true, ctaOnPhone = true }: { cta?: boolean; ctaOnPhone?: boolean }) {
  const v = await detectVisitor();
  const c = copy(v.lang);
  const wa = waLink(c.greet);
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="hidden md:inline-flex">
          <SandboxBadge />
        </span>
      </div>
      <nav className="flex items-center gap-3 text-sm font-medium text-ink-soft sm:gap-5">
        <Link href="/#how" className="hidden hover:text-ink lg:inline">{c.nav.how}</Link>
        <Link href="/#trust" className="hidden hover:text-ink sm:inline">{c.nav.safety}</Link>
        <Link href="/pricing" className="hover:text-ink">{c.nav.pricing}</Link>
        <Suspense fallback={null}>
          <LangSwitch lang={v.lang} />
        </Suspense>
        {cta ? (
          wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className={`btn btn-primary whitespace-nowrap !px-4 !py-2 text-sm ${ctaOnPhone ? "" : "!hidden sm:!inline-flex"}`}>
              <span className="sm:hidden">{c.nav.start}</span>
              <span className="hidden sm:inline">{c.nav.startWa}</span>
            </a>
          ) : (
            <Link href="/chat" className={`btn btn-primary whitespace-nowrap !px-4 !py-2 text-sm ${ctaOnPhone ? "" : "!hidden sm:!inline-flex"}`}>
              {c.nav.tryIt}
            </Link>
          )
        ) : null}
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const c = copy((await detectVisitor()).lang);
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 text-sm sm:py-10 text-ink-soft sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs leading-relaxed">{c.foot.tagline}</p>
        </div>
        <div className="site-foot-cols space-y-2">
          <p className="font-semibold text-ink">{c.foot.product}</p>
          <p><Link href="/#how" className="hover:text-ink">{c.nav.how}</Link></p>
          <p><Link href="/pricing" className="hover:text-ink">{c.nav.pricing}</Link></p>
          <p><Link href="/chat" className="hover:text-ink">{c.foot.tryBrowser}</Link></p>
        </div>
        <div className="site-foot-cols space-y-2">
          <p className="font-semibold text-ink">{c.foot.company}</p>
          <p>EPRIZE DIGITAL</p>
          <p><Link href="/privacy" className="hover:text-ink">{c.foot.privacy}</Link></p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-ink-soft sm:px-6">
          <p>© {new Date().getFullYear()} EPRIZE DIGITAL</p>
          <p className="flex gap-4 sm:hidden">
            <Link href="/pricing">{c.nav.pricing}</Link>
            <Link href="/privacy">{c.foot.privacy}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
