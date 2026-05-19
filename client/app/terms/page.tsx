import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — SarafuPay",
  description:
    "Read SarafuPay's Terms of Service — user responsibilities, payment processing by Snippe, prohibited activities, and how we keep collections honest.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 2026";

const TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "what-we-do", label: "2. What SarafuPay Does" },
  { id: "responsibilities", label: "3. Your Responsibilities" },
  { id: "prohibited", label: "4. Prohibited Activities" },
  { id: "payments", label: "5. Payment Processing" },
  { id: "google", label: "6. Google Sign-In" },
  { id: "availability", label: "7. Service Availability" },
  { id: "liability", label: "8. Limitation of Liability" },
  { id: "changes", label: "9. Changes to Terms" },
  { id: "contact", label: "10. Contact" },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50/60">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <FileText className="size-3.5" />
            Legal Document
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Simple, honest terms for using SarafuPay — Tanzania&apos;s payment collection platform for groups, events, and community projects.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/55">
            <span>Last updated: {LAST_UPDATED}</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#C4A237]" />
              Transparent · No hidden clauses
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">

          {/* Table of contents */}
          <TableOfContents items={TOC} />

          {/* Sections */}
          <div className="min-w-0 space-y-5">

            <Section id="acceptance" num={1} title="Acceptance of Terms">
              <p>
                By creating an account or using SarafuPay, you agree to these Terms of Service. If you do not agree, please do not use the platform.
              </p>
              <p className="mt-3">
                These terms may be updated from time to time. We will indicate the date of the last update at the top of this page. Continued use of SarafuPay after a change constitutes acceptance of the updated terms. If a change is significant, we will make reasonable efforts to notify active users.
              </p>
            </Section>

            <Section id="what-we-do" num={2} title="What SarafuPay Does">
              <p>
                SarafuPay is a payment collection platform that lets users create collection pages for groups, events, monthly contributions, community projects, charities, weddings, school fees, and other causes. Members and contributors can pay through shared links.
              </p>
              <p className="mt-3">
                SarafuPay records and displays payment outcomes in your dashboard. It does not process payments directly — all payment processing is handled by <strong className="text-slate-700">Snippe</strong>, a third-party payment gateway. By using SarafuPay, you also agree to Snippe&apos;s terms and conditions for payment processing.
              </p>
            </Section>

            <Section id="responsibilities" num={3} title="Your Responsibilities">
              <p>As a SarafuPay user you are responsible for:</p>
              <BulletList color="green" items={[
                "Creating only legitimate, honest, and lawful collection pages.",
                "Providing accurate information about the purpose and intended use of collected funds.",
                "Ensuring contributors understand what they are paying for before they contribute.",
                "Using collected funds only for the stated purpose of each collection.",
                "Complying with all applicable laws and regulations in Tanzania and your jurisdiction.",
                "Keeping your account credentials secure and never sharing your password.",
                "Promptly notifying us if you suspect unauthorised access to your account.",
              ]} />
              <p className="mt-4">
                SarafuPay is not responsible for verifying the truth of information provided by collection owners. Contributors pay at their own discretion.
              </p>
            </Section>

            <Section id="prohibited" num={4} title="Prohibited Activities">
              <p>The following activities are strictly prohibited on SarafuPay:</p>
              <BulletList color="red" items={[
                "Creating fraudulent, misleading, or deceptive collection pages.",
                "Collecting funds for illegal purposes or activities.",
                "Impersonating another person, organisation, charity, or official body.",
                "Using the platform to launder money or conduct financial fraud.",
                "Violating Snippe's payment terms or attempting to circumvent payment controls.",
                "Attempting to access, interfere with, or harvest other users' accounts or data.",
                "Uploading content that is offensive, harmful, or violates third-party rights.",
              ]} />
              <Callout>
                SarafuPay reserves the right to suspend or permanently terminate any account found to be in violation of these terms, without prior notice, and to report suspected fraud to the relevant authorities.
              </Callout>
            </Section>

            <Section id="payments" num={5} title="Payment Processing">
              <p>
                All payments made through SarafuPay are processed by <strong className="text-slate-700">Snippe</strong>. SarafuPay does not store card numbers, M-Pesa PINs, or any other sensitive payment credentials. These are handled entirely by Snippe and are subject to their security and privacy policies.
              </p>
              <p className="mt-3">
                SarafuPay receives a payment outcome notification (completed, pending, failed, expired, or cancelled) from Snippe via a verified webhook and stores only the outcome and reference number for your records.
              </p>
              <p className="mt-3">
                Payment disputes, refunds, and transaction issues are governed by Snippe&apos;s policies. Please contact Snippe directly for payment-related issues. SarafuPay can assist by providing your payment reference number.
              </p>
            </Section>

            <Section id="google" num={6} title="Google Sign-In">
              <p>
                SarafuPay offers the option to create an account or sign in using Google OAuth. When you choose this option:
              </p>
              <BulletList color="green" items={[
                "We request only your basic profile information from Google: your name and verified email address.",
                "We do not request access to your Google contacts, calendar, Drive, Gmail, or any other Google service.",
                "Your Google password is never shared with or visible to SarafuPay.",
                "You can revoke SarafuPay's access to your Google account at any time via your Google Account settings.",
              ]} />
              <p className="mt-4">
                Using Google Sign-In is entirely optional. You can always register with an email address and password instead.
              </p>
            </Section>

            <Section id="availability" num={7} title="Service Availability">
              <p>
                SarafuPay is provided on a best-efforts basis. We aim for high availability but do not guarantee that the service will be uninterrupted, error-free, or available at all times. We may perform scheduled or emergency maintenance that temporarily makes the platform unavailable.
              </p>
              <p className="mt-3">
                We will make reasonable efforts to notify users of planned downtime, but cannot guarantee prior notice in all cases.
              </p>
            </Section>

            <Section id="liability" num={8} title="Limitation of Liability">
              <p>
                SarafuPay provides this platform on an &quot;as is&quot; basis. To the maximum extent permitted by applicable law, SarafuPay is not liable for:
              </p>
              <BulletList color="slate" items={[
                "Loss of funds resulting from fraudulent collection pages created by other users.",
                "Payment failures, delays, or disputes that are handled by Snippe.",
                "Service interruptions due to maintenance, outages, third-party failures, or events outside our control.",
                "Any indirect, incidental, special, or consequential damages arising from use of the platform.",
                "Actions taken by other users on the platform.",
              ]} />
              <p className="mt-4">
                Nothing in these terms limits liability for fraud, death, or personal injury caused by our negligence, or any other liability that cannot be excluded by law.
              </p>
            </Section>

            <Section id="changes" num={9} title="Changes to Terms">
              <p>
                We may update these Terms of Service to reflect changes to the platform, legal requirements, or our practices. When we make changes, we will update the &quot;Last updated&quot; date at the top of this page.
              </p>
              <p className="mt-3">
                We encourage you to review these terms periodically. Your continued use of SarafuPay after any changes constitutes your acceptance of the updated terms.
              </p>
            </Section>

            <Section id="contact" num={10} title="Contact">
              <p>
                If you have questions, concerns, or requests relating to these Terms of Service, please reach out:
              </p>
              <ContactCard />
              <p className="mt-4">
                We aim to respond to all enquiries within 3 business days.
              </p>
            </Section>

            {/* Bottom navigation */}
            <BottomNav current="terms" />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

/* ── Shared components ────────────────────────────────────────────────────── */

function TableOfContents({ items }: { items: { id: string; label: string }[] }) {
  return (
    <>
      {/* Desktop sticky sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Contents</p>
          <nav className="space-y-0.5">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-lg px-3 py-2 text-[13px] text-slate-600 transition-colors hover:bg-[#035034]/6 hover:text-[#035034]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile jump pills */}
      <div className="mb-6 lg:hidden">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Jump to section</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#035034]/30 hover:bg-[#035034]/5 hover:text-[#035034]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function Section({ id, num, title, children }: { id: string; num: number; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:p-8"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#035034]/10 text-xs font-bold text-[#035034]">
          {num}
        </span>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="pl-10 text-[15px] leading-7 text-slate-600">{children}</div>
    </section>
  );
}

type BulletColor = "green" | "red" | "slate";
function BulletList({ items, color = "slate" }: { items: string[]; color?: BulletColor }) {
  const dot: Record<BulletColor, string> = {
    green: "bg-emerald-500",
    red: "bg-red-400",
    slate: "bg-slate-400",
  };
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className={`mt-2.5 size-1.5 shrink-0 rounded-full ${dot[color]}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
      {children}
    </div>
  );
}

function ContactCard() {
  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="font-semibold text-slate-800">SarafuPay</p>
      <p className="mt-1 text-sm text-slate-600">
        Email:{" "}
        <a
          href="mailto:enzottech@gmail.com"
          className="font-medium text-[#035034] underline underline-offset-2 hover:text-[#024028]"
        >
          enzottech@gmail.com
        </a>
      </p>
    </div>
  );
}

function BottomNav({ current }: { current: "terms" | "privacy" }) {
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#035034]"
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        {current === "terms" ? (
          <Link href="/privacy" className="text-sm font-medium text-slate-500 hover:text-[#035034]">
            Privacy Policy
          </Link>
        ) : (
          <Link href="/terms" className="text-sm font-medium text-slate-500 hover:text-[#035034]">
            Terms of Service
          </Link>
        )}
        <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-[#035034]">
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-[#035034] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#024028]"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
