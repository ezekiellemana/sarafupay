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
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total paid</TableHead>
              <TableHead>Collections</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member._id} className="cursor-pointer" onClick={() => onView(member)}>
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
                <TableCell className="font-semibold text-[#0B1F3A]">
                  {formatMoney(member.totalPaid ?? 0)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-700">
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
                    onClick={(e) => { e.stopPropagation(); onView(member); }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {members.map((member) => (
          <div
            key={member._id}
            className="cursor-pointer rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl active:opacity-80"
            onClick={() => onView(member)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-600">
                  {member.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0B1F3A]">{member.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <StatusBadge status={member.isActive ? "active" : "closed"} className="shrink-0">
                {member.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600">Total paid</p>
                <p className="text-sm font-semibold text-[#0B1F3A]">{formatMoney(member.totalPaid ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600">Collections</p>
                <p className="text-sm font-semibold text-amber-700">{member.collectionsCount ?? 0}</p>
              </div>
            </div>
            {member.createdAt && (
              <p className="mt-2 text-xs font-medium text-slate-500">Joined {formatDate(member.createdAt)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
