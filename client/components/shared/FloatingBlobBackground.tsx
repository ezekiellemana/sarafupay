export function FloatingBlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 sarafu-grid opacity-40" />
      <div
        className="absolute -left-24 top-10 size-80 rounded-full blur-3xl"
        style={{ background: "rgba(25,162,84,0.18)", animation: "blobFloat1 9s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        className="absolute -right-20 top-24 size-96 rounded-full blur-3xl"
        style={{ background: "rgba(3,80,52,0.22)", animation: "blobFloat2 11s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 size-112 rounded-full blur-3xl"
        style={{ background: "rgba(25,162,84,0.12)", animation: "blobFloat3 10s ease-in-out infinite", willChange: "transform" }}
      />
      <div
        className="absolute -bottom-16 -right-12 size-72 rounded-full blur-3xl"
        style={{ background: "rgba(196,162,55,0.08)", animation: "blobFloat4 13s ease-in-out infinite", willChange: "transform" }}
      />
    </div>
  );
}
