"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/shared/PageTransition";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { useAuth } from "@/hooks/useAuth";

function ShellSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#035034]" />
    </div>
  );
}

export function DashboardShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (admin && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    if (!admin && user.role === "admin") {
      router.replace("/admin");
    }
  }, [admin, hydrated, router, user]);

  if (!hydrated) return <ShellSpinner />;

  const shouldRedirect =
    !user ||
    (admin && user.role !== "admin") ||
    (!admin && user.role === "admin");

  if (shouldRedirect) return <ShellSpinner />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <FloatingBlobBackground />
      <AppSidebar admin={admin} />
      <main className="pb-32 lg:ml-64 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-10">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <MobileNav admin={admin} />
    </div>
  );
}
