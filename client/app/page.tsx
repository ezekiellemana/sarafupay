import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { InsightsSection } from "@/components/landing/InsightsSection";
import { JourneySection } from "@/components/landing/JourneySection";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";

export default function Home() {
  return (
    <main className="relative">
      <FloatingBlobBackground />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <InsightsSection />
      <JourneySection />
      <Footer />
    </main>
  );
}
