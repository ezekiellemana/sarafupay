"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Clock3, Folders, Plus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ContributionProgress } from "@/components/dashboard/ContributionProgress";
import { PaymentStatusCard } from "@/components/dashboard/PaymentStatusCard";
import { RecentPaymentsTable } from "@/components/dashboard/RecentPaymentsTable";
import { WalletSummary } from "@/components/dashboard/WalletSummary";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradientButton } from "@/components/shared/GradientButton";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useCollections } from "@/hooks/useCollections";
import { formatDate, formatMoney } from "@/lib/formatters";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboard();
  const { collections, loading: collectionsLoading } = useCollections();

  const activeCollections = collections.filter((c) => c.status === "active" || c.status === "paused");
  const totalAcrossCollections = collections.reduce((sum, c) => sum + c.totalCollected, 0);
  const totalContributors = collections.reduce((sum, c) => sum + c.contributorCount, 0);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Member wallet"
          title={`Welcome back, ${user?.fullName?.split(" ")[0] ?? "member"}`}
          description="Your contributions and collection overview."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/collections/new">
                <GradientButton>
                  <Plus className="size-4" /> Create Project
                </GradientButton>
              </Link>
              <Link href="/payment/start">
                <GradientButton btnVariant="gold">Pay This Month</GradientButton>
              </Link>
            </div>
          }
        />

        {/* My Collections quick stats */}
        {!collectionsLoading && collections.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folders className="size-5 text-[#16a34a]" />
                <h2 className="text-lg font-bold text-[#071a0e]">My Projects & Events</h2>
              </div>
              <Link href="/dashboard/collections">
                <Button variant="ghost" className="text-sm text-[#16a34a] hover:text-[#16a34a] hover:bg-green-50">View all →</Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Received", value: formatMoney(totalAcrossCollections), sub: `across ${collections.length} project(s)`, color: "border-green-100/60 bg-green-50/60 text-[#16a34a]" },
                { label: "Active Projects", value: String(activeCollections.length), sub: "currently accepting payments", color: "border-amber-100/60 bg-amber-50/60 text-amber-700" },
                { label: "Total Contributors", value: String(totalContributors), sub: "across all projects", color: "border-blue-100/60 bg-blue-50/40 text-[#071a0e]" }
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={`rounded-3xl border px-5 py-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl ${stat.color}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {collections.slice(0, 3).map((c) => <CollectionCard key={c._id} collection={c} />)}
            </div>
            {collections.length > 3 && (
              <div className="text-center">
                <Link href="/dashboard/collections">
                  <Button variant="ghost" className="text-[#16a34a]">View all {collections.length} projects →</Button>
                </Link>
              </div>
            )}
          </section>
        )}

        {!collectionsLoading && collections.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-dashed border-green-200/60 bg-green-50/30 p-8 text-center">
            <Folders className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="font-semibold text-[#071a0e]">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first money collection project or event.</p>
            <Link href="/dashboard/collections/new" className="mt-4 inline-block">
              <GradientButton><Plus className="size-4" /> Create Project/Event</GradientButton>
            </Link>
          </motion.div>
        )}

        {/* Group contribution wallet */}
        {loading && <LoadingState />}
        {error && <ErrorState message={error} action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>} />}
        {data && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <WalletCards className="size-5 text-amber-600" />
              <h2 className="text-lg font-bold text-[#071a0e]">My Contribution Wallet</h2>
            </div>
            <WalletSummary totalPaid={data.totalPaid} remainingAmount={data.remainingAmount} progress={data.contributionProgressPercentage} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard title="Total Paid" value={formatMoney(data.totalPaid)} numericValue={data.totalPaid} formatValue={(v) => formatMoney(v)} icon={<WalletCards />} accent="gold" />
              <PaymentStatusCard status={data.currentMonthPaymentStatus} />
              <DashboardCard title="Last Payment" value={data.lastPayment ? formatMoney(data.lastPayment.amount) : "No payment"} description={data.lastPayment ? formatDate(data.lastPayment.createdAt) : "No payments yet"} icon={<CheckCircle2 />} accent="green" />
              <DashboardCard title="Next Due Date" value={formatDate(data.nextDueDate)} description="Due by the 5th day" icon={<CalendarClock />} accent="purple" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <ContributionProgress value={data.contributionProgressPercentage} />
              <DashboardCard title="Remaining Balance" value={formatMoney(data.remainingAmount)} description={`${data.missedMonths.length} missed month(s) tracked`} icon={<Clock3 />} />
            </div>
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#071a0e]">Latest payments</h2>
                <Link href="/dashboard/payments"><Button variant="ghost">View Payment History</Button></Link>
              </div>
              <RecentPaymentsTable payments={data.recentPayments} />
            </section>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
