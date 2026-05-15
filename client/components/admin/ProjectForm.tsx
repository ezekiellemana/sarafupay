"use client";

import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getApiErrorMessage } from "@/lib/api";

type ProjectFormState = {
  title: string;
  description: string;
  targetAmount: string;
  monthlyContributionAmount: string;
  startDate: string;
  endDate: string;
  status: string;
};

type FieldConfig = [keyof ProjectFormState, string, string];

export function ProjectForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProjectFormState>({ title: "", description: "", targetAmount: "", monthlyContributionAmount: "", startDate: "", endDate: "", status: "active" });
  const fields: FieldConfig[] = [
    ["title", "Project title", "text"],
    ["description", "Description", "text"],
    ["targetAmount", "Target amount", "number"],
    ["monthlyContributionAmount", "Monthly contribution", "number"],
    ["startDate", "Start date", "date"],
    ["endDate", "End date", "date"]
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api("/api/projects", { method: "POST", body: JSON.stringify(form) });
      toast.success("Project created.");
      onCreated();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to create project."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" method="post" onSubmit={submit}>
      {fields.map(([name, label, type]) => (
        <div key={name} className="flex flex-col gap-2">
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} type={type} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} />
        </div>
      ))}
      <Button className="md:col-span-2" disabled={loading}>{loading ? "Creating..." : "Create project"}</Button>
    </form>
  );
}
