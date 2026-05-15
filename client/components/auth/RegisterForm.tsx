"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
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
  const strength = password.length >= 12 ? "Strong password" : password.length >= 8 ? "Good start" : "Use at least 8 characters";

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
          {[
            ["fullName", "Full name", "text"],
            ["phoneNumber", "Phone number", "tel"],
            ["email", "Email", "email"],
            ["password", "Password", "password"],
            ["confirmPassword", "Confirm password", "password"]
          ].map(([name, label, type]) => (
            <div key={name} className="flex flex-col gap-2">
              <Label htmlFor={name}>{label}</Label>
              <div className="relative">
                <Input id={name} type={type === "password" ? (showPassword ? "text" : "password") : type} className={type === "password" ? "pr-11" : undefined} {...form.register(name as keyof RegisterValues)} aria-invalid={!!form.formState.errors[name as keyof RegisterValues]} />
                {type === "password" && name === "password" && (
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </div>
              {name === "password" && <p className="text-xs text-muted-foreground">{strength}</p>}
              {form.formState.errors[name as keyof RegisterValues] && <p className="text-sm text-destructive">{form.formState.errors[name as keyof RegisterValues]?.message}</p>}
            </div>
          ))}
          <Button className="h-11 rounded-2xl bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] text-white shadow-lg shadow-green-700/20 hover:brightness-105" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <Link className="font-medium text-primary" href="/login">Login</Link>
        </p>
      </CardContent>
    </Card>
  );
}
