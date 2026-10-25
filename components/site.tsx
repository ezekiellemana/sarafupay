import Link from "next/link";
import { Suspense } from "react";
import { Logo, SandboxBadge } from "@/components/brand";
import { waLink } from "@/lib/channels/whatsapp";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";
import { LangSwitch } from "@/components/lang-switch";
import { WhatsAppGlyph } from "@/components/icons";

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
            <a href={wa} target="_blank" rel="noreferrer" className={`btn btn-primary gap-2 whitespace-nowrap !px-4 !py-2 text-sm ${ctaOnPhone ? "" : "!hidden sm:!inline-flex"}`}>
              <WhatsAppGlyph size={16} />
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

/** One quiet line: the header already carries the menu, so the footer doesn't repeat it. */
export async function SiteFooter() {
  const c = copy((await detectVisitor()).lang);
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-6 text-sm text-ink-soft sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden text-xs sm:inline">© {new Date().getFullYear()} EPRIZE DIGITAL</span>
        </div>
        <nav className="flex items-center gap-5 text-xs">
          <Link href="/chat" className="hover:text-ink">{c.foot.tryBrowser}</Link>
          <Link href="/privacy" className="hover:text-ink">{c.foot.privacy}</Link>
          <span className="sm:hidden">© {new Date().getFullYear()} EPRIZE DIGITAL</span>
        </nav>
      </div>
    </footer>
  );
}
