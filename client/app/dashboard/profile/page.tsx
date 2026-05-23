"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Building2, Loader2, Phone, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { profileSchema } from "@/lib/validations";
import { authApi } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api";

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });
  const [watchedBusiness, watchedPhone, watchedAvatarUrl, watchedBio, watchedFullName] =
    form.watch(["businessName", "phoneNumber", "avatarUrl", "bio", "fullName"]);

  useEffect(() => {
    if (user) {
      form.reset({
        fullName:     user.fullName,
        phoneNumber:  user.phoneNumber ?? "",
        businessName: user.businessName ?? "",
        bio:          user.bio ?? "",
        avatarUrl:    user.avatarUrl ?? ""
      });
    }
  }, [user, form]);

  const save = async (values: ProfileValues) => {
    setLoading(true);
    try {
      const response = await authApi.updateProfile({
        ...values,
        phoneNumber:  values.phoneNumber  || undefined,
        businessName: values.businessName || undefined,
        bio:          values.bio          || undefined,
        avatarUrl:    values.avatarUrl    || undefined
      });
      setUser(response.data.user);
      toast.success("Profile updated.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to save profile."));
    } finally {
      setLoading(false);
    }
  };

  const displayName  = watchedBusiness?.trim() || user?.fullName?.split(" ")[0] || "Your Name";
  const initials     = (watchedFullName ?? user?.fullName ?? "SP").slice(0, 2).toUpperCase();
  const missingPhone = !watchedPhone?.trim();

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">

        {/* ── Inline header ─────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">Account settings</p>
          <h1 className="text-2xl font-extrabold text-[#071a0e] sm:text-3xl">Profile</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your account details and public presence.
          </p>
        </div>

        {/* ── Single connected form panel ───────────────────────────── */}
        <form method="post" onSubmit={form.handleSubmit(save)}>
          <div className="max-w-2xl overflow-hidden rounded-2xl border border-[#e5e0d6] bg-white shadow-sm shadow-[#0a1f12]/4">

            {/* Panel header: avatar + title */}
            <div className="flex items-center gap-4 px-6 py-5">
              <Avatar className="size-14 shrink-0 border border-[#e5e0d6] shadow-sm">
                {watchedAvatarUrl && <AvatarImage src={watchedAvatarUrl} alt={user?.fullName} />}
                <AvatarFallback className="bg-[#071a0e] text-lg font-bold text-white">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-bold text-[#071a0e]">{user?.fullName ?? "Your Profile"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* ── Section 1: Account ──────────────────────────────────── */}
            <div className="border-t border-[#e5e0d6] px-6 py-5">
              <div className="mb-4 flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</p>
              </div>
              <div className="flex flex-col gap-4">

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-[#071a0e]">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    className="h-11 rounded-2xl"
                    {...form.register("fullName")}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-[#071a0e]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    readOnly
                    value={user?.email ?? ""}
                    onChange={() => {}}
                    className="h-11 cursor-not-allowed rounded-2xl bg-slate-50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed by your login method. Contact support to change it.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold text-[#071a0e]">
                    Phone number{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0712345678"
                    className="h-11 rounded-2xl"
                    {...form.register("phoneNumber")}
                  />
                  {form.formState.errors.phoneNumber ? (
                    <p className="text-xs font-medium text-destructive">Use a valid Tanzanian phone number (e.g. 0712345678).</p>
                  ) : missingPhone ? (
                    <p className="flex items-center gap-1 text-xs text-amber-600">
                      <Phone className="size-3" />
                      Add your phone number so contributors can reach you when needed.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── Section 2: Public Profile ────────────────────────────── */}
            <div className="border-t border-[#e5e0d6] px-6 py-5">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="size-4 text-amber-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Public Profile</p>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Shown on your public collection pages. Phone and email are never shared.
              </p>
              <div className="flex flex-col gap-4">

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="businessName" className="text-sm font-semibold text-[#071a0e]">
                    Display / Business name{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Juma wa Mama Events, Chama cha Matumaini"
                    className="h-11 rounded-2xl"
                    {...form.register("businessName")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown as &quot;Organized by &hellip;&quot; on public payment pages.
                  </p>
                  {form.formState.errors.businessName && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.businessName.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio" className="text-sm font-semibold text-[#071a0e]">
                    Short description{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <textarea
                    id="bio"
                    rows={3}
                    placeholder="e.g. We organize group savings and events for families in Dar es Salaam."
                    {...form.register("bio")}
                    className="resize-none rounded-2xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {form.formState.errors.bio && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.bio.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="avatarUrl" className="text-sm font-semibold text-[#071a0e]">
                    Avatar / Logo URL{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    className="h-11 rounded-2xl"
                    {...form.register("avatarUrl")}
                  />
                  {form.formState.errors.avatarUrl && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.avatarUrl.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 3: Preview ──────────────────────────────────── */}
            <div className="border-t border-[#e5e0d6] px-6 py-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Public preview
              </p>
              <div className="rounded-2xl border border-amber-200 bg-[#fffbf0] p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 shrink-0 border border-amber-200">
                    {watchedAvatarUrl && <AvatarImage src={watchedAvatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-[#071a0e] text-sm font-bold text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#071a0e]">Organized by {displayName}</p>
                    {watchedBio ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{watchedBio}</p>
                    ) : (
                      <p className="mt-0.5 text-xs italic text-slate-400">Add a description to appear here.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Save button ─────────────────────────────────────────── */}
            <div className="border-t border-[#e5e0d6] px-6 py-5">
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-2xl bg-[#035034] text-white shadow-md shadow-[#035034]/20 hover:bg-[#024028]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : "Save profile"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
