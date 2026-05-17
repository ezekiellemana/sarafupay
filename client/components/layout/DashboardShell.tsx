"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/shared/PageTransition";
import { LoadingState } from "@/components/shared/LoadingState";
import { FloatingBlobBackground } from "@/components/shared/FloatingBlobBackground";
import { useAuth } from "@/hooks/useAuth";

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

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pb-24 lg:ml-64 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
            <LoadingState label="Loading your workspace..." />
          </div>
        </main>
      </div>
    );
  }

  const shouldRedirect =
    !user ||
    (admin && user.role !== "admin") ||
    (!admin && user.role === "admin");

  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pb-24 lg:ml-64 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
            <LoadingState label="Redirecting..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <FloatingBlobBackground />
      <AppSidebar admin={admin} />
      <main className="pb-24 lg:ml-64 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <MobileNav admin={admin} />
    </div>
  );
}
