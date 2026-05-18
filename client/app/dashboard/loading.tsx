export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#071a0e] via-[#0d2418] to-[#071a0e]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-112 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-8">
        {/* Brand mark */}
        <div className="relative flex size-24 items-center justify-center rounded-[1.75rem] bg-white/8 shadow-2xl shadow-black/40 ring-1 ring-white/12">
          <span className="text-[4rem] font-black leading-none text-emerald-400">S</span>
          <span className="absolute right-3.5 top-3.5 size-3.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-white">SarafuPay</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400/80">
            Lipa kwa urahisi
          </span>
        </div>

        {/* Spinner + message */}
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-emerald-900 border-t-emerald-400" />
          <span className="text-sm font-medium text-white/45">Preparing your dashboard…</span>
        </div>
      </div>
    </div>
  );
}
