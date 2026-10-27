import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Logo, Progress } from "@/components/brand";
import { collectionStats, findCollection } from "@/lib/services/core";
import { money } from "@/lib/format";
import { TiltCard } from "@/components/landing/tilt-card";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";
import { collectionUrl } from "@/lib/services/links";
import { payStatus } from "@/lib/services/pay-status";
import { PaymentStatus, type CardFlag } from "./payment-status";

export const metadata = { title: "Your payment · SarafuPay", robots: { index: false } };

/** Where every payment lands: waiting for the PIN, confirming, thank you, or what went wrong. */
export default async function Thanks({ params, searchParams }: PageProps<"/c/[code]/thanks">) {
  await connection();
  const { code } = await params;
  const { ctb: ctbId, card } = await searchParams;
  const col = await findCollection(code);
  if (!col) notFound();
  const v = await detectVisitor();
  const status = typeof ctbId === "string" ? await payStatus(ctbId) : null;
  const flag: CardFlag = card === "returned" || card === "cancelled" || card === "declined" ? card : null;
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="kanga" />
      <main className="relative mx-auto max-w-lg px-5 py-10 text-center sm:px-6 sm:py-12">
        <Logo />
        <div className="rise mt-8 sm:mt-10">
          <TiltCard className="card p-6 sm:p-8">
            {status && status.collection.code === col.code ? (
              <PaymentStatus initial={status} lang={v.lang} flag={flag} shareUrl={collectionUrl(col.code)} />
            ) : (
              <NoPayment code={col.code} title={col.title} lang={v.lang} stats={await collectionStats(col)} target={money(col.targetCents, col.currency)} currency={col.currency} />
            )}
          </TiltCard>
        </div>
      </main>
    </div>
  );
}

function NoPayment(p: { code: string; title: string; lang: "sw" | "en"; stats: { percent: number; raisedCents: number }; target: string; currency: string }) {
  const t = copy(p.lang).payStatus;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">{p.title}</h1>
      <p className="mt-2 text-ink-soft">{t.noMoney}</p>
      <div className="mt-6 text-left">
        <Progress percent={p.stats.percent} />
        <p className="mt-2 text-sm text-ink-soft">{t.progress(money(p.stats.raisedCents, p.currency), p.target)}</p>
      </div>
      <Link href={`/c/${p.code}`} className="btn btn-ghost mt-8 w-full justify-center">
        {t.back} {p.code}
      </Link>
    </>
  );
}
