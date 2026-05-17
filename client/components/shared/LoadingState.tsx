import { Skeleton } from "@/components/ui/skeleton";

type LoadingVariant = "table" | "cards" | "detail";

export function LoadingState({
  label = "Loading...",
  variant = "table",
}: {
  label?: string;
  variant?: LoadingVariant;
}) {
  if (variant === "cards") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl"
            >
              <Skeleton className="mb-4 h-5 w-3/4 rounded-lg" />
              <Skeleton className="mb-2 h-3.5 w-full rounded-lg" />
              <Skeleton className="mb-2 h-3.5 w-4/5 rounded-lg" />
              <Skeleton className="mt-4 h-8 w-24 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-3.5 w-32 rounded-lg" />
            </div>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Skeleton className="mb-2 h-3 w-20 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-50 px-6 py-4 last:border-0">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5 rounded-lg" />
                <Skeleton className="h-3 w-1/3 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // default: table
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-50 px-6 py-4 last:border-0">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5 rounded-lg" />
              <Skeleton className="h-3 w-1/3 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-7 w-14 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
