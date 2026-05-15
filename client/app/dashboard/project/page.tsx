"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradientButton } from "@/components/shared/GradientButton";
import { AnimatedProgressBar } from "@/components/shared/AnimatedProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { formatDate, formatMoney } from "@/lib/formatters";

export default function ProjectPage() {
  const { data, loading } = useDashboard();
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Contribution project" title="Project Details" description="Monthly contribution project details, rules, and your progress." />
        {loading && <LoadingState />}
        {data && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-2xl font-bold">{data.project.title}</CardTitle><StatusBadge status={data.project.status} /></div></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-muted-foreground">{data.project.description}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="Target amount" value={formatMoney(data.project.targetAmount ?? 0)} />
                  <Info label="Monthly contribution" value={formatMoney(data.project.monthlyContributionAmount)} />
                  <Info label="Start date" value={formatDate(data.project.startDate)} />
                  <Info label="End date" value={formatDate(data.project.endDate)} />
                  <Info label="Project status" value={data.project.status} />
                  <Info label="Your progress" value={`${data.contributionProgressPercentage}%`} />
                </div>
                <AnimatedProgressBar value={data.contributionProgressPercentage} />
                <Link href="/payment/start"><GradientButton>Pay This Month</GradientButton></Link>
              </CardContent>
            </Card>
            <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
              <CardHeader><CardTitle>Project rules</CardTitle></CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {(data.project.rules?.length ? data.project.rules : ["Monthly contributions are due by the 5th day of each month."]).map((rule) => <li key={rule} className="rounded-lg bg-background p-3">{rule}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/70 bg-background/80 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
