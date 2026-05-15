import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  completed: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  active: "bg-green-500/12 text-green-700 ring-green-500/20",
  pending: "bg-yellow-400/20 text-yellow-800 ring-yellow-500/20",
  paused: "bg-yellow-400/20 text-yellow-800 ring-yellow-500/20",
  failed: "bg-red-500/12 text-red-700 ring-red-500/20",
  expired: "bg-slate-500/12 text-slate-700 ring-slate-500/20",
  cancelled: "bg-slate-500/12 text-slate-700 ring-slate-500/20",
  unpaid: "bg-slate-500/12 text-slate-700 ring-slate-500/20",
  draft: "bg-blue-500/12 text-blue-700 ring-blue-500/20",
  closed: "bg-slate-500/12 text-slate-600 ring-slate-500/20"
};

export function StatusBadge({ status, className, children }: { status: string; className?: string; children?: React.ReactNode }) {
  return (
    <Badge className={cn("rounded-full px-3 py-1 font-medium capitalize ring-1", badgeStyles[status] ?? badgeStyles.unpaid, className)}>
      {children ?? status}
    </Badge>
  );
}
