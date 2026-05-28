import Link from "next/link";
import { Home, Mail } from "lucide-react";

function NotFoundIllustration() {
  return (
    <svg width="96" height="96" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#035034" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="#C4A237" strokeWidth="4" />
      <circle cx="60" cy="56" r="42" fill="none" stroke="#F2D37A" strokeWidth="1" opacity="0.4" />
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50/60 px-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">

          {/* Top accent strip */}
          <div className="h-1.5 w-full bg-[#C4A237]" />

          <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
            <NotFoundIllustration />

            <div>
              <h1 className="text-2xl font-extrabold text-[#071a0e]">Page not found</h1>
              <p className="mt-1 text-sm font-semibold text-[#19A254]">404 — This page doesn&apos;t exist</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                The page you&apos;re looking for may have moved, been removed, or never existed. Let&apos;s get you back on track.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#035034] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#035034]/20 transition-all hover:bg-[#024028]"
              >
                <Home className="size-4" />
                Return home
              </Link>
              <a
                href="mailto:support@sarafupay.app"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e5e0d6] bg-white px-5 py-3 text-sm font-semibold text-[#071a0e] transition-all hover:border-[#C4A237]/40 hover:shadow-sm"
              >
                <Mail className="size-4" />
                Contact support
              </a>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] font-semibold text-slate-400">
          SarafuPay · Lipa kwa urahisi
        </p>
      </div>
    </main>
  );
}
