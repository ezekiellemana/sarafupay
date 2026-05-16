"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradientButton } from "@/components/shared/GradientButton";
import { CoinStack } from "@/components/shared/illustrations/CoinStack";
import { GoldCoin } from "@/components/shared/illustrations/GoldCoin";
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
        <PageHeader eyebrow="Secure checkout" title="Pay Monthly Contribution" description="Review your project, contribution month, and amount before continuing to Snippe." />

        <Card className="glass-premium relative overflow-hidden border-0 shadow-2xl shadow-slate-900/10">
          {/* Background glow */}
          <div className="absolute -right-10 -top-10 size-52 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -left-8 bottom-0 size-40 rounded-full bg-[#4ade80]/10 blur-3xl" />

          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-[#071a0e]">
              <Sparkles className="size-5 text-amber-500" />
              Snippe hosted checkout
            </CardTitle>
          </CardHeader>

          <CardContent className="relative flex flex-col gap-5">
            {/* Amount banner */}
            <div className="relative flex items-center justify-between overflow-hidden rounded-3xl bg-[#071a0e] p-5 text-white">
              <div className="absolute -right-6 -top-6 size-28 rounded-full bg-amber-400/10 blur-2xl" />
              <div>
                <p className="text-sm text-white/60">Monthly amount</p>
                <p className="mt-1 text-4xl font-bold sarafu-gradient-text-gold">
                  {selected ? formatMoney(selected.monthlyContributionAmount) : "—"}
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <CoinStack size={72} animate={false} />
              </motion.div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[#071a0e]">Project</label>
              <Select value={projectId} onValueChange={(value) => setProjectId(value ?? "")}>
                <SelectTrigger className="w-full rounded-2xl border-white/70 bg-white/80 backdrop-blur-sm">
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur-sm">
                <GoldCoin size={28} animate={false} />
                <div>
                  <p className="text-xs text-muted-foreground">Contribution month</p>
                  <p className="mt-0.5 font-semibold text-[#071a0e]">{currentMonth()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-4 text-emerald-800">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold">Secure payment</p>
                  <p className="mt-0.5 text-xs text-emerald-700/80">Redirected to Snippe for safe checkout.</p>
                </div>
              </div>
            </div>

            <GradientButton btnVariant="gold" disabled={!projectId || loading} onClick={startPayment} className="w-full">
              {loading ? "Creating session..." : "Continue to Snippe Payment"}
            </GradientButton>

            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5" />
              Records update only after Snippe webhook confirmation.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
