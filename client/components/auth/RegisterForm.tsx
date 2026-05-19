"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
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
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${level >= i ? colors[level] : "bg-slate-200"}`}
          />
        ))}
      </div>
      {level > 0 && (
        <p className={`text-xs font-semibold ${level === 3 ? "text-emerald-600" : level === 2 ? "text-amber-500" : "text-red-500"}`}>
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
  const [redirecting, setRedirecting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", phoneNumber: "", email: "", password: "", confirmPassword: "" }
  });

  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  const onSubmit = async (values: RegisterValues) => {
    setApiError(null);
    setLoading(true);
    try {
      const response = await authApi.register(values);
      setUser(response.data.user);
      setRedirecting(true);
      router.push("/dashboard");
    } catch (error: unknown) {
      setApiError(getApiErrorMessage(error, "Registration failed. Please try again."));
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      {/* Card header */}
      <div className="border-b border-slate-100 px-7 py-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#035034]">Create your account</h2>
        <p className="mt-1.5 text-sm font-medium text-slate-500">Start collecting payments from your group today.</p>
      </div>

      {/* Redirecting state */}
      {redirecting ? (
        <div className="flex flex-col items-center gap-4 px-7 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#035034]/8">
            <Loader2 className="size-7 animate-spin text-[#035034]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#035034]">Setting up your workspace…</p>
            <p className="mt-1 text-xs text-slate-400">Just a moment</p>
          </div>
        </div>
      ) : (
        <div className="px-7 py-6">
          <form className="flex flex-col gap-4" method="post" onSubmit={form.handleSubmit(onSubmit)}>

            {/* API error alert */}
            {apiError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{apiError}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-semibold text-[#035034]">Full name</label>
              <Input
                id="fullName"
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
                placeholder="e.g. James Kimani"
                {...form.register("fullName")}
                aria-invalid={!!form.formState.errors.fullName}
              />
              {form.formState.errors.fullName && (
                <p className="text-xs font-medium text-red-500">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phoneNumber" className="text-sm font-semibold text-[#035034]">Phone number</label>
              <Input
                id="phoneNumber"
                type="tel"
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
                placeholder="e.g. 0712 345 678"
                {...form.register("phoneNumber")}
                aria-invalid={!!form.formState.errors.phoneNumber}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-xs font-medium text-red-500">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-[#035034]">Email</label>
              <Input
                id="email"
                type="email"
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
                placeholder="e.g. james@example.com"
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="text-xs font-medium text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-[#035034]">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="h-12 rounded-2xl border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
                  placeholder="Min. 8 characters"
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
              <PasswordStrengthBar password={password} />
              {form.formState.errors.password && (
                <p className="text-xs font-medium text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-[#035034]">Confirm password</label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="h-12 rounded-2xl border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-[#035034]/50 focus-visible:ring-[#035034]/10"
                  placeholder="Repeat your password"
                  {...form.register("confirmPassword")}
                  aria-invalid={!!form.formState.errors.confirmPassword}
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
              {form.formState.errors.confirmPassword && (
                <p className="text-xs font-medium text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#035034] text-sm font-bold text-white shadow-lg shadow-[#035034]/25 transition-all hover:bg-[#024028] hover:shadow-xl disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#035034] hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <LockKeyhole className="size-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Free to start · Secured by Snippe</span>
          </div>
        </div>
      )}
    </div>
  );
}
