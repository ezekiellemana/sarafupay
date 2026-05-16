"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Building2, MapPin, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const watched = form.watch();

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        businessName: user.businessName ?? "",
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl ?? ""
      });
    }
  }, [user, form]);

  const save = async (values: ProfileValues) => {
    setLoading(true);
    try {
      const response = await authApi.updateProfile({
        ...values,
        businessName: values.businessName || undefined,
        bio: values.bio || undefined,
        avatarUrl: values.avatarUrl || undefined
      });
      setUser(response.data.user);
      toast.success("Profile updated.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to save profile."));
    } finally {
      setLoading(false);
    }
  };

  const displayName = watched.businessName?.trim() || user?.fullName?.split(" ")[0] || "Your Name";
  const initials = (user?.fullName ?? "SP").slice(0, 2).toUpperCase();

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Account settings" title="Profile" description="Manage your account details and public business profile." />

        <form className="flex flex-col gap-6" method="post" onSubmit={form.handleSubmit(save)}>
          {/* ── Section 1: Account Details ── */}
          <Card className="max-w-2xl border-white/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="size-14 border border-white/70 shadow-lg">
                  {watched.avatarUrl && <AvatarImage src={watched.avatarUrl} alt={user?.fullName} />}
                  <AvatarFallback className="bg-[#071a0e] text-white text-lg font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="size-4 text-muted-foreground" />
                    Account Details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Your login and contact information.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input id="fullName" placeholder="John Doe" className="rounded-2xl" {...form.register("fullName")} />
                {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phoneNumber">Phone number *</Label>
                  <Input id="phoneNumber" type="tel" placeholder="0712345678" className="rounded-2xl" {...form.register("phoneNumber")} />
                  {form.formState.errors.phoneNumber && <p className="text-sm text-destructive">Use a valid Tanzanian phone number.</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="you@example.com" className="rounded-2xl" {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 2: Business / Public Profile ── */}
          <Card className="max-w-2xl border-white/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-amber-600" />
                Business / Public Profile
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Shown publicly on your collection pages. Phone and email are never shared.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessName">Display / Business name</Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Juma wa Mama Events, Chama cha Matumaini"
                  className="rounded-2xl"
                  {...form.register("businessName")}
                />
                <p className="text-xs text-muted-foreground">Shown as "Organized by …" on public payment pages.</p>
                {form.formState.errors.businessName && <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bio">Short description</Label>
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="e.g. We organize group savings and events for families in Dar es Salaam."
                  {...form.register("bio")}
                  className="rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="avatarUrl">Avatar / Logo URL <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  className="rounded-2xl"
                  {...form.register("avatarUrl")}
                />
                {form.formState.errors.avatarUrl && <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>}
              </div>

              {/* Preview */}
              {(watched.businessName || watched.bio || watched.avatarUrl) && (
                <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                    <MapPin className="mr-1 inline size-3" />
                    Public preview
                  </p>
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0 border border-amber-200/60">
                      {watched.avatarUrl && <AvatarImage src={watched.avatarUrl} alt={displayName} />}
                      <AvatarFallback className="bg-[#071a0e] text-white text-sm font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#071a0e]">Organized by {displayName}</p>
                      {watched.bio && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{watched.bio}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="max-w-2xl">
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-2xl bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] text-white shadow-lg shadow-green-700/20 hover:brightness-105"
            >
              {loading ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
