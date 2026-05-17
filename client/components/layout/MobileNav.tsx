"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Folders, FolderKanban, History, Shield, User, Users } from "lucide-react";
import { adminNav, memberNav } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <BarChart3 />,
  "My Projects": <Folders />,
  Payments: <History />,
  Project: <FolderKanban />,
  Profile: <User />,
  "Platform Overview": <Shield />,
  Projects: <FolderKanban />,
  Members: <Users />,
};

export function MobileNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const items = (admin ? adminNav : memberNav).slice(0, 4);

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-white/70 bg-white/92 px-2 py-1.5 shadow-2xl shadow-slate-900/15 backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-2xl py-2.5 text-xs font-medium transition-all",
              active
                ? "bg-linear-to-b from-amber-400/30 to-amber-400/10 text-amber-700"
                : "text-slate-500 hover:text-[#0B1F3A]",
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-dot"
                className="absolute -top-px size-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60"
              />
            )}
            <motion.span
              animate={active ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "size-5.5",
                active ? "text-amber-600" : "text-slate-400",
              )}
            >
              {iconMap[item.label]}
            </motion.span>
            <span className={cn("truncate", active ? "font-semibold" : "font-medium")}>
              {item.label.replace("Platform ", "")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
