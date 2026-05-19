export default function AdminLoading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#035034]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 size-96 -translate-x-1/2 rounded-full bg-[#19A254]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-64 rounded-full bg-[#C4A237]/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-8">
        {/* S mark */}
        <div
          className="relative flex items-center justify-center shadow-2xl shadow-black/40"
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            background: "#024028",
            border: "3px solid #C4A237",
          }}
        >
          <div
            className="absolute"
            style={{
              inset: 8,
              borderRadius: 18,
              border: "1px solid rgba(242,211,122,0.3)",
            }}
          />
          <span
            className="relative"
            style={{
              color: "#C4A237",
              fontSize: 56,
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "Georgia, 'Times New Roman', serif",
              marginTop: 4,
            }}
          >
            S
          </span>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xl font-extrabold tracking-tight text-white">
            Sarafu<span style={{ color: "#C4A237" }}>Pay</span>
          </span>
          <span
            className="font-semibold uppercase tracking-[0.2em] text-white/50"
            style={{ fontSize: 10 }}
          >
            Admin Panel
          </span>
        </div>

        {/* Spinner */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="size-5 animate-spin rounded-full"
            style={{
              border: "2px solid rgba(196,162,55,0.25)",
              borderTopColor: "#C4A237",
            }}
          />
          <span className="text-sm font-medium text-white/40">
            Loading admin panel…
          </span>
        </div>
      </div>
    </div>
  );
}
