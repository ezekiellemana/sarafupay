import { CreditCard, Users, WalletCards, XCircle } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatMoney } from "@/lib/formatters";
import type { AdminDashboardData } from "@/types";

export function AdminStatsCards({ data }: { data: AdminDashboardData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard title="Total collected" value={formatMoney(data.totalCollected)} numericValue={data.totalCollected} formatValue={(value) => formatMoney(value)} icon={<WalletCards />} accent="gold" />
      <DashboardCard title="Total members" value={String(data.totalMembers)} numericValue={data.totalMembers} icon={<Users />} accent="blue" />
      <DashboardCard title="Paid this month" value={String(data.paidMembersThisMonth)} numericValue={data.paidMembersThisMonth} description={`${data.unpaidMembersThisMonth} unpaid`} icon={<CreditCard />} accent="green" />
      <DashboardCard title="Failed payments" value={String(data.failedPayments)} numericValue={data.failedPayments} description={`${data.pendingPayments} pending`} icon={<XCircle />} accent="purple" />
    </div>
  );
}
