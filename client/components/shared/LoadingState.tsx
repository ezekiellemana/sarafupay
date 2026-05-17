import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-slate-50 px-6 py-4 last:border-0">
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
