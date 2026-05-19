import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";

export default function Home() {
  return (
    <main className="relative">
      <FloatingBlobBackground />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <UseCasesSection />

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#035034] p-8 text-white shadow-2xl shadow-[#035034]/30 md:p-14">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#C4A237]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/4 size-48 rounded-full bg-[#19A254]/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-6 text-center md:gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2D37A]/80">
                Powering Payments. Empowering People.
              </p>
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
                Start collecting with SarafuPay today.
              </h2>
              <p className="mx-auto max-w-xl text-base text-white/65 md:text-lg">
                Free to start. No technical setup. Create your first collection in under 2 minutes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <button className="flex h-12 items-center gap-2 rounded-2xl bg-[#C4A237] px-8 text-sm font-bold text-[#035034] shadow-lg shadow-black/20 transition-all hover:bg-[#F2D37A] hover:shadow-xl">
                  Create your collection
                </button>
              </Link>
              <Link href="/login">
                <button className="flex h-12 items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/15">
                  Login to dashboard
                </button>
              </Link>
            </div>

            <p className="text-xs text-white/40">
              Payments processed securely by Snippe · No credit card required to register
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
