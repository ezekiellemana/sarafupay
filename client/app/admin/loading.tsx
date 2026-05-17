export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#071a0e] via-[#0d2418] to-[#071a0e]">
      <div className="flex flex-col items-center gap-5">
        {/* Brand mark */}
        <div className="relative flex size-16 items-center justify-center rounded-3xl bg-white/8 ring-1 ring-white/12">
          <span className="text-[2.5rem] font-black leading-none text-emerald-400">S</span>
          <span className="absolute right-3 top-3 size-2.5 rounded-full bg-amber-400" />
        </div>
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-extrabold tracking-tight text-white">SarafuPay</span>
          <span className="text-[11px] font-semibold tracking-wide text-amber-400">
            Lipa kwa urahisi
          </span>
        </div>
        {/* Spinner */}
        <div className="mt-1 size-5 animate-spin rounded-full border-2 border-emerald-900 border-t-emerald-400" />
      </div>
    </div>
  );
}
