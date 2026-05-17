import { CheckCircle2, Clock, FolderKanban, FolderOpen, UserCheck, Users, WalletCards, XCircle } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatMoney } from "@/lib/formatters";
import type { AdminDashboardData } from "@/types";

export function AdminStatsCards({ data }: { data: AdminDashboardData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total users" value={String(data.totalUsers)} numericValue={data.totalUsers} icon={<Users />} accent="blue" />
        <DashboardCard title="Active users" value={String(data.activeUsers)} numericValue={data.activeUsers} icon={<UserCheck />} accent="green" />
        <DashboardCard title="Total collections" value={String(data.totalCollections)} numericValue={data.totalCollections} icon={<FolderKanban />} accent="gold" />
        <DashboardCard title="Active collections" value={String(data.activeCollections)} numericValue={data.activeCollections} icon={<FolderOpen />} accent="green" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total collected" value={formatMoney(data.totalCollected)} numericValue={data.totalCollected} formatValue={(v) => formatMoney(v)} icon={<WalletCards />} accent="gold" />
        <DashboardCard title="Completed payments" value={String(data.completedPayments)} numericValue={data.completedPayments} icon={<CheckCircle2 />} accent="green" />
        <DashboardCard title="Pending payments" value={String(data.pendingPayments)} numericValue={data.pendingPayments} icon={<Clock />} accent="purple" />
        <DashboardCard title="Failed payments" value={String(data.failedPayments)} numericValue={data.failedPayments} icon={<XCircle />} accent="red" />
      </div>
    </div>
  );
}
