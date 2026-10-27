import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Logo, Progress } from "@/components/brand";
import { checkSnippeContribution, collectionStats, findCollection, getContribution } from "@/lib/services/core";
import { money } from "@/lib/format";
import { CoinField } from "@/components/landing/coin-field";
import { TiltCard } from "@/components/landing/tilt-card";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";
import { Ban } from "@/components/icons";

export default async function Thanks({ params, searchParams }: PageProps<"/c/[code]/thanks">) {
  await connection();
  const { code } = await params;
  const { ctb: ctbId } = await searchParams;
  const col = await findCollection(code);
  if (!col) notFound();
  let ctb = typeof ctbId === "string" ? await getContribution(ctbId) : undefined;
  // While the payer approves the prompt, ask Snippe too, in case its webhook is late or lost.
  if (ctb?.provider === "snippe" && ctb.status === "pending" && ctb.collectionId === col.id) ctb = (await checkSnippeContribution(ctb.id).catch(() => undefined)) ?? ctb;
  const stats = await collectionStats(col);
  const v = await detectVisitor();
  const t = copy(v.lang).thanks;
  const of = copy(v.lang).col.of;
  const paid = ctb?.status === "paid";
  const failed = ctb?.status === "failed";
  const ref = ctb?.provider === "snippe" ? ctb.providerRef : ctb?.paypalCaptureId;
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="kanga" />
      {paid ? <CoinField className="absolute inset-0 opacity-70" /> : null}
      <main className="relative mx-auto max-w-lg px-5 py-10 text-center sm:px-6 sm:py-12">
        <Logo />
        {/* While a mobile money payment waits for approval on the payer's phone, check again every 5s. */}
        {ctb && !paid && !failed ? <meta httpEquiv="refresh" content="5" /> : null}
        <div className="rise mt-8 sm:mt-10"><TiltCard className="card p-6 sm:p-8">
          {paid ? (
            <div className="paid-coin" aria-hidden>
              <span>✓</span>
            </div>
          ) : failed ? (
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-terracotta/10 text-terracotta" aria-hidden>
              <Ban size={32} />
            </span>
          ) : (
            <div className="wait-phone" aria-hidden>
              <div className="wait-screen">
                <p className="text-[9px] font-semibold text-ink-soft">PIN</p>
                <p className="wait-dots"><i /><i /><i /><i /></p>
              </div>
            </div>
          )}
          <h1 className="font-display mt-4 text-3xl font-semibold">{paid ? t.paid : failed ? t.failed : t.waiting}</h1>
          <p className="mt-2 text-ink-soft">
            {paid
              ? t.received(ctb!.payCurrency && ctb!.payAmountCents != null ? money(ctb!.payAmountCents, ctb!.payCurrency) : money(ctb!.amountCents, ctb!.currency), col.title)
              : failed
                ? t.noMoney
                : ctb?.provider === "snippe"
                  ? t.approve
                  : t.confirming}
          </p>
          {paid && ref ? <p className="mt-2 font-mono text-xs text-ink-soft">{t.ref} {ref}</p> : null}
          {ctb?.provider === "snippe" && !paid && !failed ? (
            <Link href={`/pay/${ctb.id}/mobile`} className="mt-3 inline-block text-sm underline">
              {t.resend}
            </Link>
          ) : null}
          <div className="mt-6 text-left">
            <Progress percent={stats.percent} />
            <p className="mt-2 text-sm text-ink-soft">
              {money(stats.raisedCents, col.currency)} {of} {money(col.targetCents, col.currency)}
            </p>
          </div>
          <Link href={`/c/${col.code}`} className="btn btn-ghost mt-8">{t.back} {col.code}</Link>
        </TiltCard></div>
      </main>
    </div>
  );
}
