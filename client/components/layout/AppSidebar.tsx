"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Folders,
  FolderKanban,
  History,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminNav, memberNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/shared/BrandLogo";

const icons: Record<string, React.ReactNode> = {
  Dashboard: <BarChart3 />,
  "Collections": <Folders />,
  Payments: <History />,
  Project: <FolderKanban />,
  Profile: <User />,
  "Platform Overview": <Shield />,
  Projects: <FolderKanban />,
  Members: <Users />,
  Activity: <Activity />,
  Settings: <Settings />,
};

export function AppSidebar({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const items = admin ? adminNav : memberNav;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.07] bg-[#071a0e]/97 p-4 text-sidebar-foreground shadow-2xl shadow-green-950/30 backdrop-blur-xl lg:flex">

      {/* ── Brand / Logo ── */}
      <Link
        href="/"
        className="mb-2 flex items-center rounded-2xl px-1 py-2 transition-opacity hover:opacity-80"
      >
        <BrandLogo variant="dark" height={44} />
      </Link>

      {/* Separator */}
      <div className="mb-4 border-t border-white/[0.07]" />

      {/* ── Role badge / User info ── */}
      {user && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-white/6 px-3 py-2.5 ring-1 ring-white/12">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/30 text-sm font-bold text-white ring-2 ring-primary/20">
            {user.fullName?.[0]?.toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.fullName}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {user.role === "admin" ? "Platform Admin" : "Member"}
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-linear-to-r from-primary/90 via-emerald-400/75 to-amber-400/35 text-white shadow-lg shadow-green-500/25"
                  : "text-sidebar-foreground/80 hover:bg-white/8 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center",
                  active ? "text-white" : "text-sidebar-foreground/65",
                )}
              >
                {icons[item.label]}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto size-2 shrink-0 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="mt-4 border-t border-white/[0.07] pt-3">
        <Button
          variant="ghost"
          className="h-10 w-full justify-start gap-3 rounded-2xl px-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-white/8 hover:text-white"
          onClick={logout}
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
