"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { profileSchema } from "@/lib/validations";
import { authApi } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api";

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (user) form.reset({ fullName: user.fullName, phoneNumber: user.phoneNumber, email: user.email });
  }, [user, form]);

  const save = async (values: ProfileValues) => {
    setLoading(true);
    try {
      const response = await authApi.updateProfile(values);
      setUser(response.data.user);
      toast.success("Profile updated.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to save profile."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Account settings" title="Profile" description="Keep your member profile details current." />
      <Card className="max-w-2xl border-white/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-14 border border-white/70 shadow-lg"><AvatarFallback className="bg-[#0B1F3A] text-white">{user?.fullName?.slice(0, 2).toUpperCase() ?? "SP"}</AvatarFallback></Avatar>
            <div>
              <CardTitle>{user?.fullName ?? "SarafuPay member"}</CardTitle>
              <p className="text-sm text-muted-foreground">Secure HTTP-only session active</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" method="post" onSubmit={form.handleSubmit(save)}>
            {["fullName", "phoneNumber", "email"].map((name) => (
              <div key={name} className="flex flex-col gap-2">
                <Label htmlFor={name}>{name === "fullName" ? "Full name" : name === "phoneNumber" ? "Phone number" : "Email"}</Label>
                <Input id={name} {...form.register(name as keyof ProfileValues)} />
              </div>
            ))}
            <Button className="h-11 rounded-2xl bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] text-white shadow-lg shadow-green-700/20 hover:brightness-105" disabled={loading}>{loading ? "Saving..." : "Save profile"}</Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </DashboardShell>
  );
}
