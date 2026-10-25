import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinMark } from "@/components/coin-mark";
import { waLink } from "@/lib/channels/whatsapp";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";
import { WhatsAppGlyph } from "@/components/icons";

export const metadata = { title: "SarafuPay has moved", robots: { index: false } };

const CONTACT = "info@sarafupay.app";

/** Landing page for links from the old SarafuPay (see next.config.ts and app/pay/[id]/route.ts). */
export default async function Moved() {
  const t = copy((await detectVisitor()).lang).moved;
  const wa = waLink(t.greet);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div className="kanga" />
      <SiteHeader cta={false} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 py-14 text-center">
        <div className="rise">
          <CoinMark size={96} />
        </div>
        <h1 className="rise d1 font-display mt-8 text-4xl font-semibold leading-tight">{t.title}</h1>
        <p className="rise d2 mt-3 text-ink-soft">
          {t.body}
        </p>
        <div className="rise d3 mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-primary justify-center gap-2">
              <WhatsAppGlyph size={20} />
              {t.wa}
            </a>
          ) : (
            <a href={`mailto:${CONTACT}`} className="btn btn-primary justify-center">
              {t.email} {CONTACT}
            </a>
          )}
          <Link href="/" className="btn btn-ghost justify-center">{t.see}</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
