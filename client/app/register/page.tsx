import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function RegisterPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <FloatingBlobBackground />

      {/* Logo bar */}
      <div className="mb-6 flex items-center">
        <Link href="/" className="flex items-center rounded-2xl border border-white/70 bg-white/75 px-4 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
          <BrandLogo variant="light" height={38} />
        </Link>
      </div>

      <RegisterForm />
    </main>
  );
}
