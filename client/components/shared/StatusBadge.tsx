import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  completed:  "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  active:     "bg-green-500/15 text-green-700 ring-green-500/30",
  pending:    "bg-yellow-400/25 text-yellow-800 ring-yellow-500/30",
  paused:     "bg-yellow-400/25 text-yellow-800 ring-yellow-500/30",
  approved:   "bg-blue-500/15 text-blue-700 ring-blue-500/30",
  processing: "bg-indigo-500/15 text-indigo-700 ring-indigo-500/30",
  paid:       "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  rejected:   "bg-red-500/15 text-red-700 ring-red-500/30",
  failed:     "bg-red-500/15 text-red-700 ring-red-500/30",
  expired:    "bg-slate-500/15 text-slate-700 ring-slate-500/30",
  cancelled:  "bg-slate-500/15 text-slate-700 ring-slate-500/30",
  unpaid:     "bg-slate-500/15 text-slate-700 ring-slate-500/30",
  draft:      "bg-blue-500/15 text-blue-700 ring-blue-500/30",
  closed:     "bg-slate-500/15 text-slate-600 ring-slate-500/30",
};

export function StatusBadge({ status, className, children }: { status: string; className?: string; children?: React.ReactNode }) {
  return (
    <Badge className={cn("rounded-full px-3 py-1 font-semibold capitalize ring-1", badgeStyles[status] ?? badgeStyles.unpaid, className)}>
      {children ?? status}
    </Badge>
  );
}
