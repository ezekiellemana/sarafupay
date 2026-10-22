import Link from "next/link";
import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site";
import { CoinField } from "@/components/landing/coin-field";
import { Phone3D } from "@/components/landing/phone-3d";
import { FeeCalculator } from "@/components/landing/fee-calculator";
import { Steps3D, type Step } from "@/components/landing/steps-3d";
import { TiltCard } from "@/components/landing/tilt-card";
import { Credit, Photo, type Shot } from "@/components/landing/photo";
import { Provider } from "@/components/provider";
import { waLink } from "@/lib/channels/whatsapp";
import { getRates } from "@/lib/services/settings";
import { rateSummary } from "@/lib/pricing";

const steps: Step[] = [
  {
    n: "01",
    chip: "2 minutes",
    title: "Start in a chat",
    body: "Tell SarafuPay what you're collecting for, in Swahili or English. It asks a few questions and opens the collection on the spot. No forms, no app.",
  },
  {
    n: "02",
    chip: "1 message",
    title: "Share one message",
    body: "Forward the invitation to your groups. Friends pay with mobile money, or by card or PayPal from abroad. Receipts arrive by themselves.",
  },
  {
    n: "03",
    chip: "Every shilling",
    title: "Spend in the open",
    body: "Ask “who hasn't paid?”, nudge pledges, pay the caterer straight to mobile money or a bank. Each payout needs your code and is reported to everyone who gave.",
  },
];

const occasions: { sw: string; en: string; note: string; shot: Shot }[] = [
  {
    sw: "Harusi",
    en: "Weddings and send-offs",
    note: "The wedding committee, without the notebook.",
    shot: { id: "1608009232260-9b527a5bb9bd", page: "BC6s0iEa_CQ", by: "Steward Masweneng", alt: "A bride and groom walk out of church between rows of cheering guests", focus: "50% 60%" },
  },
  {
    sw: "Msiba",
    en: "Funerals",
    note: "Collect fast, show every shilling spent.",
    shot: { id: "1509099896299-af46ad97ff57", page: "SPS796v4KmM", by: "Annie Spratt", alt: "Women in headscarves gathered quietly together", focus: "50% 40%" },
  },
  {
    sw: "Matibabu",
    en: "Medical bills",
    note: "Pay the hospital directly from the pot.",
    shot: { id: "1631217871099-88310a909a32", page: "nR2C9AVzfHY", by: "National Cancer Institute", alt: "A doctor in a white coat talks with a patient", focus: "70% 40%" },
  },
  {
    sw: "Ada ya shule",
    en: "School fees",
    note: "Family and friends, one link.",
    shot: { id: "1536337005238-94b997371b40", page: "83tkHLPgg2Q", by: "Ben White", alt: "A smiling schoolboy writing at his desk in class", focus: "60% 45%" },
  },
  {
    sw: "Vikundi",
    en: "Groups and VICOBA",
    note: "Regular contributions with reminders.",
    shot: { id: "1655720357872-ce227e4164ba", page: "M7ALc3UuX_g", by: "Iwaria Inc.", alt: "Three women in a group meeting going through their records", focus: "55% 50%" },
  },
  {
    sw: "Jamii",
    en: "Churches, mosques and NGOs",
    note: "A public ledger for every project.",
    shot: { id: "1444664361762-afba083a4d77", page: "9cx4-QowgLc", by: "Avel Chuklanov", alt: "A crowd with hands raised in celebration", focus: "50% 35%" },
  },
];

const safety: { title: string; body: React.ReactNode; shot: Shot }[] = [
  {
    title: "The AI can't move money",
    body: "Payouts run only after the organiser replies with a one-time CONFIRM code. That step never goes through the AI.",
    shot: { id: "1688989667243-221eee13cbdb", page: "P4yr0fvEfsc", by: "Divaris Shirichena", alt: "A man checks a code on his phone", focus: "55% 8%" },
  },
  {
    title: "Every payout is broadcast",
    body: "Contributors get a transparency update with the recipient, the purpose, the fees and the provider reference.",
    shot: { id: "1644043350898-2f4ff1e17912", page: "O8SpYxOFnK8", by: "Francis Odeyemi", alt: "Two friends read the same update on their phones", focus: "50% 40%" },
  },
  {
    title: "Payment providers hold the money",
    body: (
      <>
        <Provider name="Snippe" /> collects and pays out mobile money; <Provider name="PayPal" /> handles card and PayPal. SarafuPay keeps the
        records.
      </>
    ),
    shot: { id: "1734255026082-82fdc81991f0", page: "cnVn4Gg4b00", by: "Tunde Buremo", alt: "Traders and buyers around a market stall", focus: "50% 50%" },
  },
  {
    title: "Privacy by role",
    body: "Only the organiser sees who gave what. Everyone else sees totals and the payout ledger.",
    shot: { id: "1714327676544-48dafc3ffa41", page: "PF6JfGfmqOI", by: "Lisa Marie Theck", alt: "A woman looks privately at her phone", focus: "50% 35%" },
  },
];

/** The payment strip: plain words for the ways to pay, official marks for the providers. */
const methods: React.ReactNode[] = [
  "Mobile money",
  <Provider key="s" name="Snippe" />,
  "Bank cards",
  <Provider key="p" name="PayPal" />,
  "40+ Tanzanian banks",
  "Payouts in minutes",
];

const faqs: [string, React.ReactNode][] = [
  [
    "Who pays the fees?",
    <>
      The organiser. Contributors pay exactly what they give. <Provider name="Snippe" /> or <Provider name="PayPal" /> take their fee,
      SarafuPay takes its percentage, and both are shown on every receipt and on the pricing page.
    </>,
  ],
  [
    "Who holds the money?",
    <>
      Licensed payment providers do: <Provider name="Snippe" /> for mobile money and <Provider name="PayPal" /> for card and PayPal payments.
      SarafuPay is the technology and record-keeping layer.
    </>,
  ],
  ["Can the AI send money by itself?", "No. A payout only moves after the organiser replies with a one-time CONFIRM code from their own phone, and that step never goes through the AI."],
  ["Is there a minimum withdrawal?", "No. Withdraw any amount to mobile money or a bank. Fewer, larger withdrawals cost less, because each transfer has its own provider fee."],
  ["Do my friends need an app?", "No. They pay from the link or the chat with the mobile money they already use, or a card if they're abroad."],
];

export default async function Home() {
  await connection();
  const wa = waLink("Habari SarafuPay 👋");
  const rates = await getRates();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <div className="kanga" />
      <SiteHeader />

      {/* ---------- Hero ---------- */}
      <section className="relative">
        <CoinField className="absolute inset-0 -top-24 opacity-60 [mask-image:radial-gradient(70%_22%_at_75%_72%,black_20%,transparent)] lg:opacity-70 lg:[mask-image:radial-gradient(55%_75%_at_80%_45%,black_30%,transparent)]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:pb-24 lg:pt-10">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-paper/80 px-3 py-1 text-xs font-medium text-ink-soft backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-2" /> Payments by <Provider name="Snippe" /> and <Provider name="PayPal" />
            </p>
            <h1 className="rise d1 font-display mt-6 text-[2.9rem] font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.4rem]">
              Michango,
              <br />
              <span className="hero-ink italic">without</span> the
              <br />
              notebook.
            </h1>
            <p className="rise d2 mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              SarafuPay runs your group collection inside WhatsApp. Friends pay with the mobile money they already use, you see
              who has paid in real time, and every payout is reported to everyone who gave.
            </p>
            <div className="rise d3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {wa ? (
                <a href={wa} className="btn btn-primary justify-center" target="_blank" rel="noreferrer">
                  Start a collection on WhatsApp →
                </a>
              ) : null}
              <Link href="/chat" className={`btn ${wa ? "btn-ghost" : "btn-primary"} justify-center bg-paper/70 backdrop-blur-sm`}>
                Try it in your browser
              </Link>
            </div>
            <dl className="rise d4 mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 sm:gap-6">
              {[
                ["0", "apps to install"],
                [rateSummary(rates.snippePayment, "TZS"), "on mobile money, all in"],
                ["100%", "payouts reported"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-display text-2xl font-semibold sm:text-3xl">{k}</dt>
                  <dd className="text-sm text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rise d3">
            <Phone3D />
          </div>
        </div>
      </section>

      {/* ---------- Payment methods ---------- */}
      <section aria-label="Ways to pay" className="border-y border-line bg-paper-2/60 py-4">
        <div className="marquee" aria-hidden>
          <div className="marquee-track">
            {[...methods, ...methods].map((m, i) => (
              <span key={i} className="flex items-center gap-6 font-display text-lg text-ink-soft sm:text-xl">
                {m}
                <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              </span>
            ))}
          </div>
        </div>
        <p className="sr-only">Pay with mobile money, a bank card or PayPal. Payments are processed by Snippe and PayPal.</p>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="scroll-mt-4 bg-forest text-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">How it works</p>
          <h2 className="font-display mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            From the first message to the last shilling, in one chat.
          </h2>
          <div className="mt-14">
            <Steps3D steps={steps} />
          </div>
        </div>
      </section>

      {/* ---------- Occasions ---------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Kwa kila mchango</p>
        <h2 className="font-display mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Built for the way Tanzania collects together.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {occasions.map((o) => (
            <TiltCard key={o.sw} className="photo-card">
              <div className="photo-frame">
                <Photo shot={o.shot} className="photo-img" />
                <div className="photo-shade" aria-hidden />
                <p className="photo-title font-display text-3xl font-semibold text-paper">{o.sw}</p>
                <Credit shot={o.shot} className="absolute right-3 top-3 rounded-full bg-ink/40 px-2 py-1 backdrop-blur-sm" />
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold text-ink">{o.en}</p>
                <p className="mt-1 text-sm text-ink-soft">{o.note}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ---------- Fee calculator ---------- */}
      <section id="fees" className="scroll-mt-4 px-3 sm:px-6">
        <div className="calc-panel mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-5 py-14 sm:px-10 sm:py-16">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-marigold">Honest fees</p>
              <h2 className="font-display mt-3 max-w-xl text-4xl font-semibold leading-tight text-paper sm:text-5xl">
                See exactly what reaches the organiser.
              </h2>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-paper underline underline-offset-4">
              Full pricing →
            </Link>
          </div>
          <FeeCalculator rates={rates} />
        </div>
      </section>

      {/* ---------- Safety ---------- */}
      <section id="trust" className="scroll-mt-4 mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-6 sm:py-24 md:grid-cols-[0.9fr_1.1fr]">
        <div className="md:sticky md:top-8 md:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Safety</p>
          <h2 className="font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            In a group collection, trust is the whole product.
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
            The AI makes SarafuPay easy to talk to. Moving money stays deterministic, double-checked and in your hands.
          </p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2">
          {safety.map((c) => (
            <li key={c.title}>
              <TiltCard className="photo-card">
                <div className="photo-frame !aspect-[16/10]">
                  <Photo shot={c.shot} className="photo-img" sizes="(min-width: 768px) 320px, 100vw" />
                  <div className="photo-shade" aria-hidden />
                  <Credit shot={c.shot} className="absolute bottom-3 right-3" />
                </div>
                <div className="p-5">
                  <p className="font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                </div>
              </TiltCard>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6">
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
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-marigold px-6 py-14 text-center sm:py-16">
          <h2 className="font-display mx-auto max-w-2xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Your next michango can start in the next minute.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {wa ? (
              <a href={wa} className="btn btn-primary justify-center" target="_blank" rel="noreferrer">
                Start on WhatsApp →
              </a>
            ) : null}
            <Link href="/chat" className="btn btn-ghost justify-center">Try it in your browser</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
