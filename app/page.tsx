import Link from "next/link";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinField } from "@/components/landing/coin-field";
import { Phone3D } from "@/components/landing/phone-3d";
import { FeeCalculator } from "@/components/landing/fee-calculator";
import { HowShow } from "@/components/landing/how-show";
import { TiltCard } from "@/components/landing/tilt-card";
import { Belt } from "@/components/landing/belt";
import { Photo, type Shot } from "@/components/landing/photo";
import { ScrollFX } from "@/components/scroll-fx";
import { Mark, MarkTile, PAY_WITH, PAYOUT_TO } from "@/components/provider";
import { waLink } from "@/lib/channels/whatsapp";
import { getRates } from "@/lib/services/settings";
import { rateSummary } from "@/lib/pricing";

const occasions: { sw: string; en: string; shot: Shot }[] = [
  { sw: "Harusi", en: "Weddings", shot: { name: "harusi", alt: "A bride and groom walk out of church as guests cheer", focus: "50% 45%" } },
  { sw: "Msiba", en: "Funerals", shot: { name: "msiba", alt: "Family and neighbours sit together under a tree", focus: "50% 55%" } },
  { sw: "Matibabu", en: "Medical bills", shot: { name: "matibabu", alt: "A doctor talks with a patient and her family", focus: "60% 50%" } },
  { sw: "Ada ya shule", en: "School fees", shot: { name: "ada", alt: "Students writing at their desks in a sunny classroom", focus: "45% 50%" } },
  { sw: "Vikundi", en: "Groups & VICOBA", shot: { name: "vikundi", alt: "A women's savings group meets under a tree", focus: "50% 55%" } },
  { sw: "Jamii", en: "Community projects", shot: { name: "jamii", alt: "Villagers building a classroom together", focus: "50% 50%" } },
];

const safety: { title: string; body: string; shot: Shot }[] = [
  { title: "The AI can't move money", body: "Every payout needs your one-time code.", shot: { name: "code", alt: "A young man reads a message on his phone", focus: "50% 40%" } },
  { title: "Every payout is reported", body: "Everyone who gave gets the receipt.", shot: { name: "broadcast", alt: "Friends smile at the same update on their phones", focus: "50% 40%" } },
  { title: "Licensed providers hold the money", body: "SarafuPay keeps the records.", shot: { name: "providers", alt: "A shopkeeper confirms a mobile payment", focus: "50% 45%" } },
  { title: "Private by role", body: "Only the organiser sees who gave what.", shot: { name: "privacy", alt: "A woman checks her phone privately", focus: "60% 45%" } },
];

const faqs: [string, string][] = [
  ["Who pays the fees?", "The organiser. Friends pay exactly what they give."],
  ["Who holds the money?", "Licensed payment providers. SarafuPay keeps the records."],
  ["Can the AI send money?", "No. Only your one-time code releases a payout."],
  ["Minimum withdrawal?", "None."],
  ["Do friends need an app?", "No. A link or the chat is enough."],
];

export default async function Home() {
  await connection();
  const wa = waLink("Habari SarafuPay 👋");
  const rates = await getRates();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <ScrollFX />
      <div className="kanga" />
      <SiteHeader />

      {/* ---------- Hero ---------- */}
      <section className="relative">
        <CoinField className="absolute inset-0 -top-24 opacity-60 [mask-image:radial-gradient(70%_22%_at_75%_72%,black_20%,transparent)] lg:opacity-70 lg:[mask-image:radial-gradient(55%_75%_at_80%_45%,black_30%,transparent)]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:pb-24 lg:pt-10">
          <div>
            <p className="rise inline-flex items-center gap-3 rounded-full border border-line bg-paper/80 py-1.5 pl-3 pr-4 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-2" />
              <Mark name="Snippe" height={24} />
              <Mark name="PayPal" height={24} />
              <Mark name="Visa" height={14} />
              <Mark name="Mastercard" height={20} />
            </p>
            <h1 className="rise d1 font-display mt-6 text-[2.9rem] font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.4rem]">
              Michango,
              <br />
              <span className="hero-ink italic">without</span> the
              <br />
              notebook.
            </h1>
            <p className="rise d2 mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              Group collections in one chat. Every shilling reported.
            </p>
            <div className="rise d3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {wa ? (
                <a href={wa} className="btn btn-primary justify-center" target="_blank" rel="noreferrer">
                  Start on WhatsApp →
                </a>
              ) : null}
              <Link href="/chat" className={`btn ${wa ? "btn-ghost" : "btn-primary"} justify-center bg-paper/70 backdrop-blur-sm`}>
                Try it now
              </Link>
            </div>
            <dl className="rise d4 mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 sm:gap-6">
              {[
                ["0", "apps"],
                [rateSummary(rates.snippePayment, "TZS"), "all-in fee"],
                ["100%", "reported"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-display text-2xl font-semibold sm:text-3xl">{k}</dt>
                  <dd className="text-sm text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rise d3 hidden sm:block">
            <Phone3D />
          </div>
        </div>
      </section>

      {/* ---------- Ways to pay and get paid: logos only ---------- */}
      <section aria-label="Ways to pay and withdraw" className="logo-belt space-y-3 border-y border-line bg-paper-2/60 py-6">
        {[PAY_WITH, PAYOUT_TO].map((row, r) => (
          <div key={r} className="marquee">
            <div className={`marquee-track !gap-4 ${r ? "reverse" : ""}`}>
              {[0, 1, 2].flatMap((k) =>
                row.map((m) => (
                  <span key={`${k}-${m}`} aria-hidden={k > 0}>
                    <MarkTile name={m} />
                  </span>
                )),
              )}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- How it works: a short 3D film ---------- */}
      <section id="how" className="scroll-mt-4 overflow-hidden bg-forest text-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div data-reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">How it works</p>
            <h2 className="font-display mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Three steps. One chat.</h2>
          </div>
          <div className="mt-10 sm:mt-14" data-reveal style={{ "--rd": ".1s" } as React.CSSProperties}>
            <HowShow />
          </div>
        </div>
      </section>

      {/* ---------- Occasions ---------- */}
      <section className="mx-auto w-full max-w-6xl py-20 sm:px-6 sm:py-24">
        <div className="px-5 sm:px-0" data-reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Kwa kila mchango</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">For every occasion.</h2>
        </div>
        <div className="mt-8 sm:mt-10" data-reveal style={{ "--rd": ".1s" } as React.CSSProperties}>
          <Belt label="Occasions">
            {occasions.map((o) => (
              <TiltCard key={o.sw} className="photo-card">
                <div className="photo-frame !aspect-[4/5] sm:!aspect-[4/3]">
                  <Photo shot={o.shot} className="photo-img" />
                  <div className="photo-shade" aria-hidden />
                  <div className="photo-title">
                    <p className="font-display text-3xl font-semibold text-paper">{o.sw}</p>
                    <p className="text-sm text-paper/80">{o.en}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </Belt>
        </div>
      </section>

      {/* ---------- Fee calculator ---------- */}
      <section id="fees" className="scroll-mt-4 px-3 sm:px-6">
        <div className="calc-panel mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-5 py-14 sm:px-10 sm:py-16" data-reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">Honest fees</p>
              <h2 className="font-display mt-3 max-w-xl text-4xl font-semibold leading-tight text-paper sm:text-5xl">What reaches you.</h2>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-paper underline underline-offset-4">
              Pricing →
            </Link>
          </div>
          <FeeCalculator rates={rates} />
        </div>
      </section>

      {/* ---------- Safety ---------- */}
      <section id="trust" className="scroll-mt-4 mx-auto w-full max-w-6xl py-20 sm:px-6 sm:py-24">
        <div className="px-5 sm:px-0" data-reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Safety</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Trust is the product.</h2>
        </div>
        <div className="mt-8 sm:mt-10" data-reveal style={{ "--rd": ".1s" } as React.CSSProperties}>
          <Belt label="Safety">
            {safety.map((c) => (
              <TiltCard key={c.title} className="photo-card">
                <div className="photo-frame">
                  <Photo shot={c.shot} className="photo-img" />
                  <div className="photo-shade" aria-hidden />
                </div>
                <div className="p-5">
                  <p className="font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{c.body}</p>
                </div>
              </TiltCard>
            ))}
          </Belt>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6" data-reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Questions</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="faq group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="faq-plus grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-soft" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Final call ---------- */}
      <section className="px-3 pb-16 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-marigold px-6 py-16 text-center sm:py-20" data-reveal>
          <CoinField className="absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_80%_at_50%_50%,transparent_35%,black)]" />
          <h2 className="relative font-display mx-auto max-w-2xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Start your michango now.
          </h2>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {wa ? (
              <a href={wa} className="btn btn-primary justify-center" target="_blank" rel="noreferrer">
                Start on WhatsApp →
              </a>
            ) : null}
            <Link href="/chat" className="btn btn-ghost justify-center">Try it now</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
