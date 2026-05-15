import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read SarafuPay's Privacy Policy — what data we collect, how it is used, how payments are handled by Snippe, and your rights.",
  robots: { index: false, follow: false },
};
import { Footer } from "@/components/layout/Footer";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { TriangleAlert } from "lucide-react";

const lastUpdated = "May 2026";

export default function PrivacyPage() {
  return (
    <main className="relative overflow-hidden">
      <FloatingBlobBackground />
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-16">

        {/* MVP disclaimer */}
        <div className="mb-8 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            <span className="font-semibold">Note:</span> This is a basic MVP policy and should be reviewed by a legal professional before public launch.
          </p>
        </div>

        {/* Header */}
        <div className="mb-10">
          <span className="inline-block rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            Legal
          </span>
          <h1 className="mt-4 text-3xl font-bold text-[#0b1f3a] md:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Content card */}
        <div className="space-y-8 rounded-[2rem] border border-white/70 bg-white/65 p-8 shadow-2xl shadow-slate-900/8 backdrop-blur-xl ring-1 ring-amber-200/20 md:p-10">

          <Section title="1. Overview">
            <p>SarafuPay (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to handling your personal information responsibly. This Privacy Policy explains what data we collect, why we collect it, and how it is used when you use SarafuPay.</p>
            <p className="mt-3">By using SarafuPay, you agree to the collection and use of information in accordance with this policy.</p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following information when you use SarafuPay:</p>

            <div className="mt-4 space-y-4">
              <DataBlock
                label="Account information"
                items={["Full name", "Email address", "Phone number", "Password (stored as a secure hash — never in plain text)"]}
              />
              <DataBlock
                label="Collection pages"
                items={["Project title, description, type, and target amount", "Payment link slug and visibility settings"]}
              />
              <DataBlock
                label="Payment records"
                items={[
                  "Payer name, phone, and email (provided by the payer at checkout)",
                  "Payment amount, currency, and status",
                  "Payment reference numbers from Snippe",
                  "Timestamp of payment",
                  "Optional message from the payer",
                ]}
              />
              <DataBlock
                label="Technical data"
                items={["IP address (via server logs)", "Browser and device information (via standard HTTP headers)"]}
              />
            </div>
          </Section>

          <Section title="3. Why We Collect This Data">
            <p>We use your data only for the following purposes:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Creating and managing your account",
                "Processing and tracking payment contributions to your collection pages",
                "Displaying payment records in your dashboard and CSV exports",
                "Detecting and preventing fraud or misuse of the platform",
                "Responding to support requests",
                "Sending essential service notifications (e.g. payment confirmations)",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600">We do not sell your personal data to third parties. We do not use your data for advertising.</p>
          </Section>

          <Section title="4. Payment Processing">
            <p>All payments are processed by <strong>Snippe</strong>, a third-party payment gateway. When a contributor pays through a SarafuPay link, they are redirected to a Snippe-hosted checkout page.</p>
            <p className="mt-3"><strong>SarafuPay does not store card numbers, M-Pesa PINs, or any sensitive payment credentials.</strong> This information is handled entirely by Snippe and is subject to their privacy and security policies.</p>
            <p className="mt-3">We receive a payment outcome notification (completed, failed, expired, or cancelled) from Snippe and store only the outcome and reference number.</p>
          </Section>

          <Section title="5. Data Sharing">
            <p>We share your data only in the following limited cases:</p>
            <ul className="mt-3 space-y-2">
              {[
                "With Snippe — payment data is shared to initiate and verify transactions.",
                "With MongoDB Atlas — your data is stored on hosted cloud servers in a secure, access-controlled environment.",
                "When required by law — if compelled by a valid legal process.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your account and payment data for as long as your account is active. If you delete your account, your personal information will be removed from our systems within 30 days, except where retention is required by law (e.g. financial records).</p>
            <p className="mt-3">Payment records associated with completed transactions may be retained for a longer period for financial compliance purposes.</p>
          </Section>

          <Section title="7. Cookies and Sessions">
            <p>SarafuPay uses a single HTTP-only session cookie to keep you logged in. This cookie:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Is set only after login",
                "Is not accessible to JavaScript (HTTP-only flag)",
                "Expires automatically after 7 days",
                "Is removed when you log out",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">We do not use advertising cookies or third-party tracking scripts.</p>
          </Section>

          <Section title="8. Your Rights">
            <p>You have the right to:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Access the personal data we hold about you",
                "Request correction of inaccurate data",
                "Request deletion of your account and associated data",
                "Withdraw consent for data processing where consent is the basis",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">To exercise these rights, contact us using the details below.</p>
          </Section>

          <Section title="9. Contact">
            <p>For any privacy-related questions or requests, please contact:</p>
            {/* TODO before launch: confirm support@sarafupay.co.tz is a live inbox */}
            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-[#0b1f3a]">SarafuPay</p>
              <p className="mt-1">
                Email:{" "}
                <a href="mailto:support@sarafupay.co.tz" className="font-medium text-[#16a34a] underline underline-offset-2 hover:text-[#14532d]">
                  support@sarafupay.co.tz
                </a>
              </p>
            </div>
          </Section>

        </div>
      </div>

      <Footer />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <h2 className="mb-3 text-base font-bold text-[#0b1f3a]">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

function DataBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs text-slate-600">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
