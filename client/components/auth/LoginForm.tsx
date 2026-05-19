"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validations";
import { authApi } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/admin");
  }, [router]);

  const onSubmit = async (values: LoginValues) => {
    setApiError(null);
    setLoading(true);
    try {
      const response = await authApi.login(values);
      setUser(response.data.user);
      setHydrated(true);
      const nextParam = search.get("next");
      const safeNext = nextParam?.startsWith("/") ? nextParam : null;
      const destination = safeNext ?? (response.data.user.role === "admin" ? "/admin" : "/dashboard");
      router.push(destination);
    } catch (error: unknown) {
      setApiError(getApiErrorMessage(error, "Login failed. Please check your credentials."));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      {/* Card header */}
      <div className="border-b border-slate-100 px-7 py-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#035034]">Welcome back</h2>
        <p className="mt-1.5 text-sm font-medium text-slate-500">Sign in to manage your collections.</p>
      </div>

      <div className="px-7 py-6">
        <form className="flex flex-col gap-5" method="post" onSubmit={form.handleSubmit(onSubmit)}>

          {/* API error alert */}
          {apiError && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{apiError}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="identifier" className="text-sm font-semibold text-[#035034]">
              Email or phone number
            </label>
            <Input
              id="identifier"
              className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
              placeholder="e.g. email@example.com"
              {...form.register("identifier")}
              aria-invalid={!!form.formState.errors.identifier}
            />
            {form.formState.errors.identifier && (
              <p className="text-xs font-medium text-red-500">{form.formState.errors.identifier.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-[#035034]">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
                placeholder="Your password"
                {...form.register("password")}
                aria-invalid={!!form.formState.errors.password}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#035034]"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs font-medium text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#035034] text-sm font-bold text-white shadow-lg shadow-[#035034]/25 transition-all hover:bg-[#024028] hover:shadow-xl disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New to SarafuPay?{" "}
          <Link href="/register" className="font-semibold text-[#035034] hover:underline">
            Create Account
          </Link>
        </p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <LockKeyhole className="size-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Secured by Snippe · Webhook-verified payments</span>
        </div>
      </div>
    </div>
  );
}
