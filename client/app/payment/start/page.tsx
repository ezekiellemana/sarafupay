"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, LockKeyhole, Loader2, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatMoney, currentMonth } from "@/lib/formatters";
import type { Project } from "@/types";

export default function PaymentStartPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ projects: Project[] }>("/api/projects").then((res) => {
      setProjects(res.data.projects);
      setProjectId(res.data.projects.find((project) => project.status === "active")?._id ?? res.data.projects[0]?._id ?? "");
    });
  }, []);

  const selected = projects.find((project) => project._id === projectId);

  const startPayment = async () => {
    setLoading(true);
    try {
      const response = await api<{ checkout_url: string; payment_url: string }>("/api/payments/create-session", {
        method: "POST",
        body: JSON.stringify({ projectId, monthPaidFor: currentMonth() })
      });
      window.location.href = response.data.checkout_url ?? response.data.payment_url;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to create Snippe checkout."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader
          eyebrow="Secure checkout"
          title="Pay Monthly Contribution"
          description="Review your project, contribution month, and amount before continuing to Snippe."
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
          {/* Background glows */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-52 rounded-full bg-[#C4A237]/8 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 size-40 rounded-full bg-[#19A254]/8 blur-3xl" />

          <div className="relative flex flex-col gap-5 p-6 md:p-8">
            {/* Section title */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#035034]/8">
                <ShieldCheck className="size-4.5 text-[#035034]" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#035034]">Snippe hosted checkout</p>
                <p className="text-xs font-medium text-slate-500">You will be redirected to complete payment securely.</p>
              </div>
            </div>

            {/* Amount banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#035034] p-5 text-white">
              <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-[#C4A237]/15 blur-2xl" />
              <p className="text-xs font-medium text-white/70">Monthly contribution amount</p>
              <p className="mt-1.5 text-4xl font-black tracking-tight text-[#C4A237]">
                {selected ? formatMoney(selected.monthlyContributionAmount) : "—"}
              </p>
            </div>

            {/* Project selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#035034]">Project</label>
              <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "")}>
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm shadow-sm">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectGroup>
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>{project.title}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Info row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <CalendarDays className="size-5 shrink-0 text-[#C4A237]" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Contribution month</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#035034]">{currentMonth()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#19A254]" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Secure payment</p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-700/80">Redirected to Snippe for safe checkout.</p>
                </div>
              </div>
            </div>

            {/* CTA button */}
            <button
              type="button"
              disabled={!projectId || loading}
              onClick={startPayment}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#035034] text-sm font-bold text-white shadow-lg shadow-[#035034]/25 transition-all hover:bg-[#024028] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating session…
                </>
              ) : (
                "Continue to Snippe Payment"
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <LockKeyhole className="size-3.5 shrink-0" />
              <span>Records update only after Snippe webhook confirmation.</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
