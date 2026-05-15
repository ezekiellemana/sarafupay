import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { GradientButton } from "@/components/shared/GradientButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <FloatingBlobBackground />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#071a0e] p-8 text-white shadow-2xl shadow-green-950/20 md:p-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute -bottom-12 left-1/4 size-48 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-white/60">SarafuPay — Lipa kwa urahisi.</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Start collecting payments for your next event or project.</h2>
              <p className="mt-2 text-sm text-white/55">Free to start. No technical setup required.</p>
            </div>
            <Link href="/register"><GradientButton btnVariant="gold">Create Account</GradientButton></Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
