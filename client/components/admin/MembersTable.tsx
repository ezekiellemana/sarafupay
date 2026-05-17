import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { Member } from "@/types";

interface MembersTableProps {
  members: Member[];
  onView: (member: Member) => void;
}

export function MembersTable({ members, onView }: MembersTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total paid</TableHead>
            <TableHead>Collections</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member._id} className="cursor-pointer">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#0B1F3A]">{member.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={member.isActive ? "active" : "closed"}>
                  {member.isActive ? "Active" : "Inactive"}
                </StatusBadge>
              </TableCell>
              <TableCell className="font-medium text-[#0B1F3A]">
                {formatMoney(member.totalPaid ?? 0)}
              </TableCell>
              <TableCell>
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-700">
                  {member.collectionsCount ?? 0}
                </span>
              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {member.createdAt ? formatDate(member.createdAt) : "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium"
                  onClick={() => onView(member)}
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
