import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">
      <div className="divide-y divide-[#e5e0d6]">
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
