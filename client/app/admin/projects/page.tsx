"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { api, getApiErrorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/formatters";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Project } from "@/types";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    api<{ projects: Project[] }>("/api/projects")
      .then((res) => {
        setProjects(res.data.projects);
        setError("");
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Unable to load projects.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardShell admin>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Contribution projects" title="Projects" description="Create and review contribution projects." />
        <Card className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl"><CardHeader><CardTitle>Create project</CardTitle></CardHeader><CardContent><ProjectForm onCreated={load} /></CardContent></Card>
        {loading && <LoadingState label="Loading projects..." />}
        {error && <ErrorState message={error} action={<Button className="rounded-2xl" variant="outline" onClick={() => window.location.reload()}>Retry</Button>} />}
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => <Card key={project._id} className="border-white/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl"><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{project.title}</CardTitle><StatusBadge status={project.status} /></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{project.description}</p><p className="mt-3 text-lg font-bold text-[#0B1F3A]">{formatMoney(project.monthlyContributionAmount)} monthly</p></CardContent></Card>)}
        </div>
        {!loading && !error && !projects.length && <EmptyState title="No projects yet." description="Create the first contribution project above." />}
      </div>
    </DashboardShell>
  );
}
