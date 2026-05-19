import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <FloatingBlobBackground />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/65 shadow-2xl shadow-slate-900/10 backdrop-blur-xl ring-1 ring-amber-200/20 lg:grid-cols-[0.9fr_1.1fr]">

        {/* Left panel — brand vault */}
        <div className="relative hidden overflow-hidden bg-[#035034] p-10 text-white lg:flex lg:flex-col">
          {/* Background blobs inside panel */}
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-[#19A254]/20 blur-3xl" />
          <div className="absolute -bottom-10 left-1/4 size-40 rounded-full bg-[#C4A237]/15 blur-3xl" />
          <div className="absolute bottom-1/4 -left-8 size-32 rounded-full bg-[#C4A237]/10 blur-2xl" />

          <Link href="/" className="relative z-10 flex items-center">
            <BrandLogo variant="dark" height={46} />
          </Link>

          <div className="relative z-10 mt-16 flex-1">
            <p className="text-sm font-medium text-white/75">Welcome back</p>
            <h1 className="mt-3 text-4xl font-bold leading-snug tracking-tight">
              Secure contribution records in one calm dashboard.
            </h1>

            {/* Gold stat box */}
            <div className="mt-8 rounded-3xl border border-[#C4A237]/30 bg-[#C4A237]/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium text-[#F2D37A]/85">Trusted by groups across Tanzania</p>
              <p className="mt-2 text-3xl font-bold text-[#C4A237]">Webhook-verified</p>
              <div className="mt-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#C4A237]" />
                <span className="text-xs font-medium text-white/65">Every payment confirmed before it appears</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right panel — form */}
        <div className="flex flex-col items-center justify-center p-6 md:p-10">
          <div className="mb-6 flex items-center lg:hidden">
            <Link href="/" className="flex items-center">
              <BrandLogo variant="light" height={38} />
            </Link>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
