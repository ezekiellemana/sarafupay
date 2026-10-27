import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/brand";
import { getCollectionById, getContribution, getUser } from "@/lib/services/core";
import { money } from "@/lib/format";
import { isTzPhone } from "@/lib/snippe/client";
import { detectVisitor } from "@/lib/visitor";
import { copy } from "@/lib/copy";
import { PhoneInput } from "@/app/c/[code]/phone-input";
import { sendPromptAction } from "./actions";
import { SendButton } from "./submit";

export const metadata = { title: "Pay with mobile money · SarafuPay", robots: { index: false } };

const PROMPT_FAILED = {
  en: "We couldn't send the prompt. Check the number and try again.",
  sw: "Hatukuweza kutuma ombi. Hakikisha namba na ujaribu tena.",
};

/**
 * Mobile money without a hosted checkout: confirm the number (filled in when we know it), and the
 * PIN prompt goes straight to the phone. Opening this page never sends anything, so a link preview
 * can't trigger a prompt.
 */
export default async function MobilePay({ params, searchParams }: PageProps<"/pay/[id]/mobile">) {
  await connection();
  const { id } = await params;
  const { err } = await searchParams;
  const ctb = id.startsWith("ctb_") ? await getContribution(id) : undefined;
  if (!ctb || ctb.provider !== "snippe") notFound();
  const col = await getCollectionById(ctb.collectionId);
  if (!col) notFound();
  if (ctb.status === "paid") redirect(`/c/${col.code}/thanks?ctb=${ctb.id}`);
  if (ctb.status !== "pending") redirect(`/pay/error?m=${encodeURIComponent("This payment link has already been used")}`);
  const v = await detectVisitor();
  const t = copy(v.lang).mobilePay;
  const contributor = ctb.contributorId ? await getUser(ctb.contributorId) : undefined;
  const known = ctb.payerPhone ?? (contributor && isTzPhone(contributor.phone) ? contributor.phone : "");
  const error = typeof err === "string" ? (err === "prompt" ? PROMPT_FAILED[v.lang] : err) : null;
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="kanga" />
      <main className="relative mx-auto max-w-md px-5 py-10 sm:px-6 sm:py-12">
        <Logo />
        <form action={sendPromptAction.bind(null, ctb.id)} className="card rise mt-8 p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">{t.title}</h1>
          <p className="mt-3 font-display text-3xl font-semibold text-forest">{money(ctb.amountCents, ctb.currency)}</p>
          <p className="mt-1 text-ink-soft">
            {t.to} <strong className="text-ink">{col.title}</strong>
          </p>
          <div className="mt-6">
            <PhoneInput name="phone" defaultValue={known} label={copy(v.lang).chip.number} />
          </div>
          <p className="mt-3 text-sm text-ink-soft">{t.how}</p>
          {error ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-terracotta">
              {error}
            </p>
          ) : null}
          <SendButton label={t.send} busy={t.sending} />
        </form>
      </main>
    </div>
  );
}
