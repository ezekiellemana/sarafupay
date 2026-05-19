"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  FolderKanban,
  Folders,
  History,
  LogOut,
  MoreHorizontal,
  Settings,
  Shield,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ── Bottom bar fixed links (3 per role + More) ─────────────────────────────

const MEMBER_NAV = [
  { href: "/dashboard",             label: "Dashboard", icon: <BarChart3 className="size-5" /> },
  { href: "/dashboard/collections", label: "Projects",  icon: <Folders className="size-5" /> },
  { href: "/dashboard/payments",    label: "Payments",  icon: <History className="size-5" /> },
];

const ADMIN_NAV = [
  { href: "/admin",          label: "Overview", icon: <Shield className="size-5" /> },
  { href: "/admin/projects", label: "Projects", icon: <FolderKanban className="size-5" /> },
  { href: "/admin/payments", label: "Payments", icon: <History className="size-5" /> },
];

// ── More sheet items ────────────────────────────────────────────────────────

const MEMBER_MORE = [
  { href: "/dashboard/profile", label: "Profile", icon: <User className="size-5" /> },
];

const ADMIN_MORE = [
  { href: "/admin/members",  label: "Members",  icon: <Users className="size-5" /> },
  { href: "/admin/activity", label: "Activity", icon: <Activity className="size-5" /> },
  { href: "/admin/audit",    label: "Audit",    icon: <ShieldCheck className="size-5" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="size-5" /> },
];

const MEMBER_MORE_PATHS = ["/dashboard/profile"];
const ADMIN_MORE_PATHS  = ["/admin/members", "/admin/activity", "/admin/audit", "/admin/settings"];

// ── Component ───────────────────────────────────────────────────────────────

export function MobileNav({ admin = false }: { admin?: boolean }) {
  const pathname   = usePathname();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const navItems  = admin ? ADMIN_NAV  : MEMBER_NAV;
  const moreItems = admin ? ADMIN_MORE : MEMBER_MORE;
  const morePaths = admin ? ADMIN_MORE_PATHS : MEMBER_MORE_PATHS;
  const moreActive = morePaths.includes(pathname);

  return (
    <>
      {/* ── Floating bottom bar ──────────────────────────────────────────── */}
      <nav
        className="fixed inset-x-3 z-40 grid grid-cols-4 rounded-3xl border border-white/10 bg-[#071a0e]/95 px-1 shadow-2xl shadow-green-950/40 backdrop-blur-2xl lg:hidden"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] font-medium transition-colors duration-200",
                active ? "text-[#C4A237]" : "text-white/55 hover:text-white/75",
              )}
            >
              {active && (
                <>
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-2xl bg-[#C4A237]/12"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                  <motion.span
                    layoutId="mobile-nav-dot"
                    className="absolute top-1.5 size-1.5 rounded-full bg-[#C4A237] shadow-sm shadow-[#C4A237]/60"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                </>
              )}
              <span className="relative">{item.icon}</span>
              <span className={cn("relative truncate leading-none", active && "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] font-medium transition-colors duration-200",
            moreActive || moreOpen ? "text-[#C4A237]" : "text-white/55 hover:text-white/75",
          )}
        >
          {/* Pill only when path-active — avoids layoutId conflict with nav items */}
          {moreActive && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute inset-0 rounded-2xl bg-[#C4A237]/12"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative">
            <MoreHorizontal className="size-5" />
          </span>
          <span className={cn("relative leading-none", (moreActive || moreOpen) && "font-semibold")}>
            More
          </span>
        </button>
      </nav>

      {/* ── More sheet ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-30 bg-black/30 lg:hidden"
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet card — floats above the nav */}
            <motion.div
              key="more-sheet"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: 16,    opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-x-3 z-50 lg:hidden"
              style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/15">
                <div className="p-2">
                  {moreItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                          active
                            ? "bg-[#035034]/8 text-[#035034]"
                            : "text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        <span className={cn("shrink-0", active ? "text-[#035034]" : "text-slate-400")}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}

                  <div className="my-1.5 h-px bg-slate-100" />

                  <button
                    type="button"
                    onClick={() => { setMoreOpen(false); void logout(); }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="size-5 shrink-0 text-red-500" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
