import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Logo, Progress } from "@/components/brand";
import { collectionStats, findCollection, getContribution } from "@/lib/services/core";
import { money } from "@/lib/format";
import { Provider } from "@/components/provider";

export default async function Thanks({ params, searchParams }: PageProps<"/c/[code]/thanks">) {
  await connection();
  const { code } = await params;
  const { ctb: ctbId } = await searchParams;
  const col = await findCollection(code);
  if (!col) notFound();
  const ctb = typeof ctbId === "string" ? await getContribution(ctbId) : undefined;
  const stats = await collectionStats(col);
  const paid = ctb?.status === "paid";
  const failed = ctb?.status === "failed";
  const via = ctb?.provider === "snippe" ? ("Snippe" as const) : ("PayPal" as const);
  const ref = ctb?.provider === "snippe" ? ctb.providerRef : ctb?.paypalCaptureId;
  return (
    <div className="min-h-screen">
      <div className="kanga" />
      <main className="mx-auto max-w-lg px-5 py-10 text-center sm:px-6 sm:py-12">
        <Logo />
        {/* While a mobile money payment waits for approval on the payer's phone, check again every 5s. */}
        {ctb && !paid && !failed ? <meta httpEquiv="refresh" content="5" /> : null}
        <div className="card rise mt-8 p-6 sm:mt-10 sm:p-8">
          <p className="text-5xl">{paid ? "🎉" : failed ? "😕" : "⏳"}</p>
          <h1 className="font-display mt-4 text-3xl font-semibold">{paid ? "Asante sana!" : failed ? "Payment not completed" : "Almost there"}</h1>
          <p className="mt-2 text-ink-soft">
            {paid
              ? `${money(ctb!.amountCents, ctb!.currency)} received for ${col.title}.`
              : failed
                ? "No money moved. You can try again from the collection page."
                : ctb?.provider === "snippe"
                  ? "Approve the payment in the prompt on your phone. This page updates by itself."
                  : <>Waiting for <Provider name={via} /> to confirm your payment. This page updates by itself.</>}
          </p>
          {paid && ref ? <p className="mt-2 font-mono text-xs text-ink-soft"><Provider name={via} /> ref {ref}</p> : null}
          <div className="mt-6 text-left">
            <Progress percent={stats.percent} />
            <p className="mt-2 text-sm text-ink-soft">
              {money(stats.raisedCents, col.currency)} of {money(col.targetCents, col.currency)} · {stats.paidCount} {stats.paidCount === 1 ? "contribution" : "contributions"}
            </p>
          </div>
          <Link href={`/c/${col.code}`} className="btn btn-ghost mt-8">Back to the collection</Link>
        </div>
      </main>
    </div>
  );
}
