import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTimeline({ items = 5 }: { items?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 px-6 py-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4 pb-6 last:pb-0">
          {/* Timeline spine */}
          <div className="flex flex-col items-center">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            {i < items - 1 && <div className="mt-1 w-px flex-1 bg-slate-100" />}
          </div>
          {/* Content */}
          <div className={`flex-1 space-y-2 pt-1 ${i < items - 1 ? "pb-2" : ""}`}>
            <Skeleton className="h-3.5 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-2/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
