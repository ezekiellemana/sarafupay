import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/brand";
import { getCollectionById } from "@/lib/services/core";
import { cardsForRecord, chainFor, checkCard, getCard, signingKey, type EvidenceBody } from "@/lib/services/evidence";
import { mask } from "@/lib/services/agent-log";
import { money } from "@/lib/format";
import { detectVisitor } from "@/lib/visitor";
import { VerifyButton } from "./verify-button";

export const metadata = { title: "SarafuPay — payment evidence", robots: { index: false } };

const words = {
  en: {
    title: "Payment evidence",
    card: "Evidence card",
    of: "in the chain for",
    verdict: { ok: "Checks out", duplicate: "Duplicate", mismatch: "Doesn't match the pledge", review: "Needs review" } as Record<string, string>,
    action: { recorded: "Recorded by the organiser", claimed: "Claimed by the payer", confirmed: "Confirmed by the organiser", rejected: "Rejected by the organiser" } as Record<string, string>,
    paid: "paid",
    ref: "Reference",
    on: "on",
    crops: "What the receipt says",
    cropBy: "region by",
    read: "Read again on its own:",
    matches: "matches the record",
    differs: "differs from the record",
    checks: "Checks",
    compared: (n: number) => `${n} ledger row${n === 1 ? "" : "s"} compared`,
    decided: "Decided by",
    organiser: "the organiser",
    rules: "SarafuPay's rules",
    history: "This payment's history",
    integrity: "Integrity",
    hash: "Content matches its fingerprint (sha256)",
    sig: "Signed by SarafuPay (Ed25519)",
    link: "Linked to the card before it",
    chain: (n: number) => `Whole chain of ${n} card${n === 1 ? "" : "s"} intact`,
    chainBroken: (at: number) => `Chain broken at card #${at}`,
    devKey: "Signed with a development key: this is a test deployment.",
    verify: { idle: "Verify in my browser", busy: "Verifying…", ok: "Signature valid", bad: "Doesn't verify", unsupported: "This browser can't check Ed25519 signatures yet." },
    raw: "Signed data (JSON)",
    outside: "Money paid outside SarafuPay is shown for transparency. It isn't in the SarafuPay balance and can't be withdrawn here.",
    back: "Back to",
  },
  sw: {
    title: "Ushahidi wa malipo",
    card: "Kadi ya ushahidi",
    of: "katika mnyororo wa",
    verdict: { ok: "Iko sawa", duplicate: "Imerudiwa", mismatch: "Hailingani na ahadi", review: "Inahitaji ukaguzi" } as Record<string, string>,
    action: { recorded: "Imerekodiwa na mratibu", claimed: "Imedaiwa na mlipaji", confirmed: "Imethibitishwa na mratibu", rejected: "Imekataliwa na mratibu" } as Record<string, string>,
    paid: "alilipa",
    ref: "Kumbukumbu",
    on: "tarehe",
    crops: "Risiti inasema nini",
    cropBy: "eneo na",
    read: "Imesomwa upya peke yake:",
    matches: "inalingana na rekodi",
    differs: "hailingani na rekodi",
    checks: "Ukaguzi",
    compared: (n: number) => `safu ${n} za leja zimelinganishwa`,
    decided: "Uamuzi wa",
    organiser: "mratibu",
    rules: "kanuni za SarafuPay",
    history: "Historia ya malipo haya",
    integrity: "Uadilifu",
    hash: "Maudhui yanalingana na alama yake (sha256)",
    sig: "Imesainiwa na SarafuPay (Ed25519)",
    link: "Imeunganishwa na kadi iliyotangulia",
    chain: (n: number) => `Mnyororo mzima wa kadi ${n} uko salama`,
    chainBroken: (at: number) => `Mnyororo umekatika kwenye kadi #${at}`,
    devKey: "Imesainiwa kwa ufunguo wa majaribio: hii ni seva ya majaribio.",
    verify: { idle: "Thibitisha kwenye kivinjari changu", busy: "Inathibitisha…", ok: "Sahihi ni halali", bad: "Haithibitiki", unsupported: "Kivinjari hiki bado hakiwezi kukagua sahihi za Ed25519." },
    raw: "Data iliyosainiwa (JSON)",
    outside: "Pesa zilizolipwa nje ya SarafuPay zinaonyeshwa kwa uwazi. Haziko kwenye salio la SarafuPay na haziwezi kutolewa hapa.",
    back: "Rudi kwa",
  },
};

const RULES: Record<string, { en: string; sw: string }> = {
  reference_unique: { en: "Reference not reused", sw: "Kumbukumbu haijatumika tena" },
  not_paid_through_sarafupay: { en: "Not already paid through SarafuPay", sw: "Haijalipwa tayari kupitia SarafuPay" },
  photo_unique: { en: "Photo not reused", sw: "Picha haijatumika tena" },
  currency: { en: "Currency", sw: "Sarafu" },
  pledge: { en: "Pledge", sw: "Ahadi" },
  crop_readback: { en: "Receipt read-back", sw: "Usomaji upya wa risiti" },
};

export default async function ProofPage({ params }: PageProps<"/proof/[id]">) {
  await connection();
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();
  const body = JSON.parse(card.body) as EvidenceBody;
  const [col, chain, history, v] = await Promise.all([getCollectionById(card.collectionId), chainFor(card.collectionId), cardsForRecord(card.recordId), detectVisitor()]);
  const t = v.lang === "sw" ? words.sw : words.en;
  const own = checkCard(card, chain.find((c) => c.seq === card.seq - 1));
  const brokenAt = chain.find((c, i) => {
    const r = checkCard(c, chain[i - 1]);
    return c.seq !== i + 1 || !r.hashOk || !r.sigOk || !r.linkOk;
  })?.seq;
  const key = signingKey();
  const cents = Math.round(body.claim.amount * 100);
  const tone = body.verdict === "ok" ? "bg-forest/10 text-forest" : body.verdict === "duplicate" ? "bg-terracotta/10 text-terracotta" : "bg-marigold/30 text-ink";

  return (
    <div className="relative min-h-screen">
      <div className="kanga" />
      <main className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Logo />
        <p className="mt-8 text-xs uppercase tracking-widest text-ink-soft">
          {t.card} #{card.seq} {t.of} {col?.title ?? "—"}
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold">{t.title}</h1>

        <section className="card mt-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>{t.verdict[body.verdict] ?? body.verdict}</span>
            <span className="rounded-full bg-paper-2 px-3 py-1 text-sm text-ink-soft">{t.action[body.action]}</span>
          </div>
          <p className="mt-4 text-lg">
            <strong>{body.claim.payer}</strong> {t.paid} <strong>{money(cents, body.claim.currency)}</strong>
            <span className="text-ink-soft"> · {body.claim.method.replace("_", " ")}</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {body.claim.reference ? (
              <>
                {t.ref} <span className="font-mono text-ink">{body.claim.reference}</span>
              </>
            ) : null}
            {body.claim.received_on ? ` · ${t.on} ${body.claim.received_on}` : null}
          </p>
          <p className="mt-3 text-xs text-ink-soft">{t.outside}</p>
        </section>

        {body.crops.length ? (
          <section className="card mt-4 p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">{t.crops}</h2>
            <ul className="mt-3 space-y-4">
              {body.crops.map((c) => (
                <li key={c.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- stored crops, served from our own media route */}
                  <img src={c.url} alt={`${c.field} on the receipt`} className="max-h-24 w-auto max-w-full rounded-lg border border-line bg-white" />
                  <p className="mt-1.5 text-sm">
                    <span className="font-semibold capitalize">{c.field}</span>
                    <span className="text-ink-soft"> · {t.cropBy} {c.boxBy}</span>
                  </p>
                  {c.read !== null ? (
                    <p className="text-sm">
                      {t.read} <span className="font-mono">{mask(c.read)}</span>{" "}
                      {c.matches === true ? <span className="text-forest">✓ {t.matches}</span> : c.matches === false ? <span className="text-terracotta">✗ {t.differs}</span> : null}
                      {c.readBy ? <span className="text-ink-soft"> · {c.readBy}</span> : null}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {body.checks.length ? (
          <section className="card mt-4 p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">{t.checks}</h2>
            <ul className="mt-3 space-y-2.5">
              {body.checks.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${c.result === "pass" ? "bg-forest/15 text-forest" : c.result === "flag" ? "bg-terracotta/15 text-terracotta" : "bg-paper-2 text-ink-soft"}`}>
                    {c.result === "pass" ? "✓" : c.result === "flag" ? "!" : "i"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{RULES[c.rule]?.[v.lang === "sw" ? "sw" : "en"] ?? c.rule}</p>
                    <p className="text-sm text-ink-soft">{mask(c.detail)}</p>
                    {c.compared.length ? <p className="text-xs text-ink-soft">{t.compared(c.compared.length)}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-soft">
              {t.decided}{" "}
              <span className="font-mono text-ink">
                {body.decided_by.kind === "agent" ? (body.decided_by.model ?? "—") : body.decided_by.kind === "organiser" ? t.organiser : t.rules}
              </span>{" "}
              · {body.at.slice(0, 16).replace("T", " ")} UTC
            </p>
          </section>
        ) : null}

        {history.length > 1 ? (
          <section className="card mt-4 p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">{t.history}</h2>
            <ol className="mt-3 space-y-1.5 text-sm">
              {history.map((h) => {
                const hb = JSON.parse(h.body) as EvidenceBody;
                return (
                  <li key={h.id} className="flex flex-wrap gap-x-3">
                    <span className="font-mono text-xs text-ink-soft">#{h.seq}</span>
                    {h.id === card.id ? <strong>{t.action[hb.action]}</strong> : <Link href={`/proof/${h.id}`} className="underline">{t.action[hb.action]}</Link>}
                    <span className="text-ink-soft">{hb.at.slice(0, 16).replace("T", " ")}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <section className="card mt-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">{t.integrity}</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {[
              [own.hashOk, t.hash],
              [own.sigOk, t.sig],
              [own.linkOk, t.link],
              [brokenAt === undefined, brokenAt === undefined ? t.chain(chain.length) : t.chainBroken(brokenAt)],
            ].map(([ok, label], i) => (
              <li key={i} className={ok ? "text-forest" : "font-semibold text-terracotta"}>
                {ok ? "✓" : "✗"} {label}
              </li>
            ))}
          </ul>
          {key.dev ? <p className="mt-3 rounded-lg bg-marigold/25 px-3 py-2 text-xs">{t.devKey}</p> : null}
          <div className="mt-4">
            <VerifyButton id={card.id} labels={t.verify} />
          </div>
          <p className="mt-3 break-all font-mono text-[11px] text-ink-soft">
            sha256 {card.hash}
            <br />
            key {key.publicKey}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-ink-soft">{t.raw}</summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-paper-2 p-3 text-[11px] leading-relaxed">{JSON.stringify(body, null, 2)}</pre>
          </details>
        </section>

        {col ? (
          <Link href={`/c/${col.code}`} className="btn btn-ghost mt-6">
            {t.back} {col.code}
          </Link>
        ) : null}
      </main>
    </div>
  );
}
