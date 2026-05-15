import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl shimmer bg-white/70" />
        ))}
      </div>
    </div>
  );
}
