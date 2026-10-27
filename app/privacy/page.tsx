import { Provider } from "@/components/provider";
import { SiteFooter, SiteHeader } from "@/components/site";
import { ScrollFX } from "@/components/scroll-fx";
import { connection } from "next/server";
import { Ban, EyeOff, IconBadge, Lock, Trash } from "@/components/icons";
import { detectVisitor } from "@/lib/visitor";

export const metadata = {
  title: "Privacy Policy — SarafuPay",
  description: "How SarafuPay handles your data.",
};

const UPDATED = { en: "25 October 2026", sw: "25 Oktoba 2026" };
const CONTACT = "info@sarafupay.app";

const Mail = () => (
  <a className="font-medium text-forest underline underline-offset-4" href={`mailto:${CONTACT}`}>
    {CONTACT}
  </a>
);

const GLANCE_ICONS = [Lock, EyeOff, Ban, Trash];
const GLANCE = {
  en: ["No PINs or card numbers, ever", "Only the organiser sees who gave what", "Never sold, no ads", "Deleted on request"],
  sw: ["Hatuchukui PIN wala namba za kadi", "Mwandaaji pekee anaona nani alitoa nini", "Haziuzwi, hakuna matangazo", "Zinafutwa ukiomba"],
};

type Section = { id: string; title: string; body: React.ReactNode };
const list = (items: React.ReactNode[]) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
);

const SECTIONS: Record<"en" | "sw", Section[]> = {
  en: [
    {
      id: "who",
      title: "Who runs SarafuPay",
      body: (
        <>
          SarafuPay is a group collection service by EPRIZE DIGITAL. Licensed providers hold and move the money:{" "}
          <Provider name="Snippe" /> for mobile money and banks, <Provider name="PayPal" /> for cards and PayPal. SarafuPay keeps the
          records. Contact: <Mail />.
        </>
      ),
    },
    {
      id: "collect",
      title: "What we collect",
      body: list([
        "Your WhatsApp number and profile name, so the assistant can reply.",
        "What you send the assistant: messages, voice notes and photos (such as payment receipts), and its replies.",
        "What you give us: your name, collections, targets, pledges and payout details (mobile money number, bank account or PayPal email).",
        "Payment records from the providers: amounts, fees, references, and the payer's phone number or PayPal name and email.",
        "Money an organiser records as paid outside SarafuPay (cash, their own mobile money), with the receipt details they share.",
        "Never mobile money PINs or card numbers. You approve payments on your own phone or on PayPal.",
      ]),
    },
    {
      id: "use",
      title: "How it is used",
      body: (
        <>
          Only to run the service: collections, pay links, receipts, reminders, progress updates, checking receipts for duplicates,
          and payouts that you confirm with your own code. Public pages show totals, payouts and supporters&apos; first names. Full
          names and amounts are visible only to the organiser, and account numbers are masked. Contributors&apos; weekly updates show
          totals only.
        </>
      ),
    },
    {
      id: "ai",
      title: "The AI assistant",
      body: (
        <>
          An AI reads your messages, voice notes and photos and decides which SarafuPay action to take. It can&apos;t move money: every
          payout needs the organiser&apos;s one-time code. Each action it takes is logged on the organiser&apos;s dashboard, with phone and
          account numbers masked.
        </>
      ),
    },
    {
      id: "processors",
      title: "Who processes it",
      body: (
        <>
          {list([
            "Meta: WhatsApp message delivery, and Meta's Muse models for understanding messages, voice notes and photos and for share cards. Muse Spark Open (Meta's open model) runs on Baseten, which processes messages for us when it answers.",
            <>
              <Provider name="Snippe" />: mobile money payments and payouts to mobile money and banks.
            </>,
            <>
              <Provider name="PayPal" />: card and PayPal payments, and PayPal payouts.
            </>,
            "DigitalOcean: hosting and database.",
          ])}
          <p className="mt-2">We don&apos;t sell your data or use it for advertising.</p>
        </>
      ),
    },
    {
      id: "location",
      title: "Your country and cookies",
      body: (
        <>
          To show prices and examples in your language and currency, the site looks up your country from your IP address when a page
          loads. The IP address isn&apos;t stored for this. Cookies: one remembers the language you pick, and the web chat uses one to
          keep your test session private. No advertising or tracking cookies.
        </>
      ),
    },
    {
      id: "retention",
      title: "Keeping and deleting",
      body: (
        <>
          Data is kept while you use the service, and payment records as long as financial record-keeping requires. Email <Mail /> to
          have your data deleted. Anything not needed for those records is removed within 7 days.
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      body: "Provider messages are signature-checked, organiser dashboards need a private key, and money moves only after the organiser's own code.",
    },
    { id: "changes", title: "Changes", body: "When this policy changes, the date at the top changes too." },
  ],
  sw: [
    {
      id: "who",
      title: "Nani anaendesha SarafuPay",
      body: (
        <>
          SarafuPay ni huduma ya michango ya vikundi ya EPRIZE DIGITAL. Watoa huduma wenye leseni ndio wanashika na kutuma pesa:{" "}
          <Provider name="Snippe" /> kwa pesa ya simu na benki, <Provider name="PayPal" /> kwa kadi na PayPal. SarafuPay inatunza
          kumbukumbu. Mawasiliano: <Mail />.
        </>
      ),
    },
    {
      id: "collect",
      title: "Tunachokusanya",
      body: list([
        "Namba yako ya WhatsApp na jina la wasifu, ili msaidizi aweze kukujibu.",
        "Unachomtumia msaidizi: ujumbe, voice notes na picha (kama risiti za malipo), pamoja na majibu yake.",
        "Unachotupa: jina lako, michango, malengo, ahadi na taarifa za kutoa pesa (namba ya pesa ya simu, akaunti ya benki au barua pepe ya PayPal).",
        "Kumbukumbu za malipo kutoka kwa watoa huduma: viasi, ada, namba za kumbukumbu, na namba ya simu ya mlipaji au jina na barua pepe ya PayPal.",
        "Pesa ambazo mwandaaji anarekodi kuwa zimelipwa nje ya SarafuPay (taslimu, pesa ya simu yake), pamoja na taarifa za risiti anazoshiriki.",
        "Kamwe hatuchukui PIN za pesa ya simu wala namba za kadi. Unathibitisha malipo kwenye simu yako au PayPal.",
      ]),
    },
    {
      id: "use",
      title: "Jinsi zinavyotumika",
      body: (
        <>
          Kuendesha huduma tu: michango, viungo vya malipo, risiti, vikumbusho, taarifa za maendeleo, kukagua risiti zilizojirudia,
          na malipo unayothibitisha kwa msimbo wako. Kurasa za wazi zinaonyesha jumla, malipo yaliyotolewa na majina ya kwanza ya
          wachangiaji. Majina kamili na viasi vinaonekana kwa mwandaaji tu, na namba za akaunti zinafichwa. Taarifa za kila wiki kwa
          wachangiaji zinaonyesha jumla tu.
        </>
      ),
    },
    {
      id: "ai",
      title: "Msaidizi wa AI",
      body: (
        <>
          AI inasoma ujumbe, voice notes na picha zako na kuamua hatua ya SarafuPay ya kuchukua. Haiwezi kutuma pesa: kila malipo
          yanahitaji msimbo wa siri wa mwandaaji. Kila hatua inayochukua inaandikwa kwenye dashibodi ya mwandaaji, na namba za simu na
          akaunti zimefichwa.
        </>
      ),
    },
    {
      id: "processors",
      title: "Nani anazishughulikia",
      body: (
        <>
          {list([
            "Meta: kufikisha ujumbe wa WhatsApp, na modeli za Muse za Meta kuelewa ujumbe, voice notes na picha, na kutengeneza bango la mchango. Muse Spark Open (modeli huria ya Meta) inaendeshwa na Baseten, ambayo hushughulikia ujumbe kwa niaba yetu inapojibu.",
            <>
              <Provider name="Snippe" />: malipo ya pesa ya simu na kutoa pesa kwenda pesa ya simu na benki.
            </>,
            <>
              <Provider name="PayPal" />: malipo ya kadi na PayPal, na kutoa pesa kwa PayPal.
            </>,
            "DigitalOcean: kuhifadhi tovuti na hifadhidata.",
          ])}
          <p className="mt-2">Hatuuzi taarifa zako wala kuzitumia kwa matangazo.</p>
        </>
      ),
    },
    {
      id: "location",
      title: "Nchi yako na vidakuzi (cookies)",
      body: (
        <>
          Ili kuonyesha bei na mifano kwa lugha na sarafu yako, tovuti inaangalia nchi yako kupitia anwani ya IP ukurasa unapofunguka.
          Anwani ya IP haihifadhiwi kwa ajili hii. Vidakuzi: kimoja kinakumbuka lugha uliyochagua, na chat ya kivinjari inatumia kimoja
          kuweka kipindi chako cha majaribio faragha. Hakuna vidakuzi vya matangazo wala ufuatiliaji.
        </>
      ),
    },
    {
      id: "retention",
      title: "Kuhifadhi na kufuta",
      body: (
        <>
          Taarifa zinahifadhiwa unapotumia huduma, na kumbukumbu za malipo kwa muda unaotakiwa kisheria. Tuma barua pepe <Mail /> ili
          taarifa zako zifutwe. Kisichohitajika kwa kumbukumbu hizo kinafutwa ndani ya siku 7.
        </>
      ),
    },
    {
      id: "security",
      title: "Usalama",
      body: "Ujumbe kutoka kwa watoa huduma unakaguliwa saini, dashibodi za waandaaji zinahitaji ufunguo wa siri, na pesa zinatoka tu baada ya msimbo wa mwandaaji mwenyewe.",
    },
    { id: "changes", title: "Mabadiliko", body: "Sera hii ikibadilika, tarehe iliyo juu inabadilika pia." },
  ],
};

export default async function PrivacyPage() {
  await connection();
  const lang = (await detectVisitor()).lang;
  const sections = SECTIONS[lang];
  return (
    <div className="min-h-dvh overflow-x-clip bg-paper text-ink">
      <ScrollFX />
      <div className="kanga" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <section className="grid items-center gap-8 pb-10 pt-4 sm:pt-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{lang === "sw" ? "Faragha" : "Privacy"}</p>
            <h1 className="rise d1 font-display mt-3 text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl">
              {lang === "sw" ? "Taarifa zako, chache tu." : "Your data, kept small."}
            </h1>
            <p className="rise d2 mt-3 text-sm text-ink-soft">
              {lang === "sw" ? "Imesasishwa" : "Updated"} {UPDATED[lang]}
            </p>
          </div>
          <div className="rise d3 shield-stage" aria-hidden>
            <div className="shield">
              <span className="shield-layer" style={{ "--z": "0px" } as React.CSSProperties} />
              <span className="shield-layer" style={{ "--z": "18px" } as React.CSSProperties} />
              <span className="shield-layer" style={{ "--z": "36px" } as React.CSSProperties} />
              <span className="shield-lock">
                <Lock size={40} />
              </span>
            </div>
          </div>
        </section>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4" data-reveal>
          {GLANCE[lang].map((t, i) => (
            <li key={t} className="glance" style={{ "--i": i } as React.CSSProperties}>
              <IconBadge icon={GLANCE_ICONS[i]} size={40} />
              <span className="mt-2 block text-sm font-semibold leading-snug">{t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 grid gap-10 md:grid-cols-[13rem_1fr]">
          <nav className="hidden md:block" aria-label={lang === "sw" ? "Kwenye ukurasa huu" : "On this page"}>
            <ol className="sticky top-8 space-y-2 text-sm text-ink-soft">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-ink">
                    <span className="font-mono text-xs text-marigold">{String(i + 1).padStart(2, "0")}</span> {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="space-y-4">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="policy-card scroll-mt-6" data-reveal>
                <p className="font-mono text-xs text-marigold">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="font-display mt-1 text-2xl font-semibold">{s.title}</h2>
                <div className="mt-2 leading-relaxed text-ink-soft">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
