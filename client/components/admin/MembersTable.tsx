import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/formatters";
import type { Member } from "@/types";

export function MembersTable({ members }: { members: Member[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Total paid</TableHead><TableHead>Paid months</TableHead></TableRow></TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member._id}>
              <TableCell>{member.fullName}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.phoneNumber}</TableCell>
              <TableCell>{formatMoney(member.totalPaid ?? 0)}</TableCell>
              <TableCell>{member.paidMonths?.length ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
