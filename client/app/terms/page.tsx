import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read SarafuPay's Terms of Service — user responsibilities, platform role, payment processing by Snippe, and prohibited activities.",
  robots: { index: false, follow: false },
};
import { Footer } from "@/components/layout/Footer";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { TriangleAlert } from "lucide-react";

const lastUpdated = "May 2026";

export default function TermsPage() {
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
          <h1 className="mt-4 text-3xl font-bold text-[#0b1f3a] md:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Content card */}
        <div className="space-y-8 rounded-[2rem] border border-white/70 bg-white/65 p-8 shadow-2xl shadow-slate-900/8 backdrop-blur-xl ring-1 ring-amber-200/20 md:p-10">

          <Section title="1. Acceptance of Terms">
            <p>By creating an account or using SarafuPay, you agree to these Terms of Service. If you do not agree, please do not use the platform. These terms may be updated from time to time — continued use of the platform after changes constitutes acceptance of the updated terms.</p>
          </Section>

          <Section title="2. What SarafuPay Does">
            <p>SarafuPay is a payment collection platform. It allows users to create collection pages for events, projects, groups, or causes, and share payment links so contributors can pay online. SarafuPay facilitates the tracking and recording of payments.</p>
            <p className="mt-3">SarafuPay does not process payments directly. All payment processing is handled by <strong>Snippe</strong>, a third-party payment gateway. By using SarafuPay, you also agree to be bound by Snippe&apos;s terms and conditions for payment processing.</p>
          </Section>

          <Section title="3. User Responsibilities">
            <p>As a SarafuPay user, you are responsible for:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Creating only legitimate, honest, and lawful collection pages.",
                "Providing accurate information about the purpose and use of collected funds.",
                "Ensuring that contributors understand what they are paying for.",
                "Using collected funds only for the stated purpose.",
                "Complying with all applicable laws and regulations in Tanzania and your jurisdiction.",
                "Keeping your account credentials secure and confidential.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="4. Prohibited Activities">
            <p>The following are strictly prohibited on SarafuPay:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Creating fraudulent, misleading, or deceptive collection pages.",
                "Collecting funds for illegal purposes or activities.",
                "Impersonating another person, organisation, or charity.",
                "Using the platform to launder money or conduct financial fraud.",
                "Violating Snippe&apos;s payment terms or attempting to circumvent payment controls.",
                "Attempting to access or interfere with other users&apos; accounts or data.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              SarafuPay reserves the right to suspend or terminate any account found to be in violation of these terms, without notice.
            </p>
          </Section>

          <Section title="5. Payment Processing">
            <p>All payments made through SarafuPay are processed by Snippe. SarafuPay does not store card details, M-Pesa PINs, or any sensitive payment credentials. Payment disputes, refunds, and transaction issues are subject to Snippe&apos;s policies.</p>
            <p className="mt-3">SarafuPay records payment outcomes (completed, pending, failed) and displays them in the collection owner&apos;s dashboard. These records are for tracking purposes only.</p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>SarafuPay provides this platform on an &quot;as is&quot; basis. To the maximum extent permitted by law, SarafuPay is not liable for:</p>
            <ul className="mt-3 space-y-2">
              {[
                "Loss of funds resulting from fraudulent collection pages created by other users.",
                "Payment failures, delays, or disputes handled by Snippe.",
                "Interruptions to service due to maintenance, outages, or technical issues.",
                "Any indirect, incidental, or consequential damages arising from use of the platform.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="7. Account Termination">
            <p>You may delete your account at any time. SarafuPay reserves the right to suspend or terminate accounts that violate these terms. Upon termination, your collection pages will be deactivated and no further payments will be accepted.</p>
          </Section>

          <Section title="8. Contact">
            {/* TODO before launch: confirm support@sarafupay.co.tz is a live inbox */}
            <p>If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@sarafupay.co.tz" className="font-medium text-[#16a34a] underline underline-offset-2 hover:text-[#14532d]">
                support@sarafupay.co.tz
              </a>.
            </p>
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
