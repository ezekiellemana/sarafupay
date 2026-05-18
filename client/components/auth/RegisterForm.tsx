"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validations";
import { authApi } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type RegisterValues = z.infer<typeof registerSchema>;

function PasswordStrengthBar({ password }: { password: string }) {
  const len = password.length;
  const level = len >= 12 ? 3 : len >= 8 ? 2 : len > 0 ? 1 : 0;
  const colors = ["bg-slate-200", "bg-red-400", "bg-amber-400", "bg-emerald-500"];
  const labels = ["", "Too short", "Good start", "Strong"];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${level >= i ? colors[level] : "bg-slate-200"}`}
          />
        ))}
      </div>
      {level > 0 && (
        <p className={`text-xs font-medium ${level === 3 ? "text-emerald-600" : level === 2 ? "text-amber-600" : "text-red-500"}`}>
          {labels[level]}
        </p>
      )}
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", phoneNumber: "", email: "", password: "", confirmPassword: "" }
  });

  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const response = await authApi.register(values);
      setUser(response.data.user);
      toast.success(response.message);
      router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg border-white/70 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#0B1F3A]">Create your SarafuPay account</CardTitle>
        <CardDescription>Start tracking your monthly contributions with ease.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName" className="text-sm font-semibold text-[#0B1F3A]">Full name</Label>
            <Input id="fullName" className="h-11 rounded-2xl" {...form.register("fullName")} aria-invalid={!!form.formState.errors.fullName} />
            {form.formState.errors.fullName && <p className="text-xs font-medium text-destructive">{form.formState.errors.fullName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phoneNumber" className="text-sm font-semibold text-[#0B1F3A]">Phone number</Label>
            <Input id="phoneNumber" type="tel" className="h-11 rounded-2xl" {...form.register("phoneNumber")} aria-invalid={!!form.formState.errors.phoneNumber} />
            {form.formState.errors.phoneNumber && <p className="text-xs font-medium text-destructive">{form.formState.errors.phoneNumber.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-[#0B1F3A]">Email</Label>
            <Input id="email" type="email" className="h-11 rounded-2xl" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
            {form.formState.errors.email && <p className="text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm font-semibold text-[#0B1F3A]">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} className="h-11 rounded-2xl pr-11" {...form.register("password")} aria-invalid={!!form.formState.errors.password} />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
            {form.formState.errors.password && <p className="text-xs font-medium text-destructive">{form.formState.errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#0B1F3A]">Confirm password</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} className="h-11 rounded-2xl pr-11" {...form.register("confirmPassword")} aria-invalid={!!form.formState.errors.confirmPassword} />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && <p className="text-xs font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>}
          </div>

          <Button className="h-11 rounded-2xl bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] text-white shadow-lg shadow-green-700/20 hover:brightness-105" type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating account…</> : "Create Account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link className="font-medium text-primary" href="/login">Login</Link>
        </p>
      </CardContent>
    </Card>
  );
}
