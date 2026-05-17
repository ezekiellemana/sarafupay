import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-4">
            <Skeleton className="h-3.5 w-28 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-52 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
