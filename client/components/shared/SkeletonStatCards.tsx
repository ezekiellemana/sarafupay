import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonStatCards({ rows = 1 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-3 w-24 rounded-lg" />
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
                <Skeleton className="size-11 shrink-0 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
