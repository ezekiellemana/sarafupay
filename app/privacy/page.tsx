import Link from "next/link";
import { Logo } from "@/components/brand";

export const metadata = {
  title: "Privacy Policy — SarafuPay",
  description: "How SarafuPay handles your data when you use the WhatsApp agent, web simulator and treasurer dashboard.",
};

const UPDATED = "23 October 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="kanga" />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/" className="text-sm underline">
          Home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16 leading-relaxed">
        <h1 className="font-display text-4xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated {UPDATED}</p>

        <Section title="Who runs SarafuPay">
          SarafuPay is a collection-management platform by EPRIZE DIGITAL (Dodoma, Tanzania), founded by Ezekiel Lemana. It
          helps groups run collections (michango) through a WhatsApp agent and a web page. SarafuPay is a technology and
          record-keeping service: payments are collected and paid out by licensed payment providers (Snippe for mobile money,
          PayPal for card and PayPal payments). Contact:{" "}
          <a className="underline" href="mailto:ezekielaugustino@gmail.com">
            ezekielaugustino@gmail.com
          </a>
          .
        </Section>

        <Section title="What SarafuPay collects">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your WhatsApp phone number and profile name, so the agent can reply to you.</li>
            <li>The messages and voice notes you send the agent, and its replies, kept as conversation history.</li>
            <li>The details you give: your name, collection titles, targets, pledges, and payout details (mobile money number, bank and account number, or PayPal email).</li>
            <li>
              Payment records from the providers: amounts, fees, references, the payer&apos;s phone number (mobile money) or
              name and email (PayPal). SarafuPay never sees or stores mobile money PINs or card numbers; you approve payments
              on your phone or on PayPal.
            </li>
          </ul>
        </Section>

        <Section title="How it is used">
          Only to run the service: creating collections, sending pay links, receipts, reminders and transparency updates,
          preparing payouts that the organiser confirms with a one-time code, showing the organiser&apos;s private
          dashboard, and keeping accurate financial records. The public collection page shows totals, the payout ledger and
          each supporter&apos;s first name and optional message, never amounts, phone numbers or emails. Full names and
          amounts are visible only to that collection&apos;s organiser. Account numbers are shown masked in messages.
        </Section>

        <Section title="Who processes it">
          <ul className="list-disc space-y-1 pl-5">
            <li>Meta (WhatsApp Cloud API), to deliver messages.</li>
            <li>Google (Gemini API), to understand messages and write replies.</li>
            <li>Snippe, to collect mobile money payments and send payouts to mobile money and banks.</li>
            <li>PayPal, to process card and PayPal payments and PayPal payouts.</li>
            <li>DigitalOcean, which hosts the app and its database.</li>
          </ul>
          SarafuPay does not sell your data or use it for advertising.
        </Section>

        <Section title="Retention and deletion">
          Conversation history and collection data are kept while you use the service. Payment and payout records are kept as
          long as needed for financial record-keeping. You can ask for your data to be deleted at any time by emailing the
          address above; anything not needed for those records is removed within 7 days.
        </Section>

        <Section title="Security">
          Webhooks from Meta, Snippe and PayPal are signature-verified, dashboards are protected by a private owner key, and
          money can only move after the organiser&apos;s own confirmation code.
        </Section>

        <Section title="Changes">
          If this policy changes, the date at the top of this page is updated.
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-2 text-ink-soft">{children}</div>
    </section>
  );
}
