"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Folders, FolderKanban, History, LogOut, Shield, User, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletIllustration } from "@/components/shared/illustrations/WalletIllustration";
import { adminNav, memberNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const icons: Record<string, React.ReactNode> = {
  Dashboard: <BarChart3 />,
  "My Projects": <Folders />,
  Payments: <History />,
  Project: <FolderKanban />,
  Profile: <User />,
  "Platform Overview": <Shield />,
  Projects: <FolderKanban />,
  Members: <Users />
};

export function AppSidebar({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const items = admin ? adminNav : memberNav;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#071a0e]/95 p-4 text-sidebar-foreground shadow-2xl shadow-green-950/20 backdrop-blur-xl lg:flex">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5 text-lg font-semibold text-white">
        <span className="relative flex size-10 items-center justify-center rounded-xl bg-primary coin-glow">
          <WalletCards className="size-5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-white">SarafuPay</span>
          <span className="text-[10px] sarafu-gradient-text-gold font-semibold">Lipa kwa urahisi</span>
        </div>
      </Link>

      {/* Role badge */}
      {user && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {user.fullName?.[0]?.toUpperCase() ?? "U"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white/90">{user.fullName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              {user.role === "admin" ? "Platform Admin" : "Member"}
            </p>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-linear-to-r from-primary/80 via-emerald-400/70 to-amber-400/30 text-white shadow-lg shadow-green-500/20"
                  : "text-sidebar-foreground/70 hover:bg-white/8 hover:text-white"
              )}
            >
              <span className={cn("size-4.5", active ? "text-white" : "text-sidebar-foreground/60")}>
                {icons[item.label]}
              </span>
              {item.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-amber-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Wallet illustration */}
      <div className="my-4 flex justify-center opacity-30">
        <WalletIllustration size={72} animate={false} />
      </div>

      <Button
        variant="ghost"
        className="h-11 justify-start rounded-2xl text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
        onClick={logout}
      >
        <LogOut data-icon="inline-start" />
        Logout
      </Button>
    </aside>
  );
}
