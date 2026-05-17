import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { AdminCollection } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  monthly_contribution: "Monthly",
  event: "Event",
  wedding: "Wedding",
  birthday: "Birthday",
  charity: "Charity",
  emergency: "Emergency",
  school: "School",
  church: "Church",
  mosque: "Mosque",
  trip: "Trip",
  business: "Business",
  custom: "Custom",
};

interface CollectionsTableProps {
  collections: AdminCollection[];
  onView: (collection: AdminCollection) => void;
}

export function CollectionsTable({ collections, onView }: CollectionsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Total collected</TableHead>
            <TableHead>Contributors</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((col) => (
            <TableRow key={col._id} className="cursor-pointer">
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0B1F3A]">{col.title}</p>
                  {col.slug && (
                    <p className="truncate text-xs text-slate-500">/{col.slug}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {col.owner ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0B1F3A]">{col.owner.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{col.owner.email}</p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={col.status}>{col.status}</StatusBadge>
              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {TYPE_LABELS[col.collectionType ?? ""] ?? col.collectionType ?? "—"}
              </TableCell>
              <TableCell className="font-semibold text-[#0B1F3A]">
                {formatMoney(col.totalCollected)}
              </TableCell>
              <TableCell>
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-700">
                  {col.contributorCount}
                </span>
              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {formatDate(col.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium"
                  onClick={() => onView(col)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
