export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#071a0e] via-[#0d2418] to-[#071a0e]">
      <div className="flex flex-col items-center gap-5">
        {/* Brand mark */}
        <div className="relative flex size-20 items-center justify-center rounded-3xl bg-white/8 ring-1 ring-white/12">
          <span className="text-[3.5rem] font-black leading-none text-emerald-400">S</span>
          <span className="absolute right-3.5 top-3.5 size-3 rounded-full bg-amber-400" />
        </div>
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-base font-extrabold tracking-tight text-white">SarafuPay</span>
          <span className="text-xs font-semibold tracking-wide text-amber-400">
            Lipa kwa urahisi
          </span>
        </div>
        {/* Spinner */}
        <div className="mt-1 size-6 animate-spin rounded-full border-2 border-emerald-900 border-t-emerald-400" />
      </div>
    </div>
  );
}
