import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — SarafuPay",
  description:
    "Read SarafuPay's Privacy Policy — what data we collect, how it is used, Google sign-in data, payment records, analytics, and your rights.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 2026";

const TOC = [
  { id: "overview",    label: "1. Overview" },
  { id: "collect",     label: "2. Information We Collect" },
  { id: "google-data", label: "3. Google Sign-In Data" },
  { id: "payments",    label: "4. Payment Records" },
  { id: "cookies",     label: "5. Cookies & Auth Tokens" },
  { id: "use",         label: "6. How We Use Your Data" },
  { id: "third-party", label: "7. Third-Party Services" },
  { id: "analytics",   label: "8. Analytics & Tracking" },
  { id: "protection",  label: "9. Data Protection" },
  { id: "rights",      label: "10. Your Rights" },
  { id: "contact",     label: "11. Contact" },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50/60">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#035034] pb-16 pt-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#19A254]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 size-72 rounded-full bg-[#C4A237]/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A237]/40 bg-[#C4A237]/15 px-4 py-1.5 text-xs font-semibold text-[#F2D37A]">
            <Lock className="size-3.5" />
            Legal Document
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            We collect only what we need, use it only to run SarafuPay, and never sell your data to anyone.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/55">
            <span>Last updated: {LAST_UPDATED}</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#C4A237]" />
              No advertising · No data selling
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

            <Section id="overview" num={1} title="Overview">
              <p>
                SarafuPay (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to handling your personal information responsibly and transparently. This Privacy Policy explains what data we collect, why we collect it, and how it is used when you create an account, manage a collection, or contribute to one.
              </p>
              <p className="mt-3">
                By using SarafuPay you agree to the collection and use of information in accordance with this policy. We do not ask for unnecessary sensitive data, we do not sell your personal data to third parties, and we do not use your data for advertising.
              </p>
            </Section>

            <Section id="collect" num={2} title="Information We Collect">
              <p>We collect the following types of information:</p>

              <div className="mt-4 space-y-3">
                <DataBlock label="Account information" items={[
                  "Full name",
                  "Email address",
                  "Phone number (optional for Google sign-in users)",
                  "Password — stored as a secure bcrypt hash, never in plain text",
                ]} />
                <DataBlock label="Collection pages" items={[
                  "Project title, description, type, target amount",
                  "Payment link slug and visibility settings",
                  "Contribution plans and schedules",
                ]} />
                <DataBlock label="Technical data" items={[
                  "IP address via standard server logs",
                  "Browser and device type via HTTP headers",
                  "Timestamps of account actions and logins",
                ]} />
              </div>
            </Section>

            <Section id="google-data" num={3} title="Google Sign-In Data">
              <p>
                If you choose to sign in or register using Google, we receive a limited set of information from Google as part of the OAuth 2.0 authentication process:
              </p>
              <BulletList color="green" items={[
                "Your name (as set in your Google account)",
                "Your verified email address",
                "A unique Google account identifier (used to link your SarafuPay account to your Google account)",
              ]} />
              <p className="mt-4">
                We do <strong className="text-slate-700">not</strong> request or receive access to your Google contacts, Gmail, Drive, Calendar, or any other Google service. We do not see your Google password.
              </p>
              <p className="mt-3">
                Your Google password is handled entirely by Google. You can revoke SarafuPay&apos;s access to your Google account at any time by visiting{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#035034] underline underline-offset-2 hover:text-[#024028]"
                >
                  Google Account Permissions
                </a>
                .
              </p>
              <p className="mt-3">
                Using Google Sign-In is optional. You can register with an email address and password at any time.
              </p>
            </Section>

            <Section id="payments" num={4} title="Payment Records">
              <p>
                When a contributor pays through a SarafuPay collection link, we store the following payment record information:
              </p>
              <BulletList color="slate" items={[
                "Payer name, phone number, and email — as provided at the Snippe checkout",
                "Payment amount, currency, and status (completed, failed, expired, or cancelled)",
                "Payment reference numbers from Snippe",
                "Timestamp of the payment",
                "Optional message from the payer",
                "The month or period the payment is for (for monthly contribution collections)",
              ]} />
              <Callout>
                SarafuPay does <strong>not</strong> store card numbers, M-Pesa PINs, or any sensitive payment credentials. This information is handled entirely by Snippe and is subject to their security and privacy policies.
              </Callout>
            </Section>

            <Section id="cookies" num={5} title="Cookies & Auth Tokens">
              <p>
                SarafuPay uses a single HTTP-only session cookie to keep you logged in after authentication. This cookie:
              </p>
              <BulletList color="green" items={[
                "Is set only after a successful login or Google sign-in",
                "Is not accessible to JavaScript (HTTP-only flag prevents XSS theft)",
                "Is transmitted only over HTTPS in production (Secure flag)",
                "Expires automatically after 7 days of inactivity",
                "Is immediately removed when you click Log Out",
              ]} />
              <p className="mt-4">
                The only additional short-lived cookie used is a temporary state token during Google OAuth sign-in, which is deleted as soon as the sign-in is complete.
              </p>
              <p className="mt-3">
                We do <strong className="text-slate-700">not</strong> use advertising cookies or marketing trackers. SarafuPay uses PostHog for product analytics, which may store an anonymous session identifier in your browser. See the <a href="#analytics" className="font-medium text-[#035034] underline underline-offset-2 hover:text-[#024028]">Analytics &amp; Tracking</a> section for full details.
              </p>
            </Section>

            <Section id="use" num={6} title="How We Use Your Data">
              <p>We use your data only for the following purposes:</p>
              <BulletList color="green" items={[
                "Creating and managing your account",
                "Processing and tracking payment contributions to your collection pages",
                "Displaying payment records in your dashboard and CSV exports",
                "Linking your Google account to your SarafuPay account (if you use Google sign-in)",
                "Detecting and preventing fraud or misuse of the platform",
                "Responding to support requests",
                "Sending essential service notifications, such as payment confirmations",
                "Understanding how SarafuPay is used so we can improve it (via PostHog analytics — see section 8)",
              ]} />
              <p className="mt-4">
                We do not use your data for marketing emails, targeted advertising, or profiling. We do not sell or rent your data to any third party.
              </p>
            </Section>

            <Section id="third-party" num={7} title="Third-Party Services">
              <p>
                SarafuPay relies on the following third-party services to operate. Each service has its own privacy policy and security practices:
              </p>
              <div className="mt-4 space-y-3">
                <DataBlock label="Snippe (payment processing)" items={[
                  "Handles all M-Pesa and card payments on behalf of SarafuPay",
                  "Receives payer checkout data (name, phone, email) during a transaction",
                  "Sends a verified webhook notification to SarafuPay once a payment is confirmed",
                  "Governs refunds, disputes, and payment credential security",
                ]} />
                <DataBlock label="Google OAuth (optional sign-in)" items={[
                  "Used only when you choose 'Continue with Google'",
                  "Shares your name, email, and account ID with SarafuPay",
                  "Does not share passwords, contacts, or other Google data",
                ]} />
                <DataBlock label="PostHog (product analytics)" items={[
                  "Used to understand page visits, traffic sources, and product usage",
                  "Configured with autocapture disabled — we control exactly what is tracked",
                  "All form inputs are masked — PostHog never sees what you type",
                  "No passwords, payment credentials, or personal identifiers are sent to PostHog",
                  "See section 8 for full details",
                ]} />
                <DataBlock label="MongoDB Atlas (database)" items={[
                  "Stores all SarafuPay account, collection, and payment data",
                  "Access-controlled, encrypted at rest, hosted on secure cloud infrastructure",
                ]} />
                <DataBlock label="DigitalOcean App Platform (backend hosting)" items={[
                  "Runs the SarafuPay server application",
                  "Processes API requests and webhook events",
                ]} />
                <DataBlock label="Vercel (frontend hosting)" items={[
                  "Serves the SarafuPay web application",
                  "Does not store or process personal data beyond standard CDN and edge caching",
                ]} />
              </div>
            </Section>

            <Section id="analytics" num={8} title="Analytics & Tracking">
              <p>
                We use <strong className="text-slate-700">PostHog</strong> (posthog.com) to understand how SarafuPay is used — for example, which pages are visited, where visitors come from, and which features are most used. This helps us improve the product for everyone.
              </p>

              <p className="mt-4 font-semibold text-slate-700">What PostHog may collect:</p>
              <BulletList color="green" items={[
                "Page URLs visited and the order in which they were visited",
                "Traffic source — for example, whether you arrived from a link, search, or social media",
                "Browser type, device type, and approximate location (country level only)",
                "An anonymous session identifier stored in your browser (cookie or local storage)",
                "Which features or buttons were clicked — only those we explicitly choose to track",
              ]} />

              <p className="mt-4 font-semibold text-slate-700">What PostHog never collects on SarafuPay:</p>
              <BulletList color="slate" items={[
                "Passwords or password hashes",
                "Payment credentials, M-Pesa PINs, or card numbers",
                "Session tokens, auth cookies, or any authentication secrets",
                "Form input values — all inputs are masked before any data is sent",
                "Your email address, phone number, or full name",
                "Any personally identifiable information beyond an anonymous internal ID",
              ]} />

              <p className="mt-4 font-semibold text-slate-700">Session replay:</p>
              <p className="mt-1">
                Session replay (a recording of how you navigate the screen) may be used to help us understand usability issues. When active, all input fields are automatically masked. Session replay is <strong className="text-slate-700">completely disabled</strong> on the following pages:
              </p>
              <BulletList color="slate" items={[
                "/pay/** — all payment checkout pages",
                "/payment/** — all payment processing pages",
                "/dashboard/profile — your profile and settings",
                "/login — the sign-in page",
                "/register — the account creation page",
              ]} />

              <Callout>
                PostHog analytics is configured with <strong>autocapture disabled</strong> — this means PostHog does not automatically record every click or keystroke on the page. Only specific events that we deliberately choose to track are ever sent.
              </Callout>

              <p className="mt-4">
                PostHog may store an anonymous session identifier in your browser using a cookie or local storage entry. This identifier is used for analytics purposes only and is not linked to your SarafuPay account or any personal data we hold about you.
              </p>
              <p className="mt-3">
                If you have any questions about what analytics data is collected or how it is used, please contact us at{" "}
                <a
                  href="mailto:support.sarafupay@gmail.com"
                  className="font-medium text-[#035034] underline underline-offset-2 hover:text-[#024028]"
                >
                  support.sarafupay@gmail.com
                </a>
                .
              </p>
            </Section>

            <Section id="protection" num={9} title="Data Protection">
              <p>We take reasonable technical and organisational measures to protect your data:</p>
              <BulletList color="green" items={[
                "All data is transmitted over HTTPS (TLS encryption in transit)",
                "Passwords are hashed using bcrypt — we cannot retrieve your plain-text password",
                "The session cookie is HTTP-only and Secure-flagged to prevent interception",
                "Database access is restricted by role-based access controls",
                "No sensitive payment credentials (card numbers, PINs) are stored by SarafuPay",
                "Admin accounts have separate access controls from regular member accounts",
                "Analytics is configured to mask all inputs and exclude sensitive pages",
              ]} />
              <p className="mt-4">
                No system can guarantee absolute security. If you believe your account has been compromised, please contact us immediately at the address below so we can take action.
              </p>
            </Section>

            <Section id="rights" num={10} title="Your Rights">
              <p>You have the right to:</p>
              <BulletList color="green" items={[
                "Access the personal data we hold about you",
                "Request correction of inaccurate or incomplete data",
                "Request deletion of your account and associated personal data",
                "Withdraw consent for data processing where consent is the legal basis",
                "Revoke Google sign-in access at any time via Google Account settings",
              ]} />
              <p className="mt-4">
                We retain your account and payment data for as long as your account is active. If you request account deletion, your personal information will be removed within 30 days, except where retention is required by law (for example, financial transaction records).
              </p>
              <p className="mt-3">
                To exercise any of these rights, contact us using the details in the next section.
              </p>
            </Section>

            <Section id="contact" num={11} title="Contact">
              <p>
                For any privacy-related questions, requests, or concerns — including questions about analytics data — please contact us:
              </p>
              <ContactCard />
              <p className="mt-4">
                We aim to respond to all privacy enquiries within 3 business days. For urgent security concerns, please include &quot;Security&quot; in your email subject line.
              </p>
            </Section>

            {/* Bottom navigation */}
            <BottomNav current="privacy" />
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
    red:   "bg-red-400",
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

function DataBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate-600">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
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
          href="mailto:support.sarafupay@gmail.com"
          className="font-medium text-[#035034] underline underline-offset-2 hover:text-[#024028]"
        >
          support.sarafupay@gmail.com
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
