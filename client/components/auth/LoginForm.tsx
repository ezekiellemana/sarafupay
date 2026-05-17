"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";
import { authApi } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      setUser(response.data.user);
      toast.success(response.message);
      const nextParam = search.get("next");
      const safeNext = nextParam?.startsWith("/") ? nextParam : null;
      const destination = safeNext ?? (response.data.user.role === "admin" ? "/admin" : "/dashboard");
      router.push(destination);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-white/70 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#0B1F3A]">Welcome back</CardTitle>
        <CardDescription>Login to continue managing your contributions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" method="post" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier">Email or phone number</Label>
            <Input id="identifier" {...form.register("identifier")} aria-invalid={!!form.formState.errors.identifier} />
            {form.formState.errors.identifier && <p className="text-sm text-destructive">{form.formState.errors.identifier.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} className="pr-11" {...form.register("password")} aria-invalid={!!form.formState.errors.password} />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
          </div>
          <Button className="h-11 rounded-2xl bg-linear-to-r from-[#052e16] via-[#16a34a] to-[#4ade80] text-white shadow-lg shadow-green-700/20 hover:brightness-105" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          New to SarafuPay? <Link className="font-medium text-primary" href="/register">Create Account</Link>
        </p>
      </CardContent>
    </Card>
  );
}
