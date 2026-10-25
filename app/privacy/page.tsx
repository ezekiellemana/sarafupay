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

const UPDATED = "24 October 2026";
const CONTACT = "info@sarafupay.app";

const GLANCE_ICONS = [Lock, EyeOff, Ban, Trash];
const GLANCE: Record<"sw" | "en", string[]> = {
  en: ["No PINs or card numbers, ever", "Only the organiser sees amounts", "Never sold, no ads", "Deleted on request"],
  sw: ["Hatuchukui PIN wala namba za kadi", "Mwandaaji pekee anaona viasi", "Haziuzwi, hakuna matangazo", "Zinafutwa ukiomba"],
};

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "who",
    title: "Who runs SarafuPay",
    body: (
      <>
        SarafuPay is a collection platform by EPRIZE DIGITAL. Payments are collected and paid out by licensed providers:{" "}
        <Provider name="Snippe" /> for mobile money and <Provider name="PayPal" /> for card and PayPal. Contact:{" "}
        <a className="font-medium text-forest underline underline-offset-4" href={`mailto:${CONTACT}`}>
          {CONTACT}
        </a>
        .
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Your WhatsApp number and profile name, so the agent can reply.</li>
        <li>Your messages, voice notes and photos (such as receipts) sent to the agent, and its replies.</li>
        <li>Details you give: name, collections, targets, pledges, and payout details (mobile money number, bank account or PayPal email).</li>
        <li>Payment records from the providers: amounts, fees, references, and the payer&apos;s phone number or PayPal name and email.</li>
        <li>Never mobile money PINs or card numbers. You approve payments on your phone or on PayPal.</li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How it is used",
    body: (
      <>
        Only to run the service: collections, pay links, receipts, reminders, transparency updates, payouts you confirm with
        your code, and accurate financial records. Public pages show totals, the payout ledger and supporters&apos; first names.
        Full names and amounts are visible only to the organiser. Account numbers are masked.
      </>
    ),
  },
  {
    id: "processors",
    title: "Who processes it",
    body: (
      <>
        <ul className="list-disc space-y-1 pl-5">
          <li>Meta (WhatsApp Cloud API): message delivery.</li>
          <li>Meta (Muse models through the Meta Model API): understanding messages, voice notes and receipt photos, writing replies and drawing share cards.</li>
          <li>Google (Gemini API): the same, as a backup when Meta&apos;s models are unavailable.</li>
          <li><Provider name="Snippe" />: mobile money payments and payouts to mobile money and banks.</li>
          <li><Provider name="PayPal" />: card and PayPal payments and PayPal payouts.</li>
          <li>DigitalOcean: hosting and database.</li>
        </ul>
        <p className="mt-2">We do not sell your data or use it for advertising.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention and deletion",
    body: (
      <>
        Data is kept while you use the service; payment records as long as financial record-keeping requires. Email{" "}
        <a className="font-medium text-forest underline underline-offset-4" href={`mailto:${CONTACT}`}>
          {CONTACT}
        </a>{" "}
        to have your data deleted. Anything not needed for those records is removed within 7 days.
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: "Provider webhooks are signature-verified, dashboards need a private key, and money moves only after the organiser's own code.",
  },
  { id: "changes", title: "Changes", body: "When this policy changes, the date above changes too." },
];

export default async function PrivacyPage() {
  await connection();
  const sw = (await detectVisitor()).lang === "sw";
  return (
    <div className="min-h-dvh overflow-x-clip bg-paper text-ink">
      <ScrollFX />
      <div className="kanga" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-6">
        <section className="grid items-center gap-8 pb-10 pt-4 sm:pt-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{sw ? "Faragha" : "Privacy"}</p>
            <h1 className="rise d1 font-display mt-3 text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl">{sw ? "Taarifa zako, chache tu." : "Your data, kept small."}</h1>
            <p className="rise d2 mt-3 text-sm text-ink-soft">{sw ? "Imesasishwa" : "Updated"} {UPDATED}</p>
            {sw ? <p className="mt-2 text-sm text-ink-soft">Sera kamili iko kwa Kiingereza hapa chini.</p> : null}
          </div>
          <div className="rise d3 shield-stage" aria-hidden>
            <div className="shield">
              <span className="shield-layer" style={{ "--z": "0px" } as React.CSSProperties} />
              <span className="shield-layer" style={{ "--z": "18px" } as React.CSSProperties} />
              <span className="shield-layer" style={{ "--z": "36px" } as React.CSSProperties} />
              <span className="shield-lock"><Lock size={40} /></span>
            </div>
          </div>
        </section>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4" data-reveal>
          {GLANCE[sw ? "sw" : "en"].map((t, i) => (
            <li key={t} className="glance" style={{ "--i": i } as React.CSSProperties}>
              <IconBadge icon={GLANCE_ICONS[i]} size={40} />
              <span className="mt-2 block text-sm font-semibold leading-snug">{t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 grid gap-10 md:grid-cols-[13rem_1fr]">
          <nav className="hidden md:block" aria-label="On this page">
            <ol className="sticky top-8 space-y-2 text-sm text-ink-soft">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-ink">
                    <span className="font-mono text-xs text-marigold">{String(i + 1).padStart(2, "0")}</span> {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="space-y-4">
            {SECTIONS.map((s, i) => (
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
