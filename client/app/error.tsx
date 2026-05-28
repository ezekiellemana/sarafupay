"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50/60 px-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">

          {/* Top accent strip */}
          <div className="h-1.5 w-full bg-amber-400" />

          <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
            {/* Icon */}
            <span className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
              <AlertTriangle className="size-8 text-amber-500" />
            </span>

            {/* Copy */}
            <div>
              <h1 className="text-2xl font-extrabold text-[#071a0e]">Something went wrong</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                An unexpected error occurred. This has been noted. Please try again — if the problem persists, contact support.
              </p>
              {error.digest && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-mono text-slate-400">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#035034] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#035034]/20 transition-all hover:bg-[#024028]"
              >
                <RefreshCw className="size-4" />
                Try again
              </button>
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e5e0d6] bg-white px-5 py-3 text-sm font-semibold text-[#071a0e] transition-all hover:border-[#C4A237]/40 hover:shadow-sm"
              >
                <Home className="size-4" />
                Go home
              </Link>
            </div>

            {/* Support link */}
            <p className="text-xs text-slate-400">
              Need help?{" "}
              <a
                href="mailto:support@sarafupay.app"
                className="font-medium text-[#035034] underline-offset-2 hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Brand footer */}
        <p className="mt-5 text-center text-[11px] font-semibold text-slate-400">
          SarafuPay · Lipa kwa urahisi
        </p>
      </div>
    </main>
  );
}
