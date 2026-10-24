import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinField } from "@/components/landing/coin-field";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";

export const metadata = { title: "Not found · SarafuPay" };

export default async function NotFound() {
  const c = copy((await detectVisitor()).lang);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div className="kanga" />
      <SiteHeader />
      <main className="relative flex flex-1 items-center justify-center px-5 py-16 text-center">
        <CoinField className="absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_70%_at_50%_50%,transparent_30%,black)]" />
        <div className="relative">
          <p className="four04 font-display" aria-hidden>404</p>
          <h1 className="rise d1 font-display mt-2 text-3xl font-semibold sm:text-4xl">{c.notFound.title}</h1>
          <div className="rise d2 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn btn-primary justify-center">{c.notFound.home}</Link>
            <Link href="/pricing" className="btn btn-ghost justify-center">{c.nav.pricing}</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
