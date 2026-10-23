import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Link unavailable · SarafuPay", robots: { index: false } };

export default async function PayError({ searchParams }: PageProps<"/pay/error">) {
  const { m } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div className="kanga" />
      <SiteHeader cta={false} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 py-12 text-center">
        <div className="split-coin" aria-hidden>
          <span className="split-half left">S</span>
          <span className="split-half right">S</span>
        </div>
        <h1 className="rise d1 font-display mt-8 text-4xl font-semibold">Link unavailable</h1>
        <p className="rise d2 mt-2 text-ink-soft">{typeof m === "string" ? m : "No money moved."}</p>
        <div className="rise d3 mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/chat" className="btn btn-primary justify-center">Get a new link</Link>
          <Link href="/" className="btn btn-ghost justify-center">Home</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
