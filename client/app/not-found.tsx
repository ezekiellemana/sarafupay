import Link from "next/link";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { GradientButton } from "@/components/shared/GradientButton";

function NotFoundIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" fill="#035034" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="#C4A237" strokeWidth="4" />
      <circle cx="60" cy="56" r="42" fill="none" stroke="#F2D37A" strokeWidth="1" opacity="0.4" />
      {/* 4 0 4 text */}
      <text
        x="60"
        y="73"
        textAnchor="middle"
        fontSize="38"
        fontWeight="900"
        fill="#C4A237"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        404
      </text>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-center">
      <FloatingBlobBackground />

      <div className="glass-premium relative z-10 flex flex-col items-center gap-6 rounded-3xl px-10 py-14 shadow-2xl shadow-slate-900/10">
        <NotFoundIllustration />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black leading-tight sarafu-gradient-text-gold">Page not found</h1>
          <p className="text-base font-semibold text-[#035034] mt-1">404 — This page doesn&apos;t exist</p>
          <p className="mt-2 max-w-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for may have moved or been removed. Let&apos;s get you back home.
          </p>
        </div>
        <Link href="/">
          <GradientButton btnVariant="gold" className="px-8">
            Return Home
          </GradientButton>
        </Link>
      </div>
    </main>
  );
}
