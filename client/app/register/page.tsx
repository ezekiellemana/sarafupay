import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <FloatingBlobBackground />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + intro */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="inline-flex">
            <BrandLogo variant="light" height={44} />
          </Link>
          <p className="text-sm font-medium text-slate-500">
            Create your account and start collecting in minutes.
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
